/**
 * @jsx c
 * @jsxFrag Fragment
 */

import { c, components } from 'declarativas';
const { RevertableState, Rect } = components;

import { Text } from './components/Text.jsx';
import { Ship } from './components/Ship.jsx';
import { Asteroid } from './components/Asteroid.jsx';
import { Scoreboard } from './components/Scoreboard.jsx';
import { PlayArea } from './components/PlayArea.jsx';

import { build } from './state.js';

import * as actions from './actions.js';

import { d2r } from './lib/math.js';

const Fragment = (_props, children) => [children];

const canvas = document.querySelector('canvas');

const debounce = (fn, ms = 250) => {
  let timeoutHandle = null;
  
  return (...args) => {
    clearTimeout(timeoutHandle);
    timeoutHandle = setTimeout(fn, ms, ...args);
  }
}

const app = build({
  init: [
    {
      asteroids: [],
      ship: {
        geometry: [
          { x: 10, y: 0 },
          { x: -10, y: 8 },
          { x: -10, y: -8 },
        ],

        thrust: false,
        left: false,
        right: false,
        fire: false,
        slow: false,

        p: { x: 400, y: 300 },
        v: { x: 0, y: 0 },

        angle: -90,
        nextShot: 0,
      },

      shots: [],
      points: 0,
      lives: 3,
      level: 0,
      time: 0,
      nextLevelTimeout: null,
      playerRespawnTimeout: null,
    },
    (self) => self.update(actions.afterResize),
    (self) => self.update(actions.nextLevel),
  ],
  
  onBeforeTick: (self) => {
    self.update(actions.advance);
    self.update(actions.completeLevel(self));
  },
  
  view: (state, context2d) => {
    const { width, height } = context2d.canvas;

    const opacity = state.ship.slow
      ? 0.1
      : 1;
    
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
          <PlayArea width={width} height={height}>
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
                <fillStyle value="white" />
                <fillRect x={-2} y={-2} width={4} height={4} />
              </RevertableState>
            ))}
            {state.asteroids.map((asteroid) => (
              <RevertableState>
                <translate x={asteroid.p.x} y={asteroid.p.y} />
                <rotate value={d2r(asteroid.angle)} />
                <strokeStyle value="white" />
                <Asteroid {...asteroid} />
              </RevertableState>
            ))}
            {state.nextLevelTimeout && (
              <RevertableState>
                <Text x={400 + 2 - (Math.random() * 4)} y={300 + 2 - (Math.random() * 4)} size={60} baseline="middle" align="center">ready next level</Text>
              </RevertableState>
            )}
            {state.playerRespawnTimeout && (
              <RevertableState>
                <Text x={400 + 2 - (Math.random() * 4)} y={300 + 2 - (Math.random() * 4)} size={60} baseline="middle" align="center">wrecked</Text>
              </RevertableState>
            )}
          </PlayArea>
        </RevertableState>
      </>
    );
  },
  
  context2d: canvas.getContext('2d'),
})

window.addEventListener('resize', debounce(() => app.update(actions.afterResize)));

const KeyMap = {
  'ArrowUp': 'thrust',
  'ArrowLeft': 'left',
  'ArrowRight': 'right',
  'ArrowDown': 'fire',
  'x': 'fire',
  'z': 'slow',
}

window.addEventListener('keydown', (e) => {
  if (e.repeat) return;
  const mapping = KeyMap[e.key];
  if (!mapping) return;
  app.update(actions.onPress(mapping))
});

window.addEventListener('keyup', (e) => {
  const mapping = KeyMap[e.key];
  if (!mapping) return;
  app.update(actions.onRelease(mapping));
});

window.addEventListener('blur', (e) => {
  Object.values(KeyMap).forEach(v => app.update(actions.onRelease(v)));
});

