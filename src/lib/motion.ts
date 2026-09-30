export function lerp(a: number, b: number, t: number) { return a + (b - a) * t }
export function ease(t: number) { return t < 0.5 ? 2*t*t : -1+(4-2*t)*t }
