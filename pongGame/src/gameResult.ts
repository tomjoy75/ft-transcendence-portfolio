import { GameRoom, userData, userSocket } from './server.js';
import { getUserById } from './gameUtils.js';

export async function sendGameResult(room: GameRoom, localUserId?: number): Promise<void>
{
    const isLocalGame: boolean = room.id.includes('local');
    const user1: userData | undefined = isLocalGame ? userSocket.get(localUserId!) : userSocket.get(room.game.player1.id);
    const user2: userData | undefined = userSocket.get(room.game.player2.id);
    let validMatchId: number | undefined = room.tournamentMatchId;

    if ((!user1 && !user2) || (!user1?.token && !user2?.token))
        throw new Error(`user not found or token missing from ${room.game.player1.id} and ${room.game.player2.id}`);

    const validToken: string = (user1?.token || user2?.token)!;

    //Create match only for normal multi games
    if (!room.tournamentMatchId)
    {
        const player1Data = await getUserById(room.game.player1.id, validToken);
        const player2Data = await getUserById(room.game.player2.id, validToken);
        const player1: string | undefined = player1Data?.username;
        const player2: string | undefined = player2Data?.username;

        const res: Response = await fetch(`http://backend:3001/matches`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'authorization': `Bearer ${validToken}`
            },
            body: JSON.stringify({
                player1: player1,
                player2: player2
            })
        });
        const resData: any = await res.json();
        if (!res.ok)
            throw new Error(`failed to create match result`);

        validMatchId = resData.matchId;
    }

    if (!validMatchId)
        throw new Error(`validMatchId is undefined`);

    const winnerId: number = room.game.player1.score > room.game.player2.score ? room.game.player1.id : room.game.player2.id;

    const response: Response = await fetch(`http://backend:3001/matches/${validMatchId}/result`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'authorization': `Bearer ${validToken}`
        },
        body: JSON.stringify({
            winner_id: winnerId,
            player1_score: room.game.player1.score,
            player2_score: room.game.player2.score
        })
    });

    const responseData: any = await response.json();
    if (!response.ok)
        throw new Error(`failed to submit match result`);
    console.log(`server: Match result submitted successfully:`, responseData);
}
