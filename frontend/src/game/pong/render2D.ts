import { GameState } from './gameRenderUtils.js'

export class CanvasRenderer {

    private ctx: CanvasRenderingContext2D;
    private canvas: HTMLCanvasElement;

    constructor( canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        const context: CanvasRenderingContext2D | null = this.canvas.getContext('2d');
        if (!context)
            throw new Error('Context error');

        this.ctx = context;
    };

    render(game: GameState, name1: string, name2: string): void
    {
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
        const name1Width: number = this.ctx.measureText(name1).width;
        const name2Width: number = this.ctx.measureText(name2).width;

        const scoreText: string = `${game.player1.score} - ${game.player2.score}`;
        const scoreWidth: number = this.ctx.measureText(scoreText).width;

        this.ctx.fillText(scoreText, 500 - scoreWidth / 2, 45);

        this.ctx.fillText(name1, 235 - name1Width / 2, 45);
        this.ctx.fillText(name2, 745 - name2Width / 2, 45);
    };
}
