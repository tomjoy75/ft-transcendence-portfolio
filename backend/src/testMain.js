import Fastify from "fastify";
import sendError from "./plugins/sendError.js";

const fastify = Fastify({ logger: true });

await fastify.register(sendError);

fastify.get("/hello", (req, reply) => {
  console.log("🧪 reply.sendError =", reply.sendError);
  return reply.sendError(418, "I'm a teapot");
});

await fastify.listen({port: process.env.PORT_BACK});
