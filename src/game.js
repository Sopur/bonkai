import { ChaseAI } from "./ai/algo/chase.js";
import { MiniMaxAI } from "./ai/minimax/minimax.js";
import { lerp } from "./math.js";
import { PhysicsEngine, World } from "./physics.js";
import { Circle, Entity, Rectangle, Vector2d, WorldSettings } from "./util.js";

class GameEngine {
    /**
     *
     * @param {Element} canvas Canvas
     * @param {CanvasRenderingContext2D} ctx Context 2d
     * @param {WorldSettings} settings Settings
     * @param {World} world World
     * @param {number} fov FOV
     */
    constructor(canvas, ctx, settings, world, fov) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.settings = settings;
        this.world = world;
        this.camera = new Vector2d(0);
        this.fov = fov;
        this.engine = new PhysicsEngine(settings);
        this.defaultWorld = world.copy();
        this.ai1 = new ChaseAI(0, world.players);
        //this.ai1 = new MiniMaxAI(settings, 0, world.players);
        this.ai2 = new MiniMaxAI(settings, 1, world.players);
        this.lastEval = 0;

        this.resetScreen();
        this.backgroundColor = "black";
        this.outlineSize = 5;
        this.outOfBoundsArea = new Entity("grey", 0, this.settings.outOfBoundRadius, 0, 0);
    }

    setTransform(color, opacity, x, y) {
        this.ctx.setTransform(this.fov, 0, 0, this.fov, x, y);
        this.ctx.lineWidth = this.outlineSize;
        this.ctx.strokeStyle = "black";
        this.ctx.fillStyle = color;
        this.ctx.globalAlpha = opacity;
    }

    drawCircle(circle) {
        this.setTransform(circle.color, circle.movement.harden ? 0.5 : 1, circle.x, circle.y);
        this.ctx.beginPath();
        this.ctx.arc(0, 0, circle.radius, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.fill();
    }

    drawRectangle(rect) {
        this.setTransform(rect.color, 1, rect.x, rect.y);
        this.ctx.beginPath();
        this.ctx.rect(-rect.width / 2, -rect.height / 2, rect.width, rect.height);
        this.ctx.stroke();
        this.ctx.fill();
    }

    resetScreen() {
        this.screen = new Rectangle(window.innerWidth, window.innerHeight);
        this.canvas.width = this.screen.width;
        this.canvas.height = this.screen.height;
        this.setTransform(this.backgroundColor, 1, 0, 0);
        this.ctx.fillRect(0, 0, this.screen.width / this.fov, this.screen.height / this.fov);
    }

    project(entity) {
        const newPos = entity.projectFromGame(this.camera, this.fov, this.screen);
        return { ...entity, ...newPos };
    }

    render() {
        this.resetScreen();

        this.drawCircle(this.project(this.outOfBoundsArea));
        this.drawRectangle(this.project(this.world.platform));

        for (const entity of this.world.players) {
            if (entity.distance(new Vector2d(0)) > this.settings.outOfBoundRadius) {
                this.world = this.defaultWorld.copy();
                break;
            }

            this.drawCircle(this.project(entity));
        }
        return false;
    }

    iteration() {
        this.ai1.iteration(this.world, 1);

        this.lastEval = lerp(this.lastEval, this.ai2.iteration(this.world, 7), 0.1);
        this.setTransform("blue", 1, 0, 0);
        this.ctx.fillRect(50, 40, 40, (this.screen.height - 40) / this.fov);
        this.setTransform("red", 1, 0, 0);
        this.ctx.fillRect(50, 40, 40, (this.screen.height / 2 + (this.lastEval / 10) * (this.screen.height - 40)) / this.fov);

        this.world = this.engine.preformIterations(this.world, 1);
    }
}

export { GameEngine };
