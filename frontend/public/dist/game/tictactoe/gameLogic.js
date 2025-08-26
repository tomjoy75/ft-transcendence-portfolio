export function createGameState(size = 5, winLength = 4) {
    const board = Array.from({ length: size }, () => Array.from({ length: size }, () => null));
    return {
        board,
        currentPlayer: 'X',
        winner: null,
        size,
        winLength,
    };
}
export function makeMove(state, row, col) {
    if (state.winner)
        return false;
    if (state.board[row][col] !== null)
        return false;
    state.board[row][col] = state.currentPlayer;
    if (checkWin(state, row, col)) {
        state.winner = state.currentPlayer;
    }
    else if (isBoardFull(state.board)) {
        state.winner = 'Draw';
    }
    else {
        state.currentPlayer = state.currentPlayer === 'X' ? 'O' : 'X';
    }
    return true;
}
function isBoardFull(board) {
    return board.every(row => row.every(cell => cell !== null));
}
// Win check after turn [row,col]
function checkWin(state, row, col) {
    const directions = [
        [0, 1], // horrizontal
        [1, 0], // vertical
        [1, 1], // diagonal \
        [1, -1], // diagonal /
    ];
    const current = state.currentPlayer;
    const size = state.size;
    const winLength = state.winLength;
    const board = state.board;
    for (const [dx, dy] of directions) {
        let count = 1;
        // check side +
        for (let step = 1; step < winLength; step++) {
            const r = row + step * dx;
            const c = col + step * dy;
            if (r < 0 || r >= size || c < 0 || c >= size)
                break;
            if (board[r][c] === current)
                count++;
            else
                break;
        }
        // check side -
        for (let step = 1; step < winLength; step++) {
            const r = row - step * dx;
            const c = col - step * dy;
            if (r < 0 || r >= size || c < 0 || c >= size)
                break;
            if (board[r][c] === current)
                count++;
            else
                break;
        }
        if (count >= winLength)
            return true;
    }
    return false;
}
