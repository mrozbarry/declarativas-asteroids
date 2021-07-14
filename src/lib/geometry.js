import * as vec from './vec';
import { memoize } from './memoize';
import { d2r, areLinesIntersecting } from './math';

export const toPath = (geometry) => {
  const p = new Path2D();
  if (geometry.length === 0) return p;
  const [start, ...points] = geometry;
  p.moveTo(start.x, start.y);
  points.forEach(({ x, y}) => p.lineTo(x, y));
  p.closePath();
  return p;
};

export const denormalize = memoize((object) => {
  return object.geometry.map(p => {
    const magnitude = vec.dist(p, vec.make());
    const initialRadians = Math.atan2(p.x, p.y);
    const radians = initialRadians + d2r(object.angle);

    return vec.add(object.p, vec.make({
      x: Math.cos(radians) * magnitude,
      y: Math.sin(radians) * magnitude,
    }));
  });
});

export const allInsideBounds = (geometry, res) => {
  return geometry.every(p => {
    const inXBounds = p.x >= 0 && p.x <= res.x;
    const inYBounds = p.y >= 0 && p.y <= res.y;
    return inXBounds && inYBounds;
  });
}

export const geometryToLineSegments = (geometry) => {
  return geometry.map((p, i) => [
    p,
    geometry[(i + 1) % geometry.length],
  ]);
};

export const hasObjectCollision = (a, b) => {
  const dist = vec.dist(a.p, b.p);
  if (dist > 100) return false;

  const aLines = geometryToLineSegments(denormalize(a));
  const bLines = geometryToLineSegments(denormalize(b));

  for (aLine of aLines) {
    for (bLine of bLines) {
      if (areLinesIntersecting(aLine, bLine)) {
        return true;
      }
    }
  }

  return false;
};
