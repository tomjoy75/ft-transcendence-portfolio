import { socket } from './gameRender.js';
import { showGameOverMessage, showHideGameMenu, GameState } from './gameRenderUtils.js';
import { CanvasRenderer } from './render2D.js';
import { setKeyEventHandler, clearKeyHandler } from './keyboardhandler.js';
import { showToast } from "../../utils/authUtils.js";
import { hostIP } from '../../core/auth.js';

export async function initMultiGame(name: string, matchId?: number)
{
    const container: HTMLElement = document.getElementById('pong-game-container') as HTMLElement;
    const canvas: HTMLCanvasElement = document.getElementById('gameCanvas') as HTMLCanvasElement;
    let initData: any;

    const waitingMessage = document.createElement('div');
    waitingMessage.id = 'waitingMessage';
    waitingMessage.textContent = matchId ? 
        'Waiting for your opponent to join. Please do not leave...' :
        'Waiting for another player...';
    waitingMessage.className = 'text-white text-2xl';

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.className = 'bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded';

    cancelBtn.onclick = () => {

        socket.emit('cancelMultiplayer');

        showHideGameMenu(true);

        waitingMessage.remove();
        cancelBtn.remove();
    };

    socket.off('gameError');
    socket.once('gameError', (message: string) => {

        showToast(`error from socket: ${message}`, 5000);
        console.error(`error: ${message}`);

        waitingMessage?.remove();
        cancelBtn?.remove();

        const gameOverBox = document.getElementById('gameOverBox');
        gameOverBox?.remove();

        showHideGameMenu(true);
        return;
    });

    socket.off('paused');
    socket.on('paused', () => {
        const pauseDiv = document.createElement('div');
        pauseDiv.id = 'pauseDiv';
        pauseDiv.className = `fixed bottom-4 right-4 bg-slate-800 p-4 rounded text-center`;

        const text = document.createElement('p');
        text.textContent = 'Game is paused';
        text.className = 'text-xl mb-4 text-red-500';
        pauseDiv.appendChild(text);
        
        container.appendChild(pauseDiv);
        showToast('Game is paused. Waiting for the other player to resume');
    });

    socket.off('unpause');
    socket.on('unpause', (forfeited: boolean) => {
        const pauseDiv = document.getElementById('pauseDiv');
        if (pauseDiv)
            pauseDiv.remove();

        if (forfeited)
            showToast('Opponent has forfeited.', 5000);
        else
            showToast('Game starts in 2 seconds...');
    });

    try {
        initData = await socket.emitWithAck('initMultiplayer', { name, matchId });

        if ('error' in initData) 
        {
            socket.off('gameError');
            console.error(`error: ${initData.error}`);
            showToast(`${initData.error}`);
            return;
        }
    }
    catch (err)
    {
        socket.off('gameError');
        console.error('Socket error from catch:', err);

        return;
    }

    showHideGameMenu(false);

    if (initData.playercount !== 2)
    {
        container.appendChild(waitingMessage);
        if (!matchId)
            container.appendChild(cancelBtn);
    }

    socket.off('roomReady');
    socket.on('roomReady', (data: { index: number, playerSide: number }) => {
        initData = data;
        socket.emit('gameReady');
    });

    socket.off('gameStart');
    socket.on('gameStart', (name1: string, name2: string) => {

        waitingMessage.remove();
        cancelBtn.remove();
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
                        roomId: initData.index,
                        playerSide: initData.playerSide,
                        key: key,
                        type: event.type,
                        mode: 'multi'
                    })
                });
                if (!response.ok)
                    console.error('error: ', response.status, response.statusText);
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
