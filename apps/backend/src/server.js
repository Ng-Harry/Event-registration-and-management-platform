import Fastify from 'fastify';
import cors from '@fastify/cors';

const app = Fastify({ logger: true });
await app.register(cors, { origin: true });

const db = {
  products: new Map(),
  inventory: new Map(),
  sales: [],
  invoices: [],
  wallet: { balance: 0, ledger: [] },
  alerts: []
};

const now = () => new Date().toISOString();

app.get('/health', async () => ({ ok: true, service: 'smartmart-backend', time: now() }));

// M2 Inventory
app.post('/api/products', async (request, reply) => {
  const { id, name, price = 0, category = 'General', stock = 0 } = request.body;
  if (!id || !name) return reply.code(400).send({ error: 'id and name required' });
  db.products.set(id, { id, name, price, category, createdAt: now() });
  db.inventory.set(id, { onHand: stock, reserved: 0, updatedAt: now() });
  return reply.code(201).send({ ok: true });
});

app.get('/api/inventory', async () => {
  return Array.from(db.products.values()).map((p) => ({
    ...p,
    ...(db.inventory.get(p.id) || { onHand: 0, reserved: 0 })
  }));
});

// M1 POS Sale with offline sync support
app.post('/api/sales', async (request, reply) => {
  const sale = request.body;
  if (!sale?.id || !Array.isArray(sale?.items)) return reply.code(400).send({ error: 'invalid sale payload' });

  for (const item of sale.items) {
    const inv = db.inventory.get(item.productId);
    if (!inv) return reply.code(400).send({ error: `unknown product ${item.productId}` });
    if (inv.onHand - inv.reserved < item.quantity) {
      return reply.code(400).send({ error: `insufficient stock for ${item.productId}` });
    }
  }

  for (const item of sale.items) {
    const inv = db.inventory.get(item.productId);
    inv.onHand -= item.quantity;
    inv.updatedAt = now();
  }

  db.sales.push({ ...sale, syncedAt: now() });
  db.wallet.balance += sale.total ?? 0;
  db.wallet.ledger.push({ id: `w_${sale.id}`, type: 'sale_settlement', amount: sale.total ?? 0, at: now() });
  return reply.code(201).send({ status: 'stored', count: db.sales.length });
});

app.get('/api/sales', async () => ({ sales: db.sales }));

// M8 Invoicing
app.post('/api/invoices', async (request, reply) => {
  const { customerName, items = [], dueDate } = request.body;
  if (!customerName || items.length === 0) return reply.code(400).send({ error: 'customerName and items required' });

  for (const item of items) {
    const inv = db.inventory.get(item.productId);
    if (!inv || inv.onHand - inv.reserved < item.quantity) {
      return reply.code(400).send({ error: `cannot reserve ${item.productId}` });
    }
  }

  for (const item of items) {
    const inv = db.inventory.get(item.productId);
    inv.reserved += item.quantity;
    inv.updatedAt = now();
  }

  const invoice = {
    id: `inv_${db.invoices.length + 1}`,
    customerName,
    items,
    dueDate,
    status: 'Sent',
    paidAmount: 0,
    createdAt: now()
  };
  db.invoices.push(invoice);
  return reply.code(201).send(invoice);
});

app.post('/api/invoices/:id/pay', async (request, reply) => {
  const invoice = db.invoices.find((i) => i.id === request.params.id);
  if (!invoice) return reply.code(404).send({ error: 'invoice not found' });
  const amount = Number(request.body?.amount || 0);
  if (amount <= 0) return reply.code(400).send({ error: 'amount must be > 0' });

  invoice.paidAmount += amount;
  const total = invoice.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  invoice.status = invoice.paidAmount >= total ? 'Paid' : 'Partially Paid';

  if (invoice.status === 'Paid' && !invoice.stockReleased) {
    for (const item of invoice.items) {
      const inv = db.inventory.get(item.productId);
      inv.reserved -= item.quantity;
      inv.onHand -= item.quantity;
    }
    invoice.stockReleased = true;
  }

  db.wallet.balance += amount;
  db.wallet.ledger.push({ id: `w_inv_${invoice.id}_${Date.now()}`, type: 'invoice_payment', amount, at: now() });
  return { ok: true, status: invoice.status };
});

app.get('/api/invoices', async () => ({ invoices: db.invoices }));

// M7 Wallet
app.get('/api/wallet', async () => db.wallet);
app.post('/api/wallet/withdraw', async (request, reply) => {
  const amount = Number(request.body?.amount || 0);
  if (amount <= 0 || amount > db.wallet.balance) return reply.code(400).send({ error: 'invalid amount' });
  db.wallet.balance -= amount;
  db.wallet.ledger.push({ id: `w_out_${Date.now()}`, type: 'withdrawal', amount: -amount, at: now() });
  return { ok: true, balance: db.wallet.balance };
});

// M6 Alerts + M3 lightweight stockout predictor
app.get('/api/alerts', async () => ({ alerts: db.alerts }));
app.post('/api/ai/run-stockout-scan', async () => {
  db.alerts.length = 0;
  for (const [productId, inv] of db.inventory.entries()) {
    if (inv.onHand <= 2) {
      db.alerts.push({ id: `a_${productId}`, severity: 'Critical', productId, message: 'Stockout risk < 12 hours', at: now() });
    } else if (inv.onHand <= 5) {
      db.alerts.push({ id: `a_${productId}`, severity: 'Warning', productId, message: 'Stockout risk 1-3 days', at: now() });
    }
  }
  return { ok: true, alertCount: db.alerts.length };
});

app.listen({ port: 4000, host: '0.0.0.0' });
