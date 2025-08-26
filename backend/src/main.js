import Fastify from 'fastify';
import publicRoutes from './routes/publicRoutes.js';
import privateRoutes from './routes/privateRoutes.js';
import friendshipRoutes from './routes/friendshipRoutes.js';
import tournamentRoutes from './routes/tournamentRoutes.js';
import matchesRoutes from './routes/matchesRoutes.js';
import { initDB } from './db/sqlite.js';
import cors from '@fastify/cors';
import sendError from './plugins/sendError.js';
import fastifyJwt from '@fastify/jwt';
import checkJWT from './plugins/checkJWT.js';
import dotenv from 'dotenv';
import metricsPlugin from 'fastify-metrics';
import fastifyMultipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import path from 'path';

const fastify = Fastify({
    logger: {
        transport: {
            target: 'pino-pretty'
        }
    }
})
dotenv.config();
console.log("ENV DEBUG:", process.env);

const start = async () => {
    try {
        const address = await fastify.listen({ port: process.env.PORT_BACK, host: '0.0.0.0' });
        fastify.log.info(`🚀 Server ready at ${address}`);
    } catch (err) {
        fastify.log.error(err)
        process.exit(1);
    }
}

// main();
const db = await initDB();
console.log("🔐 Secret is:", process.env.JWT_SECRET);
await fastify.register(sendError);
await fastify.register(fastifyJwt, {
    secret: process.env.JWT_SECRET
})
await fastify.register(checkJWT);
// TEMP: CORS needed for frontend dev on separate port (to be removed after Docker setup)
// if (process.env.NODE_ENV === 'development'){
// console.log(`\x1B[33m\x1B[1m 🛠️  Development mode: CORS enabled for localhost:${process.env.PORT_FRONT} \x1B[0m`);
// fastify.register(cors, {
// //    origin:`http://localhost:${process.env.PORT_FRONT}`,
//     origin: (origin, cb) => {
//         if (!origin)
//         {
//             cb(null, true);
//             return;
//         }
//         try
//         {
//             const url = new URL(origin);
//             const isLocalIP = url.hostname.startsWith('192.168.') || url.hostname.startsWith('10.');

//             if ((url.port === `${process.env.PORT_FRONT}` || url.port ===`${process.env.PORT_WEBSERV}`)
//                 && ((isLocalIP) || (url.hostname === 'localhost' || url.hostname === '127.0.0.1')))
//             {
//                 cb(null, true);
//             }
//             else
//                 cb(new Error('Not allowed by CORS'), false);
//         }
//         catch (err)
//         {
//             cb(new Error('invalid origin'), false);
//         }
//     },
// 	methods: ['GET', 'POST', 'DELETE', 'PATCH', 'OPTIONS'],
// 	allowedHeaders: ['Content-Type', 'Authorization'],

//     credentials: true
// });
// }
await fastify.register(fastifyMultipart, {
//    attachFieldsToBody: true,
    limits: {
        fileSize: 2 * 1024 * 1024 //2 Mo
    }

});
fastify.setErrorHandler((err, req, reply) => {
    console.error("🔥 Error caught:", err)
    if (err.code == 'FST_REQ_FILE_TOO_LARGE') 
        return reply.sendError(413, "Avatar file too large (max 2MB)");
    reply.send(err);
})
fastify.register(metricsPlugin, { endpoint: "/metrics" });
fastify.register(publicRoutes, { db });
fastify.register(privateRoutes, { db });
fastify.register(friendshipRoutes, { db });
fastify.register(tournamentRoutes, { db });
fastify.register(matchesRoutes, { db });
await fastify.register(fastifyStatic, {
  root: path.join(process.cwd(), 'src', 'avatars'),
  prefix: '/avatars/', // access via http://localhost:3001/avatars/xxx.png
});

start();
