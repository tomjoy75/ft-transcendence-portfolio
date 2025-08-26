var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { socket, showGameOverMessage, showHideGameMenu } from './gameRender.js';
import { CanvasRenderer } from './render2D.js';
import { setKeyEventHandler, clearKeyHandler } from './keyboardhandler.js';
import { showToast } from "../../core/utils.js";
export function initMultiGame(name) {
    return __awaiter(this, void 0, void 0, function* () {
        const container = document.getElementById('pong-game-container');
        const canvas = document.getElementById('gameCanvas');
        let initData;
        const waitingMessage = document.createElement('div');
        waitingMessage.id = 'waitingMessage';
        waitingMessage.textContent = 'Waiting for another player...';
        waitingMessage.className = 'text-white text-2xl';
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancel';
        cancelBtn.className = 'bg-red-500 text-white px-4 py-2 rounded';
        cancelBtn.onclick = () => {
            socket.emit('cancelMultiplayer');
            showHideGameMenu(true);
            waitingMessage.remove();
            cancelBtn.remove();
        };
        socket.off('gameError');
        socket.once('gameError', (message) => {
            showToast(`error from socket: ${message}`);
            console.error(`error: ${message}`);
            waitingMessage === null || waitingMessage === void 0 ? void 0 : waitingMessage.remove();
            cancelBtn === null || cancelBtn === void 0 ? void 0 : cancelBtn.remove();
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
        socket.on('unpause', (forfeited) => {
            const pauseDiv = document.getElementById('pauseDiv');
            if (pauseDiv)
                pauseDiv.remove();
            if (forfeited)
                showToast('Opponent has forfeited.', 5000);
            else
                showToast('Game starts in 2 seconds...');
        });
        try {
            initData = yield socket.emitWithAck('initMultiplayer', name);
            if ('error' in initData) {
                socket.off('gameError');
                console.error(`error: ${initData.error}`);
                showToast(`${initData.error}`);
                return;
            }
            else if (initData.playerSide === 2 && !initData.isReconnect)
                socket.emit('gameReady');
        }
        catch (err) {
            socket.off('gameError');
            console.error('Socket error from catch:', err);
            return;
        }
        showHideGameMenu(false);
        container.appendChild(waitingMessage);
        container.appendChild(cancelBtn);
        socket.off('gameStart');
        socket.on('gameStart', (name1, name2) => {
            console.log(`client: name1: ${name1}, name2: ${name2}`);
            waitingMessage.remove();
            cancelBtn.remove();
            canvas.classList.remove('hidden');
            showToast('Game starts in 2 seconds...');
            const renderer = new CanvasRenderer(canvas);
            socket.off('gameState');
            socket.on('gameState', (gameState) => {
                renderer.render(gameState, name1, name2);
            });
            function handleKeyEvent(event) {
                return __awaiter(this, void 0, void 0, function* () {
                    const key = event.key;
                    // console.log(`keyevent called in room ${initData.index}`);
                    if ((key === 'w' || key === 's')
                        || (key === 'ArrowUp' || key === 'ArrowDown')) {
                        event.preventDefault();
                        const response = yield fetch('http://localhost:3002/api/game/move', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
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
                });
            }
            setKeyEventHandler(handleKeyEvent);
            socket.off('gameOver');
            socket.on('gameOver', () => {
                clearKeyHandler();
                showGameOverMessage();
                showToast('Game Over!');
            });
        });
    });
}
