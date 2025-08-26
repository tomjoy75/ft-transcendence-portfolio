import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { initGameServer } from "./server.js";
import Fastify from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv'
import fastifyjwt from '@fastify/jwt';
import gameRoutes from './gameRoutes.js';
import metricsPlugin from 'fastify-metrics';

dotenv.config();

const fastify: FastifyInstance = Fastify();

if (!process.env.JWT_SECRET)
{
    throw new Error('JWT_SECRET environment variable is not defined');
}
fastify.register(fastifyjwt, { secret: process.env.JWT_SECRET });

fastify.decorate('checkJWT', async function(request: FastifyRequest, reply: FastifyReply) {
    try
    {
	if (request.url !== "/metrics") {
		await request.jwtVerify();
	}
    }
    catch (err)
    {
        reply.code(450).send({ error: "Unauthorized token" });
    }
});

// Extend FastifyInstance to include checkJWT
declare module 'fastify' {
    interface FastifyInstance {
        checkJWT(request: FastifyRequest, reply: FastifyReply): Promise<void>;
    }
}
fastify.addHook('preHandler', fastify.checkJWT);

const port: number = Number(process.env.PORT_PONG) || 3002;

const start = async () => {
    try {
        const address = await fastify.listen({ port , host: '0.0.0.0' });
        console.log(`API REST started on ${address}`);
    }
    catch (error)
    {
        console.error('error: fastify, ', error);
        process.exit(1);
    }
}
/* // TEMP: CORS needed for frontend dev on separate port (to be removed after Docker setup)
if (process.env.NODE_ENV === 'development'){
console.log(`\x1B[33m\x1B[1m 🛠️  Development mode: CORS enabled for localhost:${process.env.PORT_FRONT} \x1B[0m`);
fastify.register(cors, {
    origin: (origin, cb) => {
        if (!origin)
        {
            cb(null, true);
            return;
        }
        try
        {
            const url: URL = new URL(origin);
            const isLocalIP: boolean = url.hostname.startsWith('192.168.') || url.hostname.startsWith('10.');

            if (url.port === `${process.env.PORT_FRONT}` && ((isLocalIP) ||
                (url.hostname === 'localhost' || url.hostname === '127.0.0.1')))
            {
                cb(null, true);
            }
            else
                cb(new Error('Not allowed by CORS'), false);
        }
        catch (err)
        {
            cb(new Error('invalid origin'), false);
        }
    },

    credentials: true
});
} */

initGameServer(fastify.server);
fastify.register(gameRoutes);
fastify.register(metricsPlugin, { endpoint: '/metrics' });
start();
