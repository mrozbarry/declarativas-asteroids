/**
 * @jsx c
 * @jsxFrag Fragment
 */

import { c, components } from 'declarativas';
const { RevertableState } = components;

export const Transform = ({ ops }, children) => (
  <RevertableState>
    {ops}
    {children}
  </RevertableState>
);
