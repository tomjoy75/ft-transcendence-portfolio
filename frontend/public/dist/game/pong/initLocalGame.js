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
export function initLocalGame(name1, name2) {
    return __awaiter(this, void 0, void 0, function* () {
        const canvas = document.getElementById('gameCanvas');
        let initData;
        socket.off('gameError');
        socket.once('gameError', (message) => {
            showToast(`error : ${message}`);
            console.error(`error: ${message}`);
            return;
        });
        try {
            const responseStart = yield fetch('http://localhost:3002/api/game/create-game', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ players: [name1, name2] })
            });
            initData = yield responseStart.json();
            if (!responseStart.ok) {
                console.error('error: ', responseStart.status, initData.error);
                return;
            }
            const responseJoin = yield socket.emitWithAck('joinRoomLocal', initData.roomId);
            if (responseJoin.error) {
                showToast(`${responseJoin.error}`);
                console.error("error:", responseJoin.error);
                return;
            }
        }
        catch (err) {
            console.error('error caught:', err);
            return;
        }
        console.log('client: game start local');
        showHideGameMenu(false);
        socket.off('gameStart');
        socket.on('gameStart', (roomIndex) => {
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
                    // console.log(`keyevent called in room ${initData.roomId}`);
                    if ((key === 'w' || key === 's')
                        || (key === 'ArrowUp' || key === 'ArrowDown')) {
                        event.preventDefault();
                        // socket.emit('handleKeyEvent', event.key, event.type);
                        const response = yield fetch('http://localhost:3002/api/game/move', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                roomId: roomIndex,
                                playerSide: 0,
                                key: key,
                                type: event.type,
                                mode: 'local'
                            })
                        });
                        if (!response.ok)
                            console.error('error: ', response.status);
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
