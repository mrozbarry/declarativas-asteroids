/**
 * @jsx c
 * @jsxFrag Fragment
 */

import { c } from 'declarativas';
import { Fragment } from './Fragment';

export const Text = ({ x, y, size, baseline, align, family, fill }, text) => (
  <>
    <font value={`${size || 16}px ${family || "'Major Mono Display'"}`} />
    <textBaseline value={baseline || 'top' } />
    <textAlign value={align || 'left'} />
    <fillStyle value={fill || 'white'} />
    <fillText x={x} y={y} text={text} />
  </>
);
