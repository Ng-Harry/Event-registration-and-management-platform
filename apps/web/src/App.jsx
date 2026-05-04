import React, { useEffect, useState } from 'react';

const STORAGE_KEY = 'smartmart.pending.sales';

function useNetworkStatus() {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);
  return online;
}

const api = (path, options) => fetch(`http://localhost:4000${path}`, options).then((r) => r.json());

export function App() {
  const online = useNetworkStatus();
  const [inventory, setInventory] = useState([]);
  const [wallet, setWallet] = useState({ balance: 0, ledger: [] });
  const [alerts, setAlerts] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [pending, setPending] = useState(() => JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'));

  const refresh = async () => {
    if (!online) return;
    setInventory(await api('/api/inventory'));
    setWallet(await api('/api/wallet'));
    setAlerts((await api('/api/alerts')).alerts);
    setInvoices((await api('/api/invoices')).invoices);
  };

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(pending)); }, [pending]);
  useEffect(() => { refresh(); }, [online]);

  useEffect(() => {
    if (!online || pending.length === 0) return;
    (async () => {
      const keep = [];
      for (const sale of pending) {
        try {
          const resp = await fetch('http://localhost:4000/api/sales', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sale)
          });
          if (!resp.ok) keep.push(sale);
        } catch {
          keep.push(sale);
        }
      }
      setPending(keep);
      await refresh();
    })();
  }, [online]);

  const seedProducts = async () => {
    if (!online) return;
    await api('/api/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: 'p1', name: 'Rice 5kg', price: 25000, stock: 20 }) });
    await api('/api/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: 'p2', name: 'Cooking Oil', price: 8500, stock: 8 }) });
    await refresh();
  };

  const recordSale = async () => {
    const sale = { id: crypto.randomUUID(), total: 8500, items: [{ productId: 'p2', quantity: 1 }] };
    if (!online) return setPending((p) => [...p, sale]);
    try {
      const resp = await fetch('http://localhost:4000/api/sales', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sale) });
      if (!resp.ok) setPending((p) => [...p, sale]);
      await refresh();
    } catch { setPending((p) => [...p, sale]); }
  };

  const createInvoice = async () => {
    if (!online) return;
    await api('/api/invoices', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ customerName: 'ABC School', dueDate: '2026-05-20', items: [{ productId: 'p1', quantity: 2, price: 25000 }] }) });
    await refresh();
  };

  const runStockoutScan = async () => { if (online) { await api('/api/ai/run-stockout-scan', { method: 'POST' }); await refresh(); } };

  return <main className="container">
    <h1>SmartMart v2 Ops Console</h1>
    <p>Status: <strong className={online ? 'online' : 'offline'}>{online ? 'Online' : 'Offline'}</strong> · Pending Sync: <strong>{pending.length}</strong></p>
    <div className="row">
      <button onClick={seedProducts}>Seed Products</button>
      <button onClick={recordSale}>Record Sale</button>
      <button onClick={createInvoice}>Create Invoice</button>
      <button onClick={runStockoutScan}>Run AI Stockout Scan</button>
    </div>
    <h2>Wallet Balance: ₦{wallet.balance}</h2>
    <h3>Inventory</h3>
    <ul>{inventory.map(i => <li key={i.id}>{i.name}: onHand {i.onHand}, reserved {i.reserved}</li>)}</ul>
    <h3>Invoices</h3>
    <ul>{invoices.map(i => <li key={i.id}>{i.id} - {i.customerName} - {i.status}</li>)}</ul>
    <h3>Alerts</h3>
    <ul>{alerts.map(a => <li key={a.id}>[{a.severity}] {a.message} ({a.productId})</li>)}</ul>
  </main>;
}
