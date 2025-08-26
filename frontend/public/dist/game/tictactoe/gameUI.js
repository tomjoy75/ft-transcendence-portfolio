import { createGameState, makeMove } from './gameLogic.js';
let state;
let container;
export function setupGameUI(containerId) {
    container = document.getElementById(containerId);
    state = createGameState();
    render();
    container.addEventListener('click', handleClick);
}
function render() {
    container.innerHTML = '';
    const table = document.createElement('table');
    table.className = 'border-collapse border border-gray-500 m-auto';
    for (let r = 0; r < state.size; r++) {
        const tr = document.createElement('tr');
        for (let c = 0; c < state.size; c++) {
            const td = document.createElement('td');
            td.className = 'w-12 h-12 border border-gray-500 text-center align-middle cursor-pointer select-none text-2xl';
            td.dataset.row = r.toString();
            td.dataset.col = c.toString();
            td.textContent = state.board[r][c] || '';
            tr.appendChild(td);
        }
        table.appendChild(tr);
    }
    container.appendChild(table);
    // Status
    const status = document.createElement('div');
    status.className = 'mt-4 text-center text-white text-lg';
    if (state.winner === 'Draw') {
        status.textContent = 'Game ended in a draw.';
    }
    else if (state.winner) {
        status.textContent = `Player ${state.winner} wins!`;
    }
    else {
        status.textContent = `Current turn: Player ${state.currentPlayer}`;
    }
    container.appendChild(status);
    // Restart button
    const btn = document.createElement('button');
    btn.textContent = 'Restart Game';
    btn.className = 'mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700';
    btn.onclick = () => {
        state = createGameState();
        render();
    };
    container.appendChild(btn);
}
function handleClick(event) {
    const target = event.target;
    if (target.tagName !== 'TD')
        return;
    const row = Number(target.dataset.row);
    const col = Number(target.dataset.col);
    if (makeMove(state, row, col)) {
        render();
    }
}
