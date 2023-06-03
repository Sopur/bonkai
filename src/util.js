import { lerp } from "./math.js";

class WorldSettings {
    /**
     * World settings structure
     * @param {number} gravity Gravity
     * @param {number} bounceFactor How bouncy collisions are
     * @param {number} frictionFactor The amount of friction in collisions
     * @param {number} playerAcceleration How fast players accelerate
     * @param {number} playerJumpForce The force applied when jumping
     * @param {number} outOfBoundRadius How far you can go before going out of bounds
     * @param {number} hardHitPower The power of hard hits by players
     */
    constructor(gravity, bounceFactor, frictionFactor, playerAcceleration, playerJumpForce, outOfBoundRadius, hardHitPower) {
        this.gravity = gravity;
        this.bounceFactor = bounceFactor;
        this.frictionFactor = frictionFactor;
        this.playerAcceleration = playerAcceleration;
        this.playerJumpForce = playerJumpForce;
        this.outOfBoundRadius = outOfBoundRadius;
        this.hardHitPower = hardHitPower;
    }
}

class Movement {
    /**
     * Movement structure
     * @param {boolean} left left
     * @param {boolean} right right
     * @param {boolean} jump jump
     * @param {boolean} harden harden
     */
    constructor(left = false, right = false, jump = false, harden = false) {
        this.left = left;
        this.right = right;
        this.jump = jump;
        this.harden = harden;
    }
    copy() {
        return new Movement(this.left, this.right, this.jump, this.harden);
    }
}

class Vector2d {
    /**
     * Vector in 2d space
     * @param {number} x X
     * @param {number} y Y
     */
    constructor(x = 0, y = x) {
        this.x = x;
        this.y = y;
    }

    copy() {
        return new Vector2d(this.x, this.y);
    }

    add(vec) {
        return new Vector2d(this.x + vec.x, this.y + vec.y);
    }

    addEq(vec) {
        this.x += vec.x;
        this.y += vec.y;
    }

    sub(vec) {
        return new Vector2d(this.x - vec.x, this.y - vec.y);
    }

    subEq(vec) {
        this.x -= vec.x;
        this.y -= vec.y;
    }

    mul(vec) {
        return new Vector2d(this.x * vec.x, this.y * vec.y);
    }

    mulEq(vec) {
        this.x *= vec.x;
        this.y *= vec.y;
    }

    div(vec) {
        return new Vector2d(this.x / vec.x, this.y / vec.y);
    }

    divEq(vec) {
        this.x /= vec.x;
        this.y /= vec.y;
    }

    angleTo(vec) {
        return Math.atan2(vec.y - this.y, vec.x - this.x);
    }

    /**
     *
     * @param {Vector2d} origin Origin viewpoint
     * @param {number} scale Basically FOV
     * @param {Rectangle} screen Size of the screen
     * @returns {Vector2d} Vector relative to the screen
     */
    projectFromGame(origin, scale, screen) {
        return new Vector2d((this.x - origin.x) * scale + screen.width / 2, (this.y - origin.y) * scale + screen.height / 2);
    }

    lerpTo(to, x) {
        this.x = lerp(this.x, to.x, x);
        this.y = lerp(this.y, to.y, x);
    }

    distance(vec) {
        const x = this.x - vec.x;
        const y = this.y - vec.y;
        return Math.sqrt(x * x + y * y);
    }
}

class Bound2d extends Vector2d {
    /**
     * 2d bound
     * @param {number} width width
     * @param {number} height height
     */
    constructor(x = 0, y = 0, width = 0, height = 0) {
        super(x, y);
        this.width = width;
        this.height = height;
    }
}

class Box2d {
    /**
     * Box/square geometry
     * @param {Vector2d} topLeft Point on the square
     * @param {Vector2d} topRight Point on the square
     * @param {Vector2d} bottomLeft Point on the square
     * @param {Vector2d} bottomRight Point on the square
     */
    constructor(topLeft, topRight, bottomLeft, bottomRight) {
        this.topLeft = topLeft;
        this.topRight = topRight;
        this.bottomLeft = bottomLeft;
        this.bottomRight = bottomRight;
    }
}

class Circle extends Vector2d {
    /**
     * Circle in 2d space
     * @param {number} radius Radius
     * @param {number} x X
     * @param {number} y Y
     */
    constructor(radius, x, y) {
        super(x, y);
        this.radius = radius;
    }

    align() {
        return new Rectangle(this.radius * 2, this.radius * 2, this.x - this.radius, this.y - this.radius);
    }
}

class Rectangle extends Vector2d {
    /**
     * Rectangle
     * @param {number} width Width
     * @param {number} height Height
     * @param {number} x X
     * @param {number} y Y
     */
    constructor(width, height, x, y) {
        super(x, y);
        this.width = width;
        this.height = height;
    }
}

class Entity extends Circle {
    /**
     * Entity or player
     * @param {string} color Color of entity
     * @param {number} radius Radius
     * @param {number} x X
     * @param {number} y Y
     */
    constructor(
        color,
        mass,
        radius,
        x,
        y,
        movement = new Movement(),
        velocity = new Vector2d(0),
        acceleration = new Vector2d(0),
        canJump = false,
        hasCollided = false,
        isDead = false
    ) {
        super(radius, x, y);
        this.color = color;
        this.mass = mass;
        this.movement = movement;
        this.velocity = velocity;
        this.acceleration = acceleration;
        this.canJump = canJump;
        this.hasCollided = hasCollided;
        this.isDead = isDead;
    }

    copy() {
        return new Entity(
            this.color,
            this.mass,
            this.radius,
            this.x,
            this.y,
            this.movement.copy(),
            this.velocity.copy(),
            this.acceleration.copy(),
            this.canJump,
            this.hasCollided,
            this.isDead
        );
    }

    updatePosition(force, dt) {
        // Update velocity based on force and time
        this.velocity.x += force.x * dt;
        this.velocity.y += force.y * dt;

        // Update position based on velocity and time
        this.x += this.velocity.x * dt;
        this.y += this.velocity.y * dt;
    }
}

class Platform extends Rectangle {
    /**
     * Platform in game
     * @param {string} color Color of platform
     * @param {number} width Width of platform
     * @param {number} height Height of platform
     * @param {number} x X
     * @param {number} y Y
     */
    constructor(color, width, height, x, y) {
        super(width, height, x, y);
        this.color = color;
    }

    align() {
        return new Rectangle(this.width, this.height, -this.width / 2 + this.x, -this.height / 2 + this.y);
    }
}

export { WorldSettings, Vector2d, Bound2d, Box2d, Circle, Rectangle, Entity, Platform };
