/**
 * @jsx c
 */

import { c, components } from 'declarativas';
const { RevertableState } = components;

const pickClip = (width, height, resolution) => {
  const scale = Math.min(
    width / resolution.x,
    height / resolution.y,
  );
  const w = resolution.x * scale;
  const h = resolution.y * scale;
  return {
    x: (width - w) / 2,
    y: 200 + ((height - h) / 2),
    width: w,
    height: h,
  };
}

export const PlayArea = ({ canvas, resolution }, children) => {
  const rect = pickClip(canvas.width, canvas.height - 250, resolution);
  
  return (
    <RevertableState>
      <strokeStyle value="white" />
      <strokeRect {...rect} />
      <beginPath />
      <rect {...rect} />
      <clip />
      <translate x={rect.x} y={rect.y} />
      <scale x={rect.width / resolution.x} y={rect.height / resolution.y} />
      {children}
    </RevertableState>
  );
};
