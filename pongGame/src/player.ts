export class Player
{
    name: string = '';
    id: number = 0;
    score: number = 0;
    x: number = 0;
    y: number = 0;
    defaultX: number = 0;
    defaultY: number = 0;
    readonly width: number = 8;
    readonly height: number = 80;
    speed: number = 10;
    direction: number = 0;          // -1 for up, 1 for down, 0 for stationary

    constructor(x: number, y: number)
    {
        this.x = x;
        this.y = y;
        this.defaultX = x;
        this.defaultY = y;
    }

    update(canvasHeight: number): void
    {
        this.y += this.direction * this.speed;
        this.y = Math.max(0, Math.min(this.y, canvasHeight - this.height));
    }

    reset(): void
    {
        this.x = this.defaultX;
        this.y = this.defaultY;
    }
}