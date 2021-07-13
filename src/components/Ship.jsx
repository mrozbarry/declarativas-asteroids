/**
 * @jsx c
 * @jsxFrag Fragment
 */

import { c } from 'declarativas';
import { Fragment } from './Fragment';
import { CloseLinePath } from './CloseLinePath.jsx'

export const Ship = ({ geometry }) => (
  <>
    <CloseLinePath
      points={geometry}
      style="white"
    />
  </>
);
