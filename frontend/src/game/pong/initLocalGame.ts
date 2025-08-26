import { socket } from './gameRender.js';
import { showGameOverMessage, showHideGameMenu, GameState } from './gameRenderUtils.js';
import { CanvasRenderer } from './render2D.js';
import { setKeyEventHandler, clearKeyHandler } from './keyboardhandler.js';
import { showToast } from "../../utils/authUtils.js";
import { hostIP } from '../../core/auth.js';
import { getCurrentUser } from "../../core/state.js"

export async function initLocalGame(name1: string, name2: string, matchId?: number)
{
    const canvas: HTMLCanvasElement = document.getElementById('gameCanvas') as HTMLCanvasElement;
    let initData: any;

    socket.off('gameError');
    socket.once('gameError', (message: string) => {
        showToast(`error : ${message}`, 5000);
        console.error(`error: ${message}`);

        const gameOverBox = document.getElementById('gameOverBox');
        gameOverBox?.remove();

        showHideGameMenu(true);
        return;
    });

    try
    {
        const responseStart = await fetch(`https://${hostIP}:3443/api/game/create-game`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
	            'Authorization': `Bearer ${localStorage.getItem('token')}`
             },
            body: JSON.stringify({ players: [name1, name2], userID: getCurrentUser()?.id })
        });
        initData = await responseStart.json();
        if ('error' in initData)
        {
            showToast(initData.error);
            console.error('error: ', responseStart.status, initData.error);
            return;
        }

        const responseJoin = await socket.emitWithAck('joinRoomLocal', { roomId: initData.roomId, matchId: matchId });
        if (responseJoin.error)
        {
            showToast(`${responseJoin.error}`);
            console.error("error:", responseJoin.error);
            return;
        }
    }
    catch (err)
    {
        console.error('error caught:', err);
        return;
    }

    showHideGameMenu(false);

    socket.off('gameStart');
    socket.on('gameStart', () => {

        canvas.classList.remove('hidden');
        showToast('Game starts in 2 seconds...');

        const renderer: CanvasRenderer = new CanvasRenderer(canvas);
        
        socket.off('gameState');
        socket.on('gameState', (gameState: GameState) => {
            renderer.render(gameState, name1, name2);
        });

        async function handleKeyEvent(event: KeyboardEvent)
        {
            const key = event.key;
            
            if ((key === 'w' || key === 's')
                || (key === 'ArrowUp' || key === 'ArrowDown'))
            {
                event.preventDefault();
                const response = await fetch(`https://${hostIP}:3443/api/game/move`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
		                'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({
                        roomId: initData.roomId,
                        playerSide: 0,
                        key: key,
                        type: event.type,
                        mode: 'local'
                    })
                });
                if (!response.ok)
                    console.error('error: ', response.status);
            }
        }
        setKeyEventHandler(handleKeyEvent);

        socket.off('gameOver');
        socket.on('gameOver', (tournamentId?: number) => {
            clearKeyHandler();

            showGameOverMessage(tournamentId);

            showToast('Game Over!');
        });
    });
}
