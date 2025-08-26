import { FastifyInstance } from "fastify";
import { GameRoom, GameRooms, userData, userSocket } from "./server.js";
import { PongGame } from "./pong.js";

let localcount: number = 1;

export default async function gameRoutes(fastify: FastifyInstance) {
 
    fastify.post<{ Body: { roomId: number, playerSide: 0 | 1 | 2, key: string, type: 'keydown' | 'keyup', mode: string } }>
    ('/api/game/move', (req, reply) => {
        const { roomId, playerSide, key, type, mode } = req.body;
        const str = mode === 'multi' ? 'Game Room ID multi ' : 'Game Room ID local ';
        const validSide = mode === 'multi' ? [1,2] : [0];

        const room: GameRoom | undefined = GameRooms.get(str + `${roomId}`);
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
 
    fastify.get<{ Querystring: { mode: string, roomId: number } }>
    ('/api/game/state', (req, reply) => {
        const str = req.query.mode === 'multi' ? 'Game Room ID multi ' : 'Game Room ID local ';
 
        const room: GameRoom | undefined = GameRooms.get(str + `${req.query.roomId}`);
        if (!room)
            return reply.code(401).send({ error: 'room not found' });
 
        return reply.send(room.game.serialize());
    });

    fastify.post<{ Body: { players: [string, string], userID: number } }>
    ('/api/game/create-game', (req, reply) => {
        const p1 = req.body.players[0];
        const p2 = req.body.players[1];
        const userID = req.body.userID;

        if (!userID)
            return reply.code(410).send({ error: 'userID is required' });
        else if (!p1 || !p2)
            return reply.code(402).send({ error: "Player's names are missing" });
        else if (p1.length < 2 || p1.length > 20 || p2.length < 2 || p2.length > 20)
            return reply.code(402).send({ error: "Player's names must be between 2 and 20 characters" });

        const user: userData | undefined = userSocket.get(userID);
        if (!user)
            return reply.code(410).send({ error: 'user not found' });        
        else if (user.isInGame)
            return reply.code(410).send({ error: 'user is already in game' });

        const game = new PongGame();
        game.player1.name = p1;
        game.player2.name = p2;

        const room: GameRoom = {
            game: game,
            playercount: 2,
            id: `Game Room ID local ${localcount}`,
            index: localcount
        };
        localcount++;
        GameRooms.set(room.id, room);
 
        return reply.send({ roomId: room.index });
    });
 
    fastify.post<{ Body: { mode?: string, roomId: number, } }>
    ('/api/game/end', (req, reply) => {
        const str = req.body.mode === 'multi' ? 'Game Room ID multi ' : 'Game Room ID local ';

        const room: GameRoom | undefined = GameRooms.get(str + `${req.body.roomId}`);
        if (!room)
            return reply.code(401).send({ error: 'room not found' });
 
        room.game.ended = true;
        if (!room.intervalID && room.id.includes("local"))
            GameRooms.delete(room.id);
        return reply.send({ message: 'REST API: game over' });
    });
}
