var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { GameRooms, initGameServer } from "./server.js";
import { PongGame } from "./pong.js";
import Fastify from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
const fastify = Fastify();
dotenv.config();
const port = Number(process.env.PORT_PONG) || 3002;
const start = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const address = yield fastify.listen({ port, host: '0.0.0.0' });
        fastify.log.info(`API REST started on ${address}`);
    }
    catch (error) {
        fastify.log.error('error: fastify, ', error);
        process.exit(1);
    }
});
// TEMP: CORS needed for frontend dev on separate port (to be removed after Docker setup)
if (process.env.NODE_ENV === 'development') {
    console.log(`\x1B[33m\x1B[1m 🛠️  Development mode: CORS enabled for localhost:${process.env.PORT_FRONT} \x1B[0m`);
    fastify.register(cors, {
        origin: (origin, cb) => {
            const allowedOrigins = [
                `http://localhost:${process.env.PORT_FRONT}`,
                `http://127.0.0.1:${process.env.PORT_FRONT}`
            ];
            if (!origin || allowedOrigins.includes(origin)) {
                cb(null, true);
            }
            else {
                cb(new Error("Not allowed by CORS"), false);
            }
        },
        credentials: true
    });
}
initGameServer(fastify.server);
fastify.register(gameRoutes);
start();
let localcount = 1;
export default function gameRoutes(fastify) {
    return __awaiter(this, void 0, void 0, function* () {
        fastify.post('/api/game/move', (req, reply) => {
            const { roomId, playerSide, key, type, mode } = req.body;
            const str = mode === 'multi' ? 'Game Room ID multi ' : 'Game Room ID local ';
            const validSide = mode === 'multi' ? [1, 2] : [0];
            const room = GameRooms.get(str + `${roomId}`);
            if (!room)
                return reply.code(401).send({ error: `room ${roomId} not found` });
            else if (!validSide.includes(playerSide))
                return reply.code(402).send({ error: `player ${playerSide} not found` });
            else if (key !== 'ArrowUp' && key !== 'ArrowDown'
                && key !== 'w' && key !== 's')
                return reply.code(403).send({ error: `incorrect key input ${key}` });
            if (type === 'keydown')
                room.game.handleKeyDown(key, playerSide);
            else if (type === 'keyup')
                room.game.handleKeyUp(key, playerSide);
            else
                return reply.code(403).send({ error: 'incorrect key press type event' });
            return reply.send({ message: 'REST API: movement applied' });
        });
        fastify.get('/api/game/state', (req, reply) => {
            const str = req.query.mode === 'multi' ? 'Game Room ID multi ' : 'Game Room ID local ';
            const room = GameRooms.get(str + `${req.query.roomId}`);
            if (!room)
                return reply.code(401).send({ error: 'room not found' });
            return reply.send(room.game.serialize());
        });
        fastify.post('/api/game/create-game', (req, reply) => {
            const p1 = req.body.players[0];
            const p2 = req.body.players[1];
            if (!p1 || !p2)
                return reply.code(402).send({ error: "Player's names are missing" });
            const game = new PongGame();
            game.player1.name = p1;
            game.player2.name = p2;
            const room = {
                game: game,
                playercount: 2,
                id: `Game Room ID local ${localcount}`,
                index: localcount
            };
            localcount++;
            GameRooms.set(room.id, room);
            return reply.send({ message: 'REST API: game created', roomId: room.index });
        });
        fastify.post('/api/game/end', (req, reply) => {
            const str = req.body.mode === 'multi' ? 'Game Room ID multi ' : 'Game Room ID local ';
            const room = GameRooms.get(str + `${req.body.roomId}`);
            if (!room)
                return reply.code(401).send({ error: 'room not found' });
            room.game.ended = true;
            return reply.send({ message: 'REST API: game over' });
        });
    });
}
