/**
 * @jsx c
 */

import { c } from 'declarativas';

import { Loading } from './views/Loading.jsx';
import { Menu } from './views/Menu.jsx';
import { Game } from './views/Game.jsx';

import { build } from './state.js';

import * as actions from './actions.js';

const canvas = document.querySelector('canvas');

const debounce = (fn, ms = 250) => {
  let timeoutHandle = null;
  
  return (...args) => {
    clearTimeout(timeoutHandle);
    timeoutHandle = setTimeout(fn, ms, ...args);
  }
};

const views = {
  loading: (state, context2d) => <Loading state={state} context2d={context2d} />,
  menu: (state, context2d) => <Menu state={state} context2d={context2d} overlay={false} />,
  game: (state, context2d) => <Game state={state} context2d={context2d} />,
};

const app = build({
  init: [
    actions.init(800, 600),
    actions.waitForFont("'Major Mono Display'"),
    actions.afterResize(canvas.getContext('2d')),
  ],
  
  onBeforeTick: (state, delta, context2d, dispatch) => {
    if (state.view !== 'game') return;

    dispatch(actions.advance(delta, context2d));
    dispatch(actions.completeLevel);
  },
  
  view: (state, context2d) => views[state.view](state, context2d),
  
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

  if (e.key === 'ArrowUp') app.update(actions.changeMenuItem(-1));
  if (e.key === 'ArrowDown') app.update(actions.changeMenuItem(1));
  if (e.key === 'Escape') app.update(actions.togglePause);
  if (e.key === 'Enter') app.update(actions.selectMenuItem);

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

