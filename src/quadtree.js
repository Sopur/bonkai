import { Bound2d, Vector2d, Box2d } from "./util.js";

let splits = [];

class Node {
    constructor(id, square) {
        this.id = id;
        this.square = square;
    }
}

class Child {
    constructor(x, y, width, height, childIndex, maxHold) {
        this.width = width;
        this.height = height;
        this.x = x;
        this.y = y;
        this.childIndex = childIndex;
        this.maxHold = maxHold + 1;
        this.hasSplit = false;
        this.children = [new Array(2), new Array(2)];
        this.hold = [];
        this.half = new Vector2d(width / 2, height / 2);
        this.mid = new Vector2d(x + this.half.x, y + this.half.y);
        splits.push(new Bound2d(x, y, width, height));
    }

    findSector(node) {
        return this.children[Number(node.x > this.mid.x)][Number(node.y > this.mid.y)];
    }

    split() {
        this.hasSplit = true;

        this.children[0][0] = new Child(this.x, this.y, this.half.x, this.half.y, 0b00, this.maxHold);
        this.children[1][0] = new Child(this.mid.x, this.y, this.half.x, this.half.y, 0b10, this.maxHold);
        this.children[0][1] = new Child(this.x, this.mid.y, this.half.x, this.half.y, 0b01, this.maxHold);
        this.children[1][1] = new Child(this.mid.x, this.mid.y, this.half.x, this.half.y, 0b11, this.maxHold);

        for (const data of this.hold) {
            let matrix = new Array(4).fill(0);
            this.add(data.id, data.square, matrix);
        }
    }

    reset() {
        this.children = [new Array(2), new Array(2)];
        this.hold = [];
        this.hasSplit = false;
    }

    add(id, square, matrix) {
        if (matrix[this.childIndex] === 1) return;
        matrix[this.childIndex] = 1;

        if (this.hasSplit) {
            let matrix = new Array(4).fill(0);
            this.findSector(square.topRight).add(id, square, matrix);
            this.findSector(square.topLeft).add(id, square, matrix);
            this.findSector(square.bottomRight).add(id, square, matrix);
            this.findSector(square.bottomLeft).add(id, square, matrix);
            return;
        }

        this.hold.push(new Node(id, square));

        if (this.hold.length > this.maxHold) {
            return this.split();
        }
    }

    get(capture, square, matrix) {
        if (matrix[this.childIndex] === 1) return;
        matrix[this.childIndex] = 1;

        if (this.hasSplit) {
            let matrix = new Array(4).fill(0);
            this.findSector(square.topRight).get(capture, square, matrix);
            this.findSector(square.topLeft).get(capture, square, matrix);
            this.findSector(square.bottomRight).get(capture, square, matrix);
            this.findSector(square.bottomLeft).get(capture, square, matrix);
        } else {
            for (const value of this.hold) {
                capture.add(value.id);
            }
        }
    }

    getAll(capture) {
        if (this.hasSplit) {
            this.children[0][0].getAll(capture);
            this.children[1][0].getAll(capture);
            this.children[0][1].getAll(capture);
            this.children[1][1].getAll(capture);
        } else {
            for (const value of this.hold) {
                capture.add(value.id);
            }
        }
    }
}

class QuadTree {
    constructor(width, height, startMaxHold = 9) {
        this.width = width;
        this.height = height;
        this.startMaxHold = startMaxHold;
        this.reset();
    }

    reset(width = this.width, height = this.height) {
        this.width = width;
        this.height = height;
        this.child = new Child(0, 0, this.width, this.height, 0b00, this.startMaxHold);
        splits = [];
    }

    create(id, x, y, width, height) {
        let matrix = new Array(4).fill(0);
        return this.child.add(
            id,
            new Box2d(new Vector2d(x, y), new Vector2d(x + width, y), new Vector2d(x, y + height), new Vector2d(x + width, y + height)),
            matrix
        );
    }

    get(x, y, width, height) {
        let matrix = new Array(4).fill(0);
        let container = new Set();
        this.child.get(
            container,
            new Box2d(new Vector2d(x, y), new Vector2d(x + width, y), new Vector2d(x, y + height), new Vector2d(x + width, y + height)),
            matrix
        );
        return container;
    }

    getAll() {
        let container = new Set();
        this.child.getAll(container);
        return container;
    }

    allSplits() {
        return splits;
    }
}

export { QuadTree };
