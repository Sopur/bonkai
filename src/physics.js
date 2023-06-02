import { clamp } from "./math.js";
import { Entity, Platform, Vector2d, WorldSettings } from "./util.js";

class World {
    /**
     * World structure
     * @param {Platform} platform
     * @param {Array<Entity>} players
     */
    constructor(platform, players) {
        this.platform = platform;
        this.players = players;
    }

    /**
     * Copies the world
     * @returns {World} Copy
     */
    copy() {
        let output = new World(this.platform, []);
        for (const player of this.players) {
            output.players.push(player.copy());
        }
        return output;
    }
}

class CollisionResponse {
    /**
     * Collision response strucut
     * @param {boolean} isIntersecting Is a valid collision
     * @param {Vector2d} intersection Point of intersection
     * @param {Vector2d} distance Distance
     * @param {number} distanceBetween Distance squared
     * @param {boolean} isTopside Did collide with the topside of the rectangle
     */
    constructor(isIntersecting, intersection, distance, distanceBetween, isTopside) {
        this.isIntersecting = isIntersecting;
        this.intersection = intersection;
        this.distance = distance;
        this.distanceBetween = distanceBetween;
        this.isTopside = isTopside;
    }
}

class PhysicsEngine {
    /**
     * Physics engine
     * @param {WorldSettings} settings Settings
     */
    constructor(settings) {
        this.settings = settings;
        this.collisionIterator = 1;
    }

    rectCircleCollision(unalignedRect, circle) {
        const rect = unalignedRect.align();

        // Calculate the closest edge points on the rectangle to the circle's center
        const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
        const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));

        // Calculate the distance between the circle's center and the closest edge points
        const deltaX = circle.x - closestX;
        const deltaY = circle.y - closestY;

        // Compare the distance with the circle's radius
        const distanceSquared = deltaX * deltaX + deltaY * deltaY;
        const isIntersecting = distanceSquared <= circle.radius * circle.radius;

        // If intersecting, return object with flag, and closest points
        if (isIntersecting) {
            return new CollisionResponse(
                true,
                new Vector2d(closestX, closestY),
                new Vector2d(deltaX, deltaY),
                Math.sqrt(distanceSquared),
                closestY === rect.y
            );
        }

        // If not intersecting, simply return the flag
        return new CollisionResponse(false);
    }

    rectCircleSolve(circle, collision, restitution, friction) {
        const overlap = circle.radius - collision.distanceBetween;

        // Normalize the distance vector and multiply by the overlap
        const directionX = collision.distance.x / collision.distanceBetween;
        const directionY = collision.distance.y / collision.distanceBetween;
        const correctionX = directionX * overlap;
        const correctionY = directionY * overlap;

        // Apply the correction to the circle's position to resolve the collision
        circle.x += correctionX;
        circle.y += correctionY;

        // Update the circle's velocity based on the collision surface normal
        const dotProduct = circle.velocity.x * directionX + circle.velocity.y * directionY;
        const impulseX = (1 + restitution) * dotProduct * directionX;
        const impulseY = (1 + restitution) * dotProduct * directionY;
        circle.velocity.x -= impulseX;
        circle.velocity.y -= impulseY;

        // Apply friction
        const frictionX = friction * (circle.velocity.x - impulseX);
        const frictionY = friction * (circle.velocity.y - impulseY);
        circle.velocity.x -= frictionX;
        circle.velocity.y -= frictionY;
    }

    circleCircleCollision(circle1, circle2) {
        const deltaX = circle2.x - circle1.x;
        const deltaY = circle2.y - circle1.y;
        const distanceSquared = deltaX * deltaX + deltaY * deltaY;
        const distance = Math.sqrt(distanceSquared);
        const radiusSum = circle1.radius + circle2.radius;
        const ratio = (distance + circle1.radius - circle2.radius) / (2 * distance);

        // Check if the distance is less than the sum of the radii squared
        if (distanceSquared <= radiusSum * radiusSum) {
            return new CollisionResponse(
                true,
                new Vector2d(circle1.x + ratio * deltaX, circle1.y + ratio * deltaY),
                new Vector2d(deltaX, deltaY),
                distance,
                false
            );
        }
        return new CollisionResponse(false);
    }

    circleCircleSolve(circle1, circle2, collision, restitution, friction) {
        const overlap = circle1.radius + circle2.radius - collision.distanceBetween;

        // Normalize the distance vector and scale it by the overlap
        const directionX = collision.distance.x / collision.distanceBetween;
        const directionY = collision.distance.y / collision.distanceBetween;
        const correctionX = directionX * overlap * 0.5;
        const correctionY = directionY * overlap * 0.5;

        // Update the circles' positions
        circle1.x -= correctionX;
        circle1.y -= correctionY;
        circle2.x += correctionX;
        circle2.y += correctionY;

        // Calculate relative velocity
        const rvX = circle2.velocity.x - circle1.velocity.x;
        const rvY = circle2.velocity.y - circle1.velocity.y;
        const dotProduct = rvX * directionX + rvY * directionY;

        // Apply restitution if the circles are moving towards each other
        const impulse = (1 + restitution) * dotProduct;
        const impulseX = directionX * impulse;
        const impulseY = directionY * impulse;

        circle1.velocity.x += impulseX * friction;
        circle1.velocity.y += impulseY * friction;
        circle2.velocity.x -= impulseX * friction;
        circle2.velocity.y -= impulseY * friction;
    }

    /**
     * Return new world with physics applied
     * @param {World} world World to operate on
     */
    preformIteration(output) {
        for (let i = 0; i < output.players.length; i++) {
            const player = output.players[i];
            player.hasCollided = false;
            let force = new Vector2d(0, this.settings.gravity);

            for (let j = 0; j < output.players.length; j++) {
                if (i === j) continue;
                const playerB = output.players[j];

                const circleCollision = this.circleCircleCollision(player, playerB);
                if (circleCollision.isIntersecting) {
                    this.circleCircleSolve(
                        player,
                        playerB,
                        circleCollision,
                        this.settings.bounceFactor * (this.settings.hardHitPower * player.movement.harden),
                        this.settings.frictionFactor
                    );
                    player.hasCollided = true;
                    player.canJump ||= circleCollision.isTopside;
                }
            }

            if (!player.movement.harden) {
                if (player.movement.left) {
                    force.x -= this.settings.playerAcceleration;
                }
                if (player.movement.right) {
                    force.x += this.settings.playerAcceleration;
                }
                if (player.canJump && player.movement.jump) {
                    force.y -= this.settings.playerJumpForce;
                }
            }
            player.canJump = false;

            // a = f / m
            let acceleration = force.div(new Vector2d(player.mass));

            // v = v + a
            player.velocity.addEq(acceleration);

            // p = p + v
            player.addEq(player.velocity);

            const platformCollision = this.rectCircleCollision(output.platform, player);
            if (platformCollision.isIntersecting) {
                this.rectCircleSolve(player, platformCollision, 0.01, 0.01);
                player.canJump ||= platformCollision.isTopside;
            }
        }
    }

    preformIterations(world, amount) {
        const output = world.copy();
        for (let i = 0; i < amount; i++) {
            this.preformIteration(output);
        }
        return output;
    }
}

export { World, PhysicsEngine };