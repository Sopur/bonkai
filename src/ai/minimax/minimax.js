import { PhysicsEngine } from "../../physics.js";
import { Vector2d } from "../../util.js";

const bestPoint = new Vector2d(0, 0);

class MiniMaxAI {
    constructor(settings, id, players) {
        this.id = id;
        this.oppID = this.getOtherPlayer(players);
        this.settings = settings;
        this.engine = new PhysicsEngine(settings);
        this.iterationsPerNode = 20;
        this.nodeCount = 0;
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
        if (player.isDead) {
            return -Infinity;
        } else if (opp.isDead) {
            return Infinity;
        }

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

    getMoves(player, opp) {
        let moves = [];

        // Put the direction towards the opp first
        let opposite = "right";
        if (opp.x < player.x) {
            moves.push("left");
        } else {
            moves.push("right");
            opposite = "left";
        }

        if (player.canJump) {
            // If your opp is above you, it might be a better idea to jump than to harden
            if (opp.y < player.y) {
                moves.push("jump", "harden");
            } else {
                moves.push("harden", "jump");
            }
        } else {
            moves.push("harden");
        }

        // Almost never want to go to the other direction
        moves.push(opposite);

        return moves;
    }

    minimax(world, depth, alpha, beta, isMaximizing) {
        if (depth <= 0 || world.gameOver) {
            return { eval: this.staticEval(world) };
        }
        this.nodeCount++;

        if (isMaximizing) {
            let bestMove = "";
            let maxEval = -Infinity;
            const moves = this.getMoves(world.players[this.id], world.players[this.oppID]);
            for (let i = 0; i < moves.length; i++) {
                const move = moves[i];
                const moveWorld = this.genChild(world, world.players[this.id], move);
                let evaluation = this.minimax(moveWorld, depth - 1, alpha, beta, false).eval;
                if (evaluation > maxEval) {
                    maxEval = evaluation;
                    bestMove = move;
                }
                alpha = Math.max(alpha, evaluation);
                if (beta <= alpha) break;
            }
            return { eval: maxEval, bestMove };
        } else {
            let bestMove = "";
            let minEval = Infinity;
            const moves = this.getMoves(world.players[this.oppID], world.players[this.id]);
            for (let i = 0; i < moves.length; i++) {
                const move = moves[i];
                const moveWorld = this.genChild(world, world.players[this.oppID], move);
                let evaluation = this.minimax(moveWorld, depth - 1, alpha, beta, true).eval;
                if (evaluation < minEval) {
                    minEval = evaluation;
                    bestMove = move;
                }
                beta = Math.min(beta, evaluation);
                if (beta <= alpha) break;
            }
            return { eval: minEval, bestMove };
        }
    }

    iteration(world, depth) {
        this.nodeCount = 0;
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
