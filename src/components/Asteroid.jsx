/**
 * @jsx c
 */

import { c, components } from 'declarativas';
import * as geo from '../lib/geometry';

const { RevertableState } = components;

export const Asteroid = ({ geometry, canCollide }) => (
  <RevertableState>
    <strokeStyle value={canCollide ? '#ddd' : '#333'} />
    <stroke path={geo.toPath(geometry)} />
  </RevertableState>
);
