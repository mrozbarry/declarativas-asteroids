/**
 * @jsx c
 * @jsxFrag Fragment
 */

import { c } from 'declarativas';
import { Fragment } from './Fragment';
import { Text } from './Text.jsx';
import { Transform } from './Transform.jsx';
import { Ship } from './Ship.jsx';

import { d2r } from '../lib/math';

export const Scoreboard = ({ points, lives, level, width, ship }) => {
  const levelFontSize = (42 / 1024) * width;
  const scoreFontSize = (32 / 1024) * width;
  return (
    <>
      <Text x={10} y={10} size={scoreFontSize}>
        {`${points}`.padStart(10, '0')}
      </Text>
      <Text x={width / 2} y={10} size={levelFontSize} align="center">
        {`level ${level.toString().padStart(2, '0')}`}
      </Text>
      {Array.from({ length: lives}, (_, index) => (
        <Transform
          ops={[
            <translate x={20 + (index * 30)} y={65} />,
            <rotate value={d2r(-90)} />
          ]}
        >
          <Ship {...ship} thrust={false} />
        </Transform>
      ))}
    </>
  );
};
