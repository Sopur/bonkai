import { GameEngine } from "./game.js";
import { randomNumber } from "./math.js";
import { World } from "./physics.js";
import { Entity, Platform, WorldSettings } from "./util.js";

const cameraFOV = 0.4;

const playerRadius = 50;
const playerMass = 20;
const playersXDistance = 200;
const playerYOffset = -250;

const gravity = 3;
const bounceFactor = 5;
const frictionFactor = 0.2;
const playerAcceleration = 2;
const playerJumpForce = 150;

const outOfBoundRadius = 1000;
const hardHitPowerMultiplier = 2;

function genWorld() {
    let platforms = [];
    for (let i = 0; i < 1; i++) {
        platforms.push(new Platform("green", 1000 + i * 80 * i, 50, 0, -150 + i * 50));
    }
    return new World(
        platforms,
        [
            new Entity("blue", randomNumber(5, 10), randomNumber(30, 100), -playersXDistance, playerYOffset),
            new Entity("red", randomNumber(5, 10), randomNumber(30, 100), playersXDistance, playerYOffset),
        ],
        false
    );
}

function render(engine) {
    if (engine.render()) {
        return;
    }
    engine.iteration();
    requestAnimationFrame(() => render(engine));
}

async function main() {
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const engine = new GameEngine(
        canvas,
        ctx,
        new WorldSettings(gravity, bounceFactor, frictionFactor, playerAcceleration, playerJumpForce, outOfBoundRadius, hardHitPowerMultiplier),
        genWorld,
        cameraFOV
    );

    engine.world.players[1].movement.left = true;

    window.onkeydown = function (event) {
        if (event.repeat) return;
        switch (event.key.toLowerCase()) {
            case "a": {
                engine.world.players[0].movement.left = true;
                break;
            }
            case "d": {
                engine.world.players[0].movement.right = true;
                break;
            }
            case "w": {
                engine.world.players[0].movement.jump = true;
                break;
            }
            case "s": {
                engine.world.players[0].movement.harden = true;
                break;
            }
        }
    };

    window.onkeyup = function (event) {
        if (event.repeat) return;
        switch (event.key.toLowerCase()) {
            case "a": {
                engine.world.players[0].movement.left = false;
                break;
            }
            case "d": {
                engine.world.players[0].movement.right = false;
                break;
            }
            case "w": {
                engine.world.players[0].movement.jump = false;
                break;
            }
            case "s": {
                engine.world.players[0].movement.harden = false;
                break;
            }
        }
    };
    render(engine);
}

window.onload = main;
