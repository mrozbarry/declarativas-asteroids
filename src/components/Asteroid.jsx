/**
 * @jsx c
 */

import { c, components } from 'declarativas';
import * as geo from '../lib/geometry';

const { RevertableState } = components;

export const Asteroid = ({ geometry }) => (
  <RevertableState>
    <strokeStyle value="#ddd" />
    <stroke path={geo.toPath(geometry)} />
  </RevertableState>
);
