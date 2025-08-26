import { getCurrentUser } from "../../core/state.js";
import { initMultiGame } from './initMultiGame.js';
import { initLocalGame } from './initLocalGame.js';
import { clearKeyHandler } from "./keyboardhandler.js";
export const socket = io('http://localhost:3002', {
    autoConnect: false,
});
function socketDisconnectOnHashChange(socket) {
    const onHashChange = () => {
        console.log('Hash change detected: socket disconnection');
        socket.disconnect();
        window.removeEventListener('hashchange', onHashChange);
        clearKeyHandler();
    };
    window.addEventListener('hashchange', onHashChange);
}
export function getPongScreen() {
    var _a, _b, _c;
    console.log(`state user id2: ${(_a = getCurrentUser()) === null || _a === void 0 ? void 0 : _a.id}`);
    const username = (_b = getCurrentUser()) === null || _b === void 0 ? void 0 : _b.username;
    const alias = (_c = getCurrentUser()) === null || _c === void 0 ? void 0 : _c.alias;
    const container = document.createElement('div');
    container.id = 'pong-game-container';
    container.className = 'flex flex-col gap-8 p-4 justify-start items-center w-full h-screen relative';
    function msg_box(container, message) {
        console.log(message);
        const div = document.createElement('div');
        div.textContent = message;
        div.className = 'w-full';
        container.appendChild(div);
    }
    ;
    socket.on("connect", () => {
        msg_box(container, `you connected to socket with id: ${socket.id}`);
        console.log(`you connected id: ${socket.id}`);
        socketDisconnectOnHashChange(socket);
        if (username)
            socket.emit('userSocketRegistering', username);
        else {
            socket.disconnect();
            console.error('No current user found, cannot register socket');
            return (container);
        }
    });
    socket.on('connect_error', (err) => {
        console.error('connection error :', err.message);
        msg_box(container, `connection error`);
    });
    socket.io.on('reconnect_attempt', () => {
        console.log('reconnection attempt...');
        msg_box(container, 'reconnection attempt...');
    });
    socket.connect();
    const formlocal = document.createElement('form');
    formlocal.id = 'formlocal';
    formlocal.className = 'flex gap-4 mt-4 justify-center items-center max-w-md max-h-md text-black';
    const input1local = document.createElement('input');
    input1local.className = 'w-full px-4 py-2 rounded';
    input1local.placeholder = 'Player 1 name';
    input1local.required = true;
    const input2local = document.createElement('input');
    input2local.className = 'w-full px-4 py-2 rounded';
    input2local.placeholder = 'Player 2 name';
    input2local.required = true;
    const startBtnlocal = document.createElement('button');
    startBtnlocal.type = 'submit';
    startBtnlocal.textContent = 'Start Local';
    startBtnlocal.className = 'bg-white px-6 py-2 rounded font-semibold hover:bg-gray-300';
    const startBtnmulti = document.createElement('button');
    startBtnmulti.id = 'startButmulti';
    startBtnmulti.textContent = 'Start Multiplayer';
    startBtnmulti.className = 'flex gap-4 mt-24 justify-center items-center max-w-md max-h-md bg-white text-black px-6 py-2 rounded font-semibold hover:bg-gray-300';
    const startBtntournament = document.createElement('button');
    startBtntournament.id = 'startBtntournament';
    startBtntournament.textContent = 'Start Tournament';
    startBtntournament.className = 'flex gap-4 mt-4 justify-center items-center max-w-md max-h-md bg-white text-black px-6 py-2 rounded font-semibold hover:bg-gray-300';
    const divAlias = document.createElement('div');
    divAlias.id = 'divAlias';
    divAlias.className = 'flex mt-4 gap-4 justify-center items-center max-w-md max-h-md text-black';
    const useAliasName = document.createElement('input');
    useAliasName.type = 'checkbox';
    useAliasName.id = 'useAliasName';
    useAliasName.checked = false;
    useAliasName.className = 'mr-2';
    const useAliasNameLabel = document.createElement('label');
    useAliasNameLabel.htmlFor = 'useAliasName';
    useAliasNameLabel.textContent = 'Use alias for multiplayer and tournament';
    useAliasNameLabel.className = 'text-white';
    divAlias.append(useAliasNameLabel, useAliasName);
    formlocal.append(input1local, input2local, startBtnlocal);
    container.append(formlocal, startBtnmulti, startBtntournament, divAlias);
    const canvas = document.createElement('canvas');
    canvas.id = 'gameCanvas';
    canvas.width = 1000;
    canvas.height = 600;
    canvas.className = 'hidden mx-auto rounded-lg';
    canvas.style.backgroundColor = 'black';
    container.appendChild(canvas);
    formlocal.addEventListener('submit', (e) => {
        e.preventDefault();
        const name1 = input1local.value.trim();
        const name2 = input2local.value.trim();
        initLocalGame(name1, name2);
    });
    startBtnmulti.addEventListener('click', (e) => {
        e.preventDefault();
        if (useAliasName.checked && alias)
            initMultiGame(alias);
        else
            initMultiGame(username);
    });
    startBtntournament.addEventListener('click', (e) => {
        e.preventDefault();
        // if (useAliasName.checked && alias)
        // initTournamentGame(alias);
        // else
        // initTournamentGame(username!);
    });
    return (container);
}
export function showHideGameMenu(show) {
    const startBtnmulti = document.getElementById('startButmulti');
    const startBtntournament = document.getElementById('startBtntournament');
    const DivAlias = document.getElementById('divAlias');
    const formlocal = document.getElementById('formlocal');
    const canvas = document.getElementById('gameCanvas');
    if (show) {
        startBtnmulti.classList.remove('hidden');
        startBtntournament.classList.remove('hidden');
        DivAlias.classList.remove('hidden');
        formlocal.classList.remove('hidden');
        canvas.classList.add('hidden');
    }
    else {
        startBtnmulti.classList.add('hidden');
        startBtntournament.classList.add('hidden');
        DivAlias.classList.add('hidden');
        formlocal.classList.add('hidden');
    }
}
export function showGameOverMessage() {
    const container = document.getElementById('pong-game-container');
    const messageBox = document.createElement('div');
    messageBox.className = `fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
        bg-slate-800 p-4 rounded text-center`;
    const text = document.createElement('p');
    text.textContent = 'Game is Over!';
    text.className = 'text-xl mb-4 text-white';
    messageBox.appendChild(text);
    const buttons = document.createElement('div');
    buttons.className = 'flex justify-center gap-4';
    const playAgainBtn = document.createElement('button');
    playAgainBtn.textContent = 'Play Again';
    playAgainBtn.className = 'bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600';
    playAgainBtn.onclick = () => {
        showHideGameMenu(true);
        messageBox.remove();
    };
    const returnHomeBtn = document.createElement('button');
    returnHomeBtn.textContent = 'Return Home';
    returnHomeBtn.className = 'bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600';
    returnHomeBtn.onclick = () => {
        window.location.hash = '#/home';
        messageBox.remove();
    };
    buttons.appendChild(playAgainBtn);
    buttons.appendChild(returnHomeBtn);
    messageBox.appendChild(buttons);
    container.appendChild(messageBox);
}
