/**
 * @jsx c
 * @jsxFrag Fragment
 */

import { c, components } from 'declarativas';
import { Text } from '../components/Text.jsx';
import { Fragment } from '../components/Fragment.js';
import { Ship } from '../components/Ship.jsx';

import { d2r } from '../lib/math';

const { Rect, RevertableState } = components;

const MenuItem = ({ state, x, y, isSelected, item }) => {
  const isDisabled = item.isDisabled || (() => false);
  const fill = isDisabled(state)
    ? '#444'
    : (isSelected ? '#fff' : '#aaa');

  return (
    <>
      {isSelected && (
        <RevertableState>
          <translate x={x - 150} y={y + 15} />
          <rotate value={d2r(360)} />
          <Ship geometry={state.ship.geometry} />
        </RevertableState>
      )}
      <Text align="center" x={x} y={y} size={24} fill={fill}>{item.label}</Text>
    </>
  );
};

const MenuItems = ({ state, yOffset, x, items, selectedItemIndex }) => (
  <>
  {items.map((item, index) => (
    <MenuItem state={state} x={x} y={yOffset + (index * 30)} isSelected={index === selectedItemIndex} item={item} />
  ))}
  </>
);

export const Menu = ({ state, context2d, overlay }) => {
  const { width, height } = context2d.canvas;

  const centerX = width / 2;

  return (
    <RevertableState>
      {<Rect x={0} y={0} width={width} height={height} fill={overlay ? 'rgba(0, 0, 0, 0.6)' : 'black'} />}
      {!overlay && (
        <>
          <Text align="center" x={centerX} y={200} size={48}>Asteroids</Text>
          <Text align="center" x={centerX} y={248} size={16}>powered by declarativas</Text>
        </>
      )}

      <MenuItems state={state} ship={state.ship} x={centerX} yOffset={400} items={state.menu.items} selectedItemIndex={state.menu.index} />
    </RevertableState>
  );
};
