import { d2r } from './math';

export const make = (newVec = {}) => ({
  x: newVec.x || 0,
  y: newVec.y || 0,
});

export const zero = make({ x: 0, y: 0 });

export const add = (a, b) => make({
  x: a.x + b.x,
  y: a.y + b.y,
});

export const scale = (a, mul) => make({
  x: a.x * mul,
  y: a.y * mul,
});

export const multiply = (a, b) => make({
  x: a.x * b.x,
  y: a.y * b.y,
});

export const wrap = (a, resolution) => {
  if (a.x > resolution.x) return wrap({ ...a, x: a.x - resolution.x }, resolution);
  if (a.x < 0) return wrap({ ...a, x: a.x + resolution.x }, resolution);

  if (a.y > resolution.y) return wrap({ ...a, y: a.y - resolution.y }, resolution);
  if (a.y < 0) return wrap({ ...a, y: a.y + resolution.y }, resolution);

  return a;
};

export const clamp = (a, plusMinus) => {
  return make({
    x: Math.min(plusMinus, Math.max(-plusMinus, a.x)),
    y: Math.min(plusMinus, Math.max(-plusMinus, a.y)),
  });
};

export const unit = a => {
  const d = dist(a);
  if (d === 0) return zero;
  return scale(a, 1 / d);
};

export const dist = (a, b = zero) => {
  const diff = make({
    x: b.x - a.x,
    y: b.y - a.y,
  });
  return Math.sqrt((diff.x * diff.x) + (diff.y * diff.y));
};

export const average = (a, b) => make({
  x: (a.x + b.x) / 2,
  y: (a.y + b.y) / 2,
});

export const flip = a => make({ x: a.y, y: a.x });

export const angle = (degrees) => make({
  x: Math.cos(d2r(degrees)),
  y: Math.sin(d2r(degrees)),
});
