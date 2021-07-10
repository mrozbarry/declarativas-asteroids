/**
 * @jsx c
 * @jsxFrag Fragment
 */

import { c } from 'declarativas';
import { Fragment } from './Fragment';

export const CloseLinePath = ({ points, style }) => {
  const [first, ...rest] = points;
  return (
    <>
      <beginPath />
      <strokeStyle value={style} />
      <lineWidth value={2} />
      <moveTo {...first} />
      {rest.map(p => <lineTo {...p} />)}
      <closePath />
      <stroke />
    </>
  );
};
