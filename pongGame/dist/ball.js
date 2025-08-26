export class Ball {
    constructor(canvasLength, canvasHeight) {
        this.vx = 6;
        this.vy = 6;
        this.length = 8;
        this.x = (canvasLength / 2) - (this.length / 2);
        this.y = (canvasHeight / 2) - (this.length / 2);
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
    }
    reset(canvasLength, canvasHeight) {
        this.x = (canvasLength / 2) - (this.length / 2);
        this.y = (canvasHeight / 2) - (this.length / 2);
        this.vx = 0;
        this.vy = 0;
    }
}
