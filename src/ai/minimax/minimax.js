import { PhysicsEngine } from "../../physics.js";
import { Vector2d } from "../../util.js";

class MiniMaxAI {
    constructor(settings, id, players) {
        this.id = id;
        this.oppID = this.getOtherPlayer(players);
        this.settings = settings;
        this.engine = new PhysicsEngine(settings);
        this.iterationsPerNode = 25;
    }

    getOtherPlayer(players) {
        for (let i = 0; i < players.length; i++) {
            if (i == this.id) continue;
            return i;
        }
        return undefined;
    }

    staticEval(world) {
        const player = world.players[this.id];
        const opp = world.players[this.oppID];

        // Check for deaths
        if (player.distance(new Vector2d(0)) > this.settings.outOfBoundRadius) {
            return -Infinity;
        } else if (opp.distance(new Vector2d(0)) > this.settings.outOfBoundRadius) {
            return Infinity;
        }

        const bestPoint = new Vector2d(0, 0);
        const distExpo = 1.1;
        const distWeight = 0.005;
        let evaluation = 0;

        const playerDist = 1 / Math.max(Math.pow(player.distance(bestPoint), distExpo), 1);
        const oppDist = 1 / Math.max(Math.pow(opp.distance(bestPoint), distExpo), 1);
        evaluation += distWeight / oppDist - distWeight / playerDist;
        return evaluation;
    }

    genChild(world, player, flag) {
        player.movement.jump = false;
        player.movement.harden = false;
        player.movement.left = false;
        player.movement.right = false;
        player.movement[flag] = true;
        return this.engine.preformIterations(world, this.iterationsPerNode);
    }

    genChildren(world, id) {
        const player = world.players[id];
        let children = [
            { world: this.genChild(world, player, "left"), move: "left" },
            { world: this.genChild(world, player, "right"), move: "right" },
            { world: this.genChild(world, player, "harden"), move: "harden" },
        ];
        if (player.canJump) {
            children.push({ world: this.genChild(world, player, "jump"), move: "jump" });
        }
        return children;
    }

    minimax(world, depth, alpha, beta, isMaximizing) {
        if (depth === 0) {
            return { eval: this.staticEval(world) };
        }

        if (isMaximizing) {
            let bestMove = "";
            let maxEval = -Infinity;
            const positions = this.genChildren(world, this.id);
            for (const child of positions) {
                let evaluation = this.minimax(child.world, depth - 1, alpha, beta, false).eval;
                if (evaluation > maxEval) {
                    maxEval = evaluation;
                    bestMove = child.move;
                }
                alpha = Math.max(alpha, evaluation);
                if (beta <= alpha) break;
            }
            return { eval: maxEval, bestMove };
        } else {
            let bestMove = "";
            let minEval = Infinity;
            const positions = this.genChildren(world, this.oppID);
            for (const child of positions) {
                let evaluation = this.minimax(child.world, depth - 1, alpha, beta, true).eval;
                if (evaluation < minEval) {
                    minEval = evaluation;
                    bestMove = child.move;
                }
                beta = Math.min(beta, evaluation);
                if (beta <= alpha) break;
            }
            return { eval: minEval, bestMove };
        }
    }

    iteration(world, depth) {
        const evaluation = this.minimax(world.copy(), depth, -Infinity, Infinity, true);
        const player = world.players[this.id];
        player.movement.jump = false;
        player.movement.harden = false;
        player.movement.left = false;
        player.movement.right = false;
        player.movement[evaluation.bestMove] = true;
        return Math.max(Math.min(evaluation.eval, 10), -10);
    }
}

export { MiniMaxAI };
