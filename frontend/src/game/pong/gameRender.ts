import { getCurrentUser, MatchInfo } from "../../core/state.js"
import { getMatchInfo, socketDisconnectOnHashChange } from './gameRenderUtils.js';
import { initMultiGame } from './initMultiGame.js';
import { initLocalGame } from './initLocalGame.js';
import type { Socket } from "socket.io-client/build/esm/socket";
import { hostIP } from "../../core/auth.js";
import { showToast } from "../../utils/authUtils.js";

declare const io: (url: string, opts?: any) => Socket;

const hostURL: string = `https://${hostIP}:3443`;

export const socket: Socket = io(hostURL, {
    autoConnect: false,
});

export function getPongScreen(matchId?: number): HTMLElement
{
    const username: string | undefined = getCurrentUser()?.username;
    const alias: string | undefined = getCurrentUser()?.alias;
    const userId : number | undefined = getCurrentUser()?.id;

    const container: HTMLDivElement = document.createElement('div');
    container.id = 'pong-game-container';
    container.className = 'flex flex-col gap-8 p-4 justify-start items-center w-full h-screen relative';

    const infoLocal = document.createElement('div');
    infoLocal.className = 'flex flex-row gap-4 w-full justify-center items-start';

    const info = document.createElement('div');
    info.id = 'pongGameInfo';
	info.className = 'max-w-lg text-white text-sm bg-gray-700 rounded p-4 space-y-2';

	info.innerHTML = `
		<h3 class="text-lg font-bold mb-2">How to Play Pong</h3>
		<ul class="list-disc pl-5 space-y-1">
			<li>Player 1: controls with <strong>W</strong> and <strong>S</strong></li>
			<li>Player 2: controls with <strong>Arrow Up</strong> and <strong>Arrow Down</strong></li>
			<li>The first player to reach <strong>5 points</strong> wins.</li>
			<li>Ball speed is random after each bounce.</li>
		</ul>
	`;

    socket.off('connect');
    socket.on("connect", async () => {
        socketDisconnectOnHashChange(socket);
        if (username)
        {
            try
            {
                const response = await socket.emitWithAck('userSocketRegistering', userId, localStorage.getItem('token'));
            
                if (matchId && response.reconnection === false)
                {
                    const matchInfo: MatchInfo = await getMatchInfo(matchId);
                    if (matchInfo.type === 'remote')
                        initMultiGame(alias ? alias : username!, matchId);
                    else if (matchInfo.type === 'local')
                        initLocalGame(matchInfo.player1.alias, matchInfo.player2.alias, matchId);
                }
            }
            catch (error)
            {
                socket.disconnect();
                console.error('registration failed:', error);
                showToast('registration failed');
                return;
            }
        }
    });

    socket.off('reconnectToGame');
    socket.on('reconnectToGame', () => {
        showToast('reconnecting to game...');
        
        initMultiGame(username!);
    });

    socket.connect();

    const formlocal: HTMLFormElement = document.createElement('form');
    formlocal.id = 'formlocal';
    formlocal.className = 'flex flex-col gap-4 justify-center items-center max-w-md max-h-md';

    const input1local: HTMLInputElement = document.createElement('input');
    input1local.className = 'w-full px-4 py-2 rounded bg-gray-800 text-dark';
    input1local.placeholder = 'Player 1 name';
    input1local.required = true;

    const input2local: HTMLInputElement = document.createElement('input');
    input2local.className = 'w-full px-4 py-2 rounded bg-gray-800 text-dark';
    input2local.placeholder = 'Player 2 name';
    input2local.required = true;

    const startBtnlocal: HTMLButtonElement = document.createElement('button');
    startBtnlocal.type = 'submit';
    startBtnlocal.textContent = 'Start Local';
    startBtnlocal.className = 'bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded text-white font-semibold';

    const startBtnmulti: HTMLButtonElement = document.createElement('button');
    startBtnmulti.id = 'startButmulti';
    startBtnmulti.textContent = 'Play Multiplayer';
    startBtnmulti.className = 'flex gap-4 mt-20 justify-center items-center max-w-md max-h-md bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded font-semibold';

    const startBtntournament: HTMLButtonElement = document.createElement('button');
    startBtntournament.id = 'startButtournament';
    startBtntournament.textContent = 'Play Tournament';
    startBtntournament.className = 'flex gap-4 mt-20 justify-center items-center max-w-md max-h-md bg-violet-600 hover:bg-violet-700 text-white px-6 py-2 rounded font-semibold';

    const divAlias: HTMLDivElement = document.createElement('div');
    divAlias.id = 'divAlias';
    divAlias.className = 'flex gap-4 justify-center items-center max-w-md max-h-md text-black';

    const useAliasName: HTMLInputElement = document.createElement('input');
    useAliasName.type = 'checkbox';
    useAliasName.id = 'useAliasName';
    useAliasName.checked = false;
    useAliasName.className = 'mr-2';

    const useAliasNameLabel: HTMLLabelElement = document.createElement('label');
    useAliasNameLabel.htmlFor = 'useAliasName';
    useAliasNameLabel.textContent = 'Use alias for multiplayer';
    useAliasNameLabel.className = 'text-white';

    if (matchId)
    {
        startBtnmulti.classList.add('hidden');
        startBtntournament.classList.add('hidden');
        divAlias.classList.add('hidden');
        formlocal.classList.add('hidden');
        info.classList.add('hidden');
    }

    infoLocal.append(info, formlocal);
    container.prepend(infoLocal);

    divAlias.append(useAliasNameLabel, useAliasName);
    formlocal.append(input1local, input2local, startBtnlocal);
    container.append(startBtnmulti, divAlias, startBtntournament);

    const canvas: HTMLCanvasElement = document.createElement('canvas');
    canvas.id = 'gameCanvas';
    canvas.width = 1000;
    canvas.height = 600;
    canvas.className = 'hidden mx-auto rounded-lg';
    canvas.style.backgroundColor = 'black';
    container.appendChild(canvas);

    formlocal.addEventListener('submit', (e: Event) => {
        e.preventDefault();

        const name1: string = input1local.value.trim();
        const name2: string = input2local.value.trim();

        initLocalGame(name1, name2);
    });

    startBtnmulti.addEventListener('click', (e: Event) => {
        e.preventDefault();

        if (useAliasName.checked && alias)
            initMultiGame(alias);
        else
            initMultiGame(username!);
    });
    startBtntournament.addEventListener('click', (e: Event) => {
        e.preventDefault();

        window.location.hash = '#/tournaments';
    });

    return (container);
}
