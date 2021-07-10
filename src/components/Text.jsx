/**
 * @jsx c
 * @jsxFrag Fragment
 */

import { c } from 'declarativas';
import { Fragment } from './Fragment';

export const Text = ({ x, y, size, baseline, align }, text) => (
  <>
    <font value={`${size || 16}px 'Major Mono Display'`} />
    <textBaseline value={baseline || 'top' } />
    <textAlign value={align || 'left' } />
    <fillStyle value="white" />
    <fillText x={x} y={y} text={text} />
  </>
);
