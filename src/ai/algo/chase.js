class ChaseAI {
    constructor(id, players) {
        this.id = id;
        this.oppID = this.getOtherPlayer(players);
    }

    getOtherPlayer(players) {
        for (let i = 0; i < players.length; i++) {
            if (i == this.id) continue;
            return i;
        }
        return undefined;
    }

    iteration(world) {
        const player = world.players[this.id];
        const target = world.players[this.oppID];
        if (target === undefined) return;

        player.movement.jump = false;
        player.movement.harden = false;
        player.movement.left = false;
        player.movement.right = false;
        if (target.x < player.x) player.movement.left = true;
        else player.movement.right = true;
        if (target.y < player.y) player.movement.jump = true;
        if (target.distance(player) < target.radius + player.radius + 5) player.movement.harden = true;
    }
}

export { ChaseAI };
