/**
 * @jsx c
 * @jsxFrag Fragment
 */

import { c, components } from 'declarativas';
import { Fragment } from '../components/Fragment.js';
import { Text } from '../components/Text.jsx';

const { Rect } = components;

export const Loading = ({ state, context2d }) => {
  const { width, height } = context2d.canvas;

  const barSize = 32;
  const halfBarSize = barSize / 2;

  const percent = state.loading.filter(l => l.done).length / state.loading.length;

  return (
    <>
      <Rect x={0} y={0} width={width} height={height} fill="black" />
      <Rect x={100} y={(height / 2) - halfBarSize} width={(width - 200) * percent} height={barSize} fill="#ddd" />
      <Rect x={100} y={(height / 2) - halfBarSize} width={width - 200} height={barSize} stroke="white" />
      <Text x={100} y={(height / 2) + barSize} family="monospace" size={12}>loading...</Text>
    </>
  );
};
