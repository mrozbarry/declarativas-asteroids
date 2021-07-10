/**
 * @jsx c
 */

import { c, components } from 'declarativas';
const { RevertableState } = components;

const clipRect = (fullWidth, width, height, vWidth, vHeight) => {
  const aspectRatio = vHeight / vWidth;
  const w = width;
  const h = width * aspectRatio;
  const x = (fullWidth - w) / 2;
  const y = (height - h) / 2;
  return { x, y, width: w, height: h };
};

const pickClip = (width, height) => {
  const h = height - 200;
  for(let w = width; w > 250; w -= 10) {
    const rect = clipRect(width, w, height, 800, 600);
    if (rect.width <= width && rect.height <= h) return rect;
  }
  return clipRect(width, 250, height, 800, 600);
}

export const PlayArea = ({ width, height }, children) => {
  const rect = pickClip(width, height);
  
  return (
    <RevertableState>
      <strokeStyle value="white" />
      <strokeRect {...rect} />
      <beginPath />
      <rect {...rect} />
      <clip />
      <translate x={rect.x} y={rect.y} />
      <scale x={rect.width / 800} y={rect.height / 600} />
      {children}
    </RevertableState>
  );
};
