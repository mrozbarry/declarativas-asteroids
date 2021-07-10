const PI_OVER_180 = Math.PI / 180;

export const d2r = d => d * PI_OVER_180;

/* Line intersection adapted from https://stackoverflow.com/a/16725715 */
const turn = (p1, p2, p3) => {
  const A = (p3.y - p1.y) * (p2.x - p1.x);
  const B = (p2.y - p1.y) * (p3.x - p1.x);
  return (A > B + Number.EPSILON) ? 1 : ((A + Number.EPSILON < B) ? -1 : 0);
}

export const areLinesIntersecting = ([a, b], [c, d]) => {
  return (turn(a, c, d) != turn(b, c, d)) && (turn(a, b, c) != turn(a, b, d));
}
