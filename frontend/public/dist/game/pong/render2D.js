export class CanvasRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        const context = this.canvas.getContext('2d');
        if (!context)
            throw new Error('Context error');
        this.ctx = context;
    }
    ;
    render(game, name1, name2) {
        this.ctx.clearRect(0, 0, 1000, 600);
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(game.ball.x, game.ball.y, game.ball.length, game.ball.length);
        this.ctx.fillRect(game.player1.x, game.player1.y, game.player1.width, game.player1.height);
        this.ctx.fillRect(game.player2.x, game.player2.y, game.player2.width, game.player2.height);
        this.ctx.strokeStyle = 'white';
        this.ctx.beginPath();
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([15, 10]);
        this.ctx.moveTo(500, 60);
        this.ctx.lineTo(500, 600);
        this.ctx.stroke();
        this.ctx.font = '28px sans-serif';
        this.ctx.fillText(`${game.player1.score} - ${game.player2.score}`, 468, 45);
        this.ctx.fillText(`${name1}`, 220, 45);
        this.ctx.fillText(`${name2}`, 720, 45);
    }
    ;
}
