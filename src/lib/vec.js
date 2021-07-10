export const make = (newVec = {}) => ({
  x: newVec.x || 0,
  y: newVec.y || 0,
});

export const zero = make({ x: 0, y: 0 });

export const add = (a, b) => ({
  x: a.x + b.x,
  y: a.y + b.y,
});

export const scale = (a, mul) => ({
  x: a.x * mul,
  y: a.y * mul,
});

export const wrap = (a, maxX, maxY) => {
  if (a.x > maxX) return wrap({ ...a, x: a.x - maxX });
  if (a.x < 0) return wrap({ ...a, x: a.x + maxX });

  if (a.y > maxY) return wrap({ ...a, y: a.y - maxY });
  if (a.y < 0) return wrap({ ...a, y: a.y + maxY });

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
