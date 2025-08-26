export class Ball
{
    x: number;
    y: number;
    vx: number = 6;
    vy: number = 6;
    length: number = 8;

    constructor(canvasLength: number, canvasHeight:number)
    {
        this.x = (canvasLength / 2) - (this.length / 2);
        this.y = (canvasHeight / 2) - (this.length / 2);
    }

    update(): void
    {
        this.x += this.vx;
        this.y += this.vy;
    }

    reset(canvasLength: number, canvasHeight:number): void
    {
        this.x = (canvasLength / 2) - (this.length / 2);
        this.y = (canvasHeight / 2) - (this.length / 2);
        this.vx = 0;
        this.vy = 0;
    }
}