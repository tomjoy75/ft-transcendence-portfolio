import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as httpServer } from "http";
import { GameState, PongGame, winScore } from './pong.js'
import { sendGameResult } from "./gameResult.js";
import { handlePlayerForfeit,
        renderPongStart,
        setPlayerNotInGame,
        forfeitTournamentPlayer,
        getMatchIdInformation,
        getUserById,
        MatchInfo } from "./gameUtils.js";

export interface GameRoom
{
    game: PongGame;
    playercount: number;
    id: string;
    index: number;
    intervalID?: NodeJS.Timeout;
    tournamentMatchId?: number; // for tournament matches
    tournamentId?: number;
}

export interface userData
{
    sockets: Set<string>;
    currentSocketId: string;
    currentRoomId: string;
    isInGame: boolean;
    wasInGame: boolean;
    oldRoomId?: string;
    oldSocketId?: string;
    reconnectingTimeOut?: NodeJS.Timeout;
    token: string | null;
}

// Map key: room.id
export const GameRooms: Map<string, GameRoom> = new Map();

// Map key: userId
export const userSocket: Map<number, userData> = new Map();

// Map key: matchId
const waitingTournamentPlayers: Map<number, {
    name: string,
    userId: number,
    playerSide: number, 
    matchId: number,
    tournamentId: number | null }> = new Map();

let waitingPlayer: { name: string, userId: number, playerSide: number } | null = null;
let roomcount: number = 1;
const targetFPS: number = 30;

