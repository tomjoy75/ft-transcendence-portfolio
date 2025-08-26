import { Server as SocketIOServer } from "socket.io";
import { GameRoom, userData, userSocket, GameRooms } from './server.js';
import { GameState, winScore, PongGame } from './pong.js';
import { sendGameResult } from './gameResult.js';

export interface MatchInfo {
	id: number;
	date: string;
	player1: {
		id: number;
		username: string;
		avatar: string;
		alias: string;
		score: number | null;
	};
	player2: {
        id: number;
		username: string;
		avatar: string;
		alias: string;
		score: number | null;
	};
	winner: string | null;
	round: number;
	tournamentId: number | null;
	type: string | null;
	position: number;
	parent_match1_id: number | null;
	parent_match2_id: number | null;
	is_bye: boolean;
}

export function renderPongStart(room: GameRoom, io: SocketIOServer): void
{
    const gameState: GameState = room.game.serialize();
    io.to(room.id).emit('gameState', gameState);
}

export function setPlayerNotInGame(userId: number): void
{
    const playerSocket: userData | undefined = userSocket.get(userId);
    if (playerSocket)
        playerSocket.isInGame = false;
}

export function handlePlayerForfeit(userId: number, room: GameRoom, io: SocketIOServer): void
{
    let forfeitedPlayer: number = -1;
    if (room.game.player1.id === userId)
    {
        forfeitedPlayer = 1;
        room.game.player2.score = winScore;
    }
    else if (room.game.player2.id === userId)
    {
        forfeitedPlayer = 2;
        room.game.player1.score = winScore;
    }

    if (GameRooms.has(room.id))
    {
        room.game.ended = true;
        room.game.pause = false;
        io.to(room.id).emit('unpause', true);
    }
    else    // Both players left room, no sending game result
        console.error(`server: room ${room.id} has been deleted in handlePlayerForfeit`);

    const userdata: userData | undefined = userSocket.get(userId);
    if (!userdata)
        return;

    userdata.sockets.delete(userdata.oldSocketId!);
    if (userdata.sockets.size === 0)
        userSocket.delete(userId);

    delete userdata.reconnectingTimeOut;
    delete userdata.oldRoomId;
    delete userdata.oldSocketId;
    userdata.wasInGame = false;
}

export function forfeitTournamentPlayer(matchId: number, winner: string, winnerId: number, currentUser: userData, roomcount: number): void
{
    const tmpRoom: GameRoom = {
        game: new PongGame(),
        playercount: 1,
        id: `Game Room ID multi ${roomcount}`,
        index: roomcount,
        tournamentMatchId: matchId,
    };

    tmpRoom.game.player2.name = winner;
    tmpRoom.game.player2.id = winnerId;

    currentUser.currentRoomId = tmpRoom.id;
    currentUser.isInGame = true;

    tmpRoom.game.player1.score = 0;
    tmpRoom.game.player2.score = winScore;
    setPlayerNotInGame(tmpRoom.game.player2.id);

    sendGameResult(tmpRoom);

    GameRooms.delete(tmpRoom.id);
}

export async function getUserById(userId: number, token: string): Promise<{ username: string, alias: string, email: string, avatar: string } | null> {
    try
    {
        const res: Response = await fetch(`http://backend:3001/user/id/${userId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'authorization': `Bearer ${token}`
            }
        });

        if (!res.ok)
        {
            console.error(`failed to get user ${userId}`);
            return null;
        }
        
        return await res.json();
    }
    catch (error)
    {
        console.error(`error failed to get user ${userId}:`, error);
        return null;
    }
}

export async function getMatchIdInformation(matchId: number, token: string): Promise<MatchInfo | null>
{
    try
    {
        const res: Response = await fetch(`http://backend:3001/matches/${matchId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'authorization': `Bearer ${token}`
            }
        });

        if (!res.ok)
        {
            console.error(`failed to fetch match information ${matchId}`);
            return null;
        }

        return await res.json();
    }
    catch (error)
    {
        console.error(`error failed to fetch match information ${matchId}:`, error);
    }
    return null;
}
