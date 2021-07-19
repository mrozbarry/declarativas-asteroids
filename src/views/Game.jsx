/**
 * @jsx c
 * @jsxFrag Fragment
 */

import { c, components } from 'declarativas';
const { RevertableState, Rect } = components;

import { Menu } from './Menu.jsx';

import { Text } from '../components/Text.jsx';
import { Ship } from '../components/Ship.jsx';
import { Asteroid } from '../components/Asteroid.jsx';
import { Scoreboard } from '../components/Scoreboard.jsx';
import { PlayArea } from '../components/PlayArea.jsx';
import { Message } from '../components/Message.jsx';

import * as actions from '../actions.js';

import { d2r } from '../lib/math.js';
import * as vec from '../lib/vec.js';
import * as geometry from '../lib/geometry.js';

const Fragment = (_props, children) => [children];

export const Game = ({ state, context2d }) => {
  const { width, height } = context2d.canvas;

  const opacity = state.ship.slow
    ? 0.1
    : 1;

  const asteroidDoubles = state.asteroids
    .map(a => ({ ...a, denormGeo: geometry.denormalize(a) }))
    .filter(a => !geometry.allInsideBounds(a.geometry, state.resolution))
    .reduce((doubles, asteroid) => {
      return [
        ...doubles,
        { ...asteroid, p: vec.add(asteroid.p, vec.make({ x: -state.resolution.x, y: 0 })) },
        { ...asteroid, p: vec.add(asteroid.p, vec.make({ x: state.resolution.x, y: 0 })) },
        { ...asteroid, p: vec.add(asteroid.p, vec.make({ x: 0, y: -state.resolution.y })) },
        { ...asteroid, p: vec.add(asteroid.p, vec.make({ x: 0, y: state.resolution.y })) },
      ];
    }, []);

  return (
    <>
      <Rect x={0} y={0} width={width} height={height} fill={`rgba(0, 0, 0, ${opacity})`} />
      <RevertableState>
        <Scoreboard
          points={state.points}
          lives={state.lives}
          level={state.level}
          width={width}
          ship={state.ship}
        />
        <PlayArea canvas={context2d.canvas} resolution={state.resolution} width={width} height={height}>
          {!state.playerRespawnTimeout && (
            <RevertableState>
              <translate x={state.ship.p.x} y={state.ship.p.y} />
              <rotate value={d2r(state.ship.angle)} />
              <Ship {...state.ship} />
            </RevertableState>
          )}
          {state.shots.map((shot) => (
            <RevertableState>
              <translate x={shot.p.x} y={shot.p.y} />
              <rotate value={d2r(shot.angle)} />
              <fillStyle value="rgb(70, 150, 70)" />
              <fillRect x={-2} y={-2} width={4} height={4} />
            </RevertableState>
          ))}
          {state.asteroids.concat(asteroidDoubles).map((asteroid) => (
            <RevertableState>
              <translate x={asteroid.p.x} y={asteroid.p.y} />
              <rotate value={d2r(asteroid.angle)} />
              <strokeStyle value="white" />
              <Asteroid {...asteroid} canCollide={state.nextLevelTimeout === null} />
            </RevertableState>
          ))}
          {state.particles.map((particle) => (
            <RevertableState>
              <translate x={particle.p.x} y={particle.p.y} />
              <fillStyle value={`rgba(${particle.rgb.r}, ${particle.rgb.g}, ${particle.rgb.b}, ${particle.ttl / particle.maxTtl})`} />
              <fillRect x={-1} y={-1} width={2} height={2} />
            </RevertableState>
          ))}
          {!state.playerRespawnTimeout && state.nextLevelTimeout && state.level > 1 && (
            <Message jitter={4} resolution={state.resolution}>ready next level</Message>
          )}
          {state.playerRespawnTimeout && (
            <Message jitter={4} resolution={state.resolution}>{state.lives > 0 ? 'wrecked' : 'game over'}</Message>
          )}
        </PlayArea>
      </RevertableState>
      {state.isPaused && (
        <Menu
          state={state}
          context2d={context2d}
          overlay={true}
          prependItems={[
            { label: 'resume', onselect: actions.togglePause },
          ]}
        />
      )}
    </>
  );
};
