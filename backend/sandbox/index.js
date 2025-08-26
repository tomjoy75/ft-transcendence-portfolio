// backend/sandbox/index.js
import Fastify from 'fastify';

const fastify = Fastify();

fastify.get('/test', async (request, reply) => {
  return { success: true };
});

fastify.listen({ port: 3001 }, err => {
  if (err) throw err;
  console.log('Sandbox up: http://localhost:3001/test');
});
