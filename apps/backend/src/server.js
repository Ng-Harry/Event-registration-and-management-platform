import Fastify from 'fastify';
import cors from '@fastify/cors';

const app = Fastify({ logger: true });
await app.register(cors, { origin: true });

const sales = [];

app.get('/health', async () => ({ ok: true, service: 'smartmart-backend' }));

app.post('/api/sales', async (request, reply) => {
  sales.push(request.body);
  reply.code(201).send({ status: 'stored', count: sales.length });
});

app.get('/api/sales', async () => ({ sales }));

app.listen({ port: 4000, host: '0.0.0.0' });
