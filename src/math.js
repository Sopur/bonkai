function lerp(a, b, x) {
    return a + x * (b - a);
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function randomNumber(min, max) {
    return Math.random() * (max - min) + min;
}

export { lerp, clamp, randomNumber };
