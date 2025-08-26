import { setupGameUI } from './gameUI.js';
export function getTicTacToeScreen() {
    const container = document.createElement('div');
    container.className = 'flex gap-6 p-4 justify-center items-start w-full h-full';
    const form = document.createElement('form');
    form.className = 'flex gap-4 justify-center items-center max-w-md max-h-md text-black';
    const input1 = document.createElement('input');
    input1.className = 'w-full px-4 py-2 rounded';
    input1.placeholder = 'Player X name';
    input1.required = true;
    const input2 = document.createElement('input');
    input2.className = 'w-full px-4 py-2 rounded';
    input2.placeholder = 'Player O name';
    input2.required = true;
    const startBtn = document.createElement('button');
    startBtn.type = 'submit';
    startBtn.textContent = 'Start Game';
    startBtn.className = 'bg-white px-6 py-2 rounded font-semibold hover:bg-gray-300';
    form.append(input1, input2, startBtn);
    container.appendChild(form);
    const gameContainer = document.createElement('div');
    gameContainer.id = 'tictactoe-game-container';
    gameContainer.className = 'mt-28 hidden mx-auto rounded-lg';
    container.appendChild(gameContainer);
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const name1 = input1.value.trim();
        const name2 = input2.value.trim();
        if (!name1 || !name2) {
            alert('Please enter both player names.');
            return;
        }
        form.classList.add('hidden');
        gameContainer.classList.remove('hidden');
        setupGameUI('tictactoe-game-container');
    });
    return container;
}
