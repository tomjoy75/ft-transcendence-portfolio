import { MatchInfo } from "../../core/state.js"
import { hostIP } from "../../core/auth.js";
import type { Socket } from "socket.io-client/build/esm/socket";
import { clearKeyHandler } from "./keyboardhandler.js";

export interface GameState 
{
    ball: {x: number, y: number, length: number};
    player1: {x: number, y: number, score: number, width: number, height: number};
    player2: {x: number, y: number, score: number, width: number, height: number};
}

export async function getMatchInfo(matchId: number): Promise<MatchInfo>
{
    const res = await fetch(`https://${hostIP}:3443/api/matches/${matchId}`, {
        headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
    });
    if (!res.ok) throw new Error('Failed to fetch matches');
    return res.json();
}

export function socketDisconnectOnHashChange(socket: Socket)
{
    const onHashChange = () => {
        window.removeEventListener('hashchange', onHashChange);
        
        if (socket)
        {
            socket.removeAllListeners();
            socket.disconnect();
        }
        clearKeyHandler();
    };
  
    window.addEventListener('hashchange', onHashChange);
}

export function showHideGameMenu(show: boolean): void
{
	const startBtnmulti: HTMLElement = document.getElementById('startButmulti') as HTMLElement;
    const startBtntournament: HTMLElement = document.getElementById('startButtournament') as HTMLElement;
    const DivAlias: HTMLElement = document.getElementById('divAlias') as HTMLElement;
	const formlocal: HTMLElement = document.getElementById('formlocal') as HTMLElement;
    const pongGameInfo: HTMLElement = document.getElementById('pongGameInfo') as HTMLElement;
    const canvas: HTMLCanvasElement = document.getElementById('gameCanvas') as HTMLCanvasElement;

    if (show)
    {
        startBtnmulti.classList.remove('hidden');
        startBtntournament.classList.remove('hidden');
        DivAlias.classList.remove('hidden');
        formlocal.classList.remove('hidden');
        pongGameInfo.classList.remove('hidden');
        canvas.classList.add('hidden');
    }
    else
    {
        startBtnmulti.classList.add('hidden');
        startBtntournament.classList.add('hidden');
        DivAlias.classList.add('hidden');
        formlocal.classList.add('hidden');
        pongGameInfo.classList.add('hidden');
    }
}

export function showGameOverMessage(tournamentId?: number): void
{
    const container: HTMLElement = document.getElementById('pong-game-container') as HTMLElement;

    const messageBox = document.createElement('div');
    messageBox.id = 'gameOverBox';
    messageBox.className = `fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
        bg-slate-800 p-4 rounded text-center`;

    const text = document.createElement('p');
    text.textContent = 'Game is Over!';
    text.className = 'text-xl mb-4 text-white';
    messageBox.appendChild(text);

    const buttons = document.createElement('div');
    buttons.className = 'flex justify-center gap-4';

    const returnHomeBtn = document.createElement('button');
    returnHomeBtn.className = 'bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600';

    if (tournamentId)
    {
        returnHomeBtn.textContent = 'Return to bracket';
        returnHomeBtn.onclick = () => {

            window.location.hash = `#/tournaments/${tournamentId}/bracket`;
            messageBox.remove();
        };
    }
    else
    {
        const playAgainBtn = document.createElement('button');
        playAgainBtn.textContent = 'Play Again';
        playAgainBtn.className = 'bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600';
        playAgainBtn.onclick = () => {

            showHideGameMenu(true);
            messageBox.remove();
        };
        returnHomeBtn.textContent = 'Return Home';
        returnHomeBtn.onclick = () => {

            window.location.hash = '#/home';
            messageBox.remove();
        };

        buttons.appendChild(playAgainBtn);
    }
    buttons.appendChild(returnHomeBtn);
    messageBox.appendChild(buttons);

    container.appendChild(messageBox);
}
