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
  </>
);
