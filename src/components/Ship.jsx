/**
 * @jsx c
 * @jsxFrag Fragment
 */

import { c, components } from 'declarativas';
import { Fragment } from './Fragment';
import { CloseLinePath } from './CloseLinePath.jsx'

const { Rect } = components;

export const Ship = ({ thrust, geometry }) => (
  <>
    <CloseLinePath
      points={geometry}
      style="white"
    />
    {thrust && (
      <>
        <Rect x={-20} y={-2} width={10} height={4} fill="rgba(255, 255, 255, 0.4)" />
        <Rect x={-18} y={-4} width={6} height={8} fill="rgba(255, 0, 0, 0.2)" />
        <Rect x={-14} y={-8} width={4} height={16} fill="rgba(100, 100, 255, 0.5)" />

      </>
    )}
  </>
);