export function initGameServer(httpServer: httpServer)
{
    let hostIP: string = '';
    const io: SocketIOServer = new SocketIOServer(httpServer/* , {
        cors: {
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
                    hostIP = url.hostname;
                    cb(null, true);
                }
                else
                    cb(new Error('Not allowed by CORS'), false);
                }
                catch (err)
                {
                    cb(new Error('invalid origin'), false);
                }
            }
        }
    } */);

    function gameLoop(room: GameRoom | undefined, userId?: number): void
    {
        if (!room)
        {
            console.error("server: room not found in gameLoop");
            throw new Error("room not found in gameLoop");
        }
        
        renderPongStart(room, io);
        console.log(`server: roomId:${room.index} | ${room.game.player1.name}:${room.game.player1.id} - ${room.game.player2.name}:${room.game.player2.id}`)
        console.log("server: game starts in 2 seconds ...");
        setTimeout( () => {
            if (!room)
                throw new Error("room not found in Timeout gameLoop");
            if (room.intervalID)
                clearInterval(room.intervalID);
            room.intervalID = setInterval( async () => {
                if (room.game.pause === true)
                    return;

                room.game.update();
                const gameState: GameState = room.game.serialize();
                io.to(room.id).emit('gameState', gameState);
                
                if (room.game.ended === true)
                {
                    clearInterval(room.intervalID);

                    setPlayerNotInGame(room.game.player1.id);
                    setPlayerNotInGame(room.game.player2.id);
                    console.log(`server: game ended in room ${room.id}`);

                    io.to(room.id).emit('gameOver', room.tournamentId ? room.tournamentId : undefined);

                    // Create match and send GameResult to backend for normal multiplayer mode.
                    // For tournament games, not creating match.
                    // And only send GameResult of local and multi tournament games to backend

                    // Send GameResult to backend
                    if (room.game.player1.score === winScore || room.game.player2.score === winScore)
                    {
                        try
                        {
                            if (room.tournamentMatchId || room.id.includes('multi'))
                                await sendGameResult(room, userId);
                        }
                        catch (error: any)
                        {
                            console.error(`server: error sending game result: ${error.message}`);
                            io.to(room.id).emit('gameError', `${error.message}`);
                        }
                    }
                    io.in(room.id).socketsLeave(room.id);

                    GameRooms.delete(room.id);
                }
            }, 1000 / targetFPS );
        }, 2000);
    }

    io.on('connection', (client_socket: Socket) => {
        let room: GameRoom | undefined = undefined;
        let user: userData | undefined = undefined;
        let playerSide: number = -1;
        let userId: number = -1;

        client_socket.on('userSocketRegistering', (currentUserId: number, userToken: string | null, ackCallback: (response: any) => void) => {

            userId = currentUserId;

            if (!userSocket.has(userId))
                userSocket.set(userId, { sockets: new Set<string>(),
                                        currentSocketId: client_socket.id,
                                        currentRoomId: 'noRoom',
                                        isInGame: false,
                                        wasInGame: false,
                                        token: userToken });

            user = userSocket.get(userId)
            user!.sockets.add(client_socket.id);

            if (user!.wasInGame === true)
            {
                ackCallback({ reconnection: true });
                client_socket.emit('reconnectToGame');
                return;
            }

            for (const sock of user!.sockets)
            {
                console.log(`server: userId of ${userId} with socket:`, sock);
            }
            console.log(`server: socket size: ${user?.sockets.size}`)

            return ackCallback({ reconnection: false });
        });

        client_socket.on('joinRoomLocal', async (data: { roomId: number, matchId?: number }, ackCallback: (response: { error?: string }) => void) => {

            room = GameRooms.get(`Game Room ID local ${data.roomId}`);
            if (!room || !user)
                return ackCallback({ error: 'user or room not found' });

            let matchInfo: MatchInfo | null = null;
            if (data.matchId && user.token)
            {
                matchInfo = await getMatchIdInformation(data.matchId, user.token);
                if (!matchInfo)
                    return ackCallback({ error: 'match not found' });

                room.tournamentMatchId = data.matchId;
                room.tournamentId = matchInfo.tournamentId!;
            }

            room.game.player1.id = matchInfo?.player1.id ?? userId;
            room.game.player2.id = matchInfo?.player2.id ?? userId;

            client_socket.join(room.id);
            user.isInGame = true;
            ackCallback({});

            try
            {
                io.to(room.id).emit('gameStart');
                gameLoop(room, userId);
            }
            catch (error)
            {
                console.error("server: error in gameLoop", error);
                client_socket.emit('gameError', `${error}`);
            }
        });

        client_socket.on('initMultiplayer', (data: { name: string, matchId?: number }, ackCallback: (response: {
                index?: number,
                PlayerSide?: number,
                playercount?: number,
                error?: string }) => void) => {

            if (!user)
                return ackCallback({ error: 'user not found' });
            else if (user.isInGame === true)
                return ackCallback({ error: 'The user is already in a game' });

            if (user.wasInGame === true)
            {
                handleReconnection(ackCallback);
                return;
            }

            if (data.matchId)
            {
                handleTournamentGame(data.matchId, data.name, ackCallback);
                return;
            }

            handleNormalMultiplayer(data.name, ackCallback);
        });

        client_socket.on('cancelMultiplayer', () => {
            if (user && user.isInGame === true)
            {
                user.isInGame = false;
                waitingPlayer = null;
                playerSide = -1;
            }
        });

        client_socket.on('gameReady', () => {
            room = GameRooms.get(user!.currentRoomId);
            if (!room)
            {
                client_socket.emit('gameError', 'could not start the game, room not found');
                return;
            }

            try
            {
                io.to(room.id).emit('gameStart', room.game.player1.name, room.game.player2.name);
                gameLoop(room);
            }
            catch (error)
            {
                console.error("server: error in gameLoop", error);
                client_socket.emit('gameError', `${error}`);
            }
        });

        function handleReconnection(ackCallback: (response: {index?: number, playerSide?: number, error?: string}) => void): void
        {
            if (!user)
                return;
            
            clearTimeout(user.reconnectingTimeOut);
            user.wasInGame = false;

            if (user.oldSocketId)
                user.sockets.delete(user.oldSocketId);

            room = user.oldRoomId ? GameRooms.get(user.oldRoomId) : undefined;
            if (room)
            {
                playerSide = room.game.player1.id === userId ? 1 : 2;
                client_socket.join(user.oldRoomId!);
                user.isInGame = true;
                room.playercount++;

                ackCallback({index: room.index, playerSide});
                client_socket.to(room.id).emit('unpause', false);

                client_socket.emit('gameStart', room?.game.player1.name, room?.game.player2.name);
                renderPongStart(room, io);

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
        }

        async function handleTournamentGame(matchId: number, name: string, ackCallback: (response: {index?: number, playerSide?: number, playercount?: number, error?: string}) => void): Promise<void>
        {
            if (!user)
                return ackCallback({ error: `user not found` });
            else if (!user.token)
                return ackCallback({ error: `token not registered` });

            if (!waitingTournamentPlayers.has(matchId))
            {
                const matchInfo: MatchInfo | null = await getMatchIdInformation(matchId, user.token);

                const playerData: { 
                    username: string,
                    alias: string,
                    email: string,
                    avatar: string } | null = await getUserById(userId, user.token);
                if (!matchInfo || !playerData)
                    return ackCallback({ error: `match or player information not found` });

                let username: string = playerData.username;
                if (matchInfo.player1.username === username)
                    playerSide = 1;
                else
                    playerSide = 2;

                waitingTournamentPlayers.set(matchId, { name, userId, playerSide, matchId, tournamentId: matchInfo.tournamentId });
                user.currentSocketId = client_socket.id;
                user.isInGame = true;
                return ackCallback({ playercount : 1 });
            }

            const waitingPlayerTn: {
                name: string,
                userId: number,
                matchId: number,
                playerSide:number } | undefined = waitingTournamentPlayers.get(matchId);
            if (!waitingPlayerTn)
            {
                console.error(`server: no waiting player found for matchId ${matchId}`);
                return ackCallback({ error: 'no waiting player found for this match' });
            }
            else if (waitingPlayerTn.userId === userId)
            {
                // Only if 2nd player didn't join yet.
                // Reregister user to the right game, requires matchId to be defined

                user.currentSocketId = client_socket.id;
                user.isInGame = true;
                return ackCallback({ playercount: 1 });
            }

            const waitingUser: userData | undefined = userSocket.get(waitingPlayerTn.userId);
            if (!waitingUser)
            {
                // forfeit the user that left the game, while waiting for player 2
                try
                {
                    forfeitTournamentPlayer(matchId, name, userId, user!, roomcount);
                    roomcount++;
                }
                catch (error: any)
                {
                    GameRooms.delete(`Game Room ID multi ${roomcount}`);
                    roomcount++;
                    console.error(`server: error sending game result: ${error.message}`);
                }
                console.error(`server: user ${waitingPlayerTn.userId} not found in userSocket`);
                return ackCallback({ error: 'waiting player not found, game will be won by default' });
            }

            const roomIndex: number = createMultiRoom(name, waitingUser, waitingPlayerTn);

            ackCallback({ index: roomIndex, playerSide, playercount: 2 });
            io.sockets.sockets.get(waitingUser.currentSocketId)?.emit('roomReady', { index: roomIndex, playerSide: waitingPlayerTn.playerSide });

            waitingTournamentPlayers.delete(matchId);
        }

        function handleNormalMultiplayer(name: string, ackCallback: (response: {index?: number, playerSide?: number, playercount?: number, error?: string}) => void): void
        {
            if (!user)
                return;
            
            if (!waitingPlayer || waitingPlayer.userId === userId)
            {
                waitingPlayer = { name, userId, playerSide: 1 };
                user.currentSocketId = client_socket.id;
                user.isInGame = true;
                playerSide = 1;
                return ackCallback({ playercount: 1 });
            }

            const waitingUser: userData | undefined = userSocket.get(waitingPlayer.userId);
            if (!waitingUser)
            {
                console.error(`server: user ${waitingPlayer.userId} not found in userSocket`);
                waitingPlayer = null;
                return ackCallback({ error: 'waiting player not found' });
            }

            const roomIndex: number = createMultiRoom(name, waitingUser, waitingPlayer);

            ackCallback({ index: roomIndex, playerSide, playercount: 2 });
            io.sockets.sockets.get(waitingUser.currentSocketId)?.emit('roomReady', { index: roomIndex, playerSide: waitingPlayer.playerSide });

            waitingPlayer = null;
        }

        function createMultiRoom(name:string, waitingUser: userData, waitingPlayer: { name:string, userId: number, playerSide: number, matchId?: number, tournamentId?: number }): number
        {
            const newGame: PongGame = new PongGame();

            room = {
                game: newGame,
                playercount: 2,
                id: `Game Room ID multi ${roomcount}`,
                index: roomcount,
                tournamentMatchId: waitingPlayer.matchId,
                tournamentId: waitingPlayer.tournamentId
            };
            GameRooms.set(room.id, room);

            const isPlayer1: boolean = waitingPlayer.playerSide === 1;

            room.game.player1.name = isPlayer1 ? waitingPlayer.name : name;
            room.game.player1.id   = isPlayer1 ? waitingPlayer.userId : userId;
            room.game.player2.name = isPlayer1 ? name : waitingPlayer.name;
            room.game.player2.id   = isPlayer1 ? userId : waitingPlayer.userId;
            playerSide = isPlayer1 ? 2 : 1;

            io.sockets.sockets.get(waitingUser.currentSocketId)?.join(room.id);
            client_socket.join(room.id);

            waitingUser.currentRoomId = room.id;
            user!.currentRoomId = room.id;
            user!.isInGame = true;

            roomcount++;
            return room.index;
        }

        client_socket.on('disconnect', () => {
            console.log(`server: user ${userId} disconnection ${client_socket.id}`);

            if (!user)
                return;

            room = GameRooms.get(`${room?.id}`);
            if (room)
            {
                if (user.isInGame === true)
                {
                    if (room.game.player1.id && room.game.player2.id
                        && room.game.ended === false && room.id.includes('multi'))
                    {
                        if (room.playercount > 1)
                        {
                            client_socket.to(room.id).emit('paused');

                            room.game.pause = true;
                            user.wasInGame = true;
                            user.oldSocketId = client_socket.id;
                            user.oldRoomId = room.id;
                            user.reconnectingTimeOut = setTimeout(() => {
                                console.log(`server: user ${userId} disconnected for more than 10 seconds, removing from game`);
                                if (room)
                                    handlePlayerForfeit(userId, room, io);
                                user!.wasInGame = false;
                            }, 10000);
                        }
                        else    // if the last player in the room leaves
                        {
                            const firstPlayerLeftId: number = playerSide === 1 ? room.game.player2.id : room.game.player1.id;
                            const firstPlayerLeft: userData | undefined = userSocket.get(firstPlayerLeftId);
                            if (firstPlayerLeft && firstPlayerLeft.wasInGame === true)
                            {
                                firstPlayerLeft.wasInGame = false;
                                user.sockets.delete(firstPlayerLeft.oldSocketId!);

                                if (firstPlayerLeft.sockets.size === 0)
                                    userSocket.delete(firstPlayerLeftId);
                            }

                            io.in(room.id).socketsLeave(room.id);
                            GameRooms.delete(room.id);
                        }
                    }
                    else if (room.game.ended === false && room.id.includes('local'))
                    {
                        if (room.intervalID)
                            clearInterval(room.intervalID);
                        io.in(room.id).socketsLeave(room.id);
                        GameRooms.delete(room.id);
                    }
                }
                user.isInGame = false;

                if (room.playercount > 0)
                    room.playercount -= 1;
            }
            
            if (user.wasInGame === false)
                user.sockets.delete(client_socket.id);

            if (user.sockets.size === 0)
                userSocket.delete(userId);
        });
    });
}
