import { Server as SocketIOServer } from "socket.io";
import { PongGame, winScore } from './pong.js';
export const GameRooms = new Map();
const userSocket = new Map();
let roomcount = 1;
const targetFPS = 30;
export function initGameServer(httpServer) {
    const io = new SocketIOServer(httpServer, {
        cors: {
            origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
        },
    });
    function handlePlayerForfeit(userId, room) {
        let forfeitedPlayer = -1;
        if (room.game.player1.id === userId) {
            forfeitedPlayer = 1;
            room.game.player2.score = winScore;
        }
        else if (room.game.player2.id === userId) {
            forfeitedPlayer = 2;
            room.game.player1.score = winScore;
        }
        console.log(`server: player ${forfeitedPlayer} forfeited the game in room ${room.index}`);
        if (GameRooms.has(room.id)) {
            room.game.ended = true;
            room.game.pause = false;
            io.to(room.id).emit('unpause', true);
        }
        else {
            // both players not in room, TODO: still send game result?
            console.error(`server: room ${room.id} has been deleted in handlePlayerForfeit`);
        }
        const userdata = userSocket.get(userId);
        if (!userdata)
            return;
        userdata.sockets.delete(userdata.oldSocketId);
        console.log(`server: Forfeited userId: ${userId} deleted ${userdata.oldSocketId}`);
        if (userdata.sockets.size === 0)
            userSocket.delete(userId);
        delete userdata.reconnectingTimeOut;
        delete userdata.oldRoomId;
        delete userdata.oldSocketId;
        userdata.wasInGame = false;
    }
    function renderPongStart(room) {
        const gameState = room.game.serialize();
        io.to(room.id).emit('gameState', gameState);
    }
    function setPlayerNotInGame(userId) {
        const playerSocket = userSocket.get(userId);
        if (playerSocket)
            playerSocket.isInGame = false;
    }
    function gameLoop(room) {
        if (!room) {
            console.error("server: room not found in gameLoop");
            throw new Error("room not found in gameLoop");
        }
        console.log(`server: gameLoop started in room ${room.id}, pause is ${room.game.pause}`);
        renderPongStart(room);
        console.log("server: game starts in 2 seconds ...");
        setTimeout(() => {
            if (!room)
                throw new Error("room not found in Timeout gameLoop");
            if (room.intervalID)
                clearInterval(room.intervalID);
            room.intervalID = setInterval(() => {
                if (room.game.pause === true)
                    return;
                room.game.update();
                const gameState = room.game.serialize();
                io.to(room.id).emit('gameState', gameState);
                if (room.game.ended === true) {
                    clearInterval(room.intervalID);
                    io.to(room.id).emit('gameOver');
                    setPlayerNotInGame(room.game.player1.id);
                    setPlayerNotInGame(room.game.player2.id);
                    io.in(room.id).socketsLeave(room.id);
                    console.log(`server: game ended in room ${room.id}`);
                    //TODO: // Send GameResult to backend
                    GameRooms.delete(room.id);
                }
            }, 1000 / targetFPS);
        }, 2000);
    }
    io.on('connection', client_socket => {
        console.log("server: connection ", client_socket.id);
        let room = undefined;
        let user = undefined;
        let playerSide = -1;
        let userId = '';
        client_socket.on('userSocketRegistering', (currentUserId) => {
            userId = currentUserId;
            if (!userSocket.has(userId))
                userSocket.set(userId, { sockets: new Set(),
                    isInGame: false,
                    wasInGame: false,
                    isIntournament: false });
            user = userSocket.get(userId);
            user === null || user === void 0 ? void 0 : user.sockets.add(client_socket.id);
            for (const sock of user.sockets) {
                console.log(`server: userId of ${userId} with socket:`, sock);
            }
            console.log(`server: socket size: ${user === null || user === void 0 ? void 0 : user.sockets.size}`);
        });
        client_socket.on('joinRoomLocal', (roomId, ackCallback) => {
            if ((user === null || user === void 0 ? void 0 : user.isInGame) === true && (user === null || user === void 0 ? void 0 : user.isIntournament) === false) {
                GameRooms.delete(`Game Room ID local ${roomId}`);
                console.log(`server: the player is in game in room ${roomId}`);
                return ackCallback({ error: 'The player is already in a game' });
            }
            '';
            room = GameRooms.get(`Game Room ID local ${roomId}`);
            if (!room) {
                return ackCallback({ error: 'room not found' });
            }
            room.game.player1.id = userId;
            room.game.player2.id = userId;
            client_socket.join(room.id);
            user.isInGame = true;
            ackCallback({});
            try {
                io.to(room.id).emit('gameStart', room.index);
                gameLoop(room);
            }
            catch (error) {
                console.error("server: error in gameLoop", error);
                client_socket.emit('gameError', `${error}`);
            }
        });
        client_socket.on('initMultiplayer', (name, ackCallback) => {
            var _a, _b;
            if (!user)
                return ackCallback({ error: 'user not found' });
            else if (user.isInGame === true)
                return ackCallback({ error: 'The user is already in a game' });
            else if (user.wasInGame === true) {
                clearTimeout(user.reconnectingTimeOut);
                user.wasInGame = false;
                user.sockets.delete((_a = user.oldSocketId) !== null && _a !== void 0 ? _a : 'noSocket');
                room = GameRooms.get((_b = user.oldRoomId) !== null && _b !== void 0 ? _b : 'noRoom');
                if (room) {
                    playerSide = room.game.player1.id === userId ? 1 : 2;
                    client_socket.join(user.oldRoomId);
                    user.isInGame = true;
                    room.playercount++;
                    ackCallback({ index: room.index, playerSide, isReconnect: true });
                    client_socket.to(room.id).emit('unpause', false);
                    console.log(`server: user ${userId} reconnected to room ${room.index}, as player ${playerSide}`);
                    client_socket.emit('gameStart', room === null || room === void 0 ? void 0 : room.game.player1.name, room === null || room === void 0 ? void 0 : room.game.player2.name);
                    renderPongStart(room);
                    setTimeout(() => {
                        if (room && room.playercount === 2)
                            room.game.pause = false;
                    }, 2000);
                }
                else
                    ackCallback({ error: `Room not found, cannot reconnect to the room. Game will be forfeited` });
                delete user.reconnectingTimeOut;
                delete user.oldRoomId;
                delete user.oldSocketId;
                return;
            }
            console.log(`name: ${name}, userId: ${userId}, roomid: ${roomcount}`);
            room = GameRooms.get(`Game Room ID multi ${roomcount}`);
            if (!room) {
                const newGame = new PongGame();
                room = {
                    game: newGame,
                    playercount: 0,
                    id: `Game Room ID multi ${roomcount}`,
                    index: roomcount,
                };
                GameRooms.set(room.id, room);
            }
            if (room.playercount === 0) {
                room.game.player1.name = name;
                room.game.player1.id = userId;
                playerSide = 1;
                room.playercount++;
            }
            else if (room.playercount === 1) {
                room.game.player2.name = name;
                room.game.player2.id = userId;
                playerSide = 2;
                room.playercount++;
                roomcount++;
            }
            else {
                if (!room.game.player2.name || !room.game.player2.id) {
                    io.in(room.id).socketsLeave(room.id);
                    GameRooms.delete(room.id);
                }
                roomcount++;
                console.log(`server: room ${room.id} is full, playercount: ${room.playercount}, player1: ${room.game.player1.name} | ${room.game.player1.id} , player2: ${room.game.player2.name} | ${room.game.player2.id}.`);
                return ackCallback({ error: 'the room is full' });
            }
            client_socket.join(room.id);
            user.isInGame = true;
            return ackCallback({ index: room.index, playerSide });
        });
        client_socket.on('cancelMultiplayer', () => {
            if (user && user.isInGame === true) {
                user.isInGame = false;
                if (room) {
                    room.playercount -= 1;
                    room.game.player1.id = '';
                    room.game.player1.name = '';
                    client_socket.leave(room.id);
                    GameRooms.delete(room.id);
                    console.log(`server: user ${userId} cancelled multiplayer in room: ${room.index}, playercount: ${room.playercount}`);
                }
                else
                    client_socket.emit('gameError', 'room not found');
            }
        });
        client_socket.on('gameReady', () => {
            if (!room) {
                client_socket.emit('gameError', 'room not found');
                return;
            }
            try {
                io.to(room.id).emit('gameStart', room.game.player1.name, room.game.player2.name);
                gameLoop(room);
            }
            catch (error) {
                console.error("server: error in gameLoop", error);
                client_socket.emit('gameError', `${error}`);
            }
        });
        /*     client_socket.on('handleKeyEvent', (key: string, type: string) => {
                if (!room)
                {
                    client_socket.emit('gameError', 'room not found');
                    return;
                }
                if (type === 'keydown')
                    room.game.handleKeyDown(key, playerSide);
                else if (type === 'keyup')
                    room.game.handleKeyUp(key, playerSide);
            }); */
        client_socket.on('disconnect', () => {
            console.log("server: disconnection ", client_socket.id);
            room = GameRooms.get(`${room === null || room === void 0 ? void 0 : room.id}`);
            if (room) {
                if (user && user.isInGame === true) {
                    user.isInGame = false;
                    console.log(`server: ROOMID: ${room.id}`);
                    if (room.game.player1.id && room.game.player2.id
                        && room.game.ended === false && room.id.includes('multi')) {
                        if (room.playercount > 1) {
                            client_socket.to(room.id).emit('paused');
                            room.game.pause = true;
                            user.wasInGame = true;
                            user.oldSocketId = client_socket.id;
                            user.oldRoomId = room.id;
                            user.reconnectingTimeOut = setTimeout(() => {
                                console.log(`server: user ${userId} disconnected for more than 5 seconds, removing from game`);
                                if (room)
                                    handlePlayerForfeit(userId, room);
                                user.wasInGame = false;
                            }, 10000);
                        }
                        else // if the last player in the room leaves
                         {
                            console.log(`server: user ${userId} disconnected, game ended in room ${room.id} from last player leaving room`);
                            io.in(room.id).socketsLeave(room.id);
                            GameRooms.delete(room.id);
                        }
                    }
                }
                if (room.playercount > 0)
                    room.playercount -= 1;
                console.log(`server: disconnected client: ${client_socket.id} in room: ${room.index}`);
            }
            if ((user === null || user === void 0 ? void 0 : user.wasInGame) === false) {
                user === null || user === void 0 ? void 0 : user.sockets.delete(client_socket.id);
                console.log(`server: userId: ${userId} deleted ${client_socket.id}`);
            }
            if ((user === null || user === void 0 ? void 0 : user.sockets.size) === 0)
                userSocket.delete(userId);
        });
    });
}
