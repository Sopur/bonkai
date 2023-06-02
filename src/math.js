function lerp(a, b, x) {
    return a + x * (b - a);
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

export { lerp, clamp };
