/**
 * @jsx c
 * @jsxFrag Fragment
 */
import { c, components } from 'declarativas';
import { Text } from './Text.jsx';

const { RevertableState, Rect } = components;

const jitter = (value, amount) => amount > 0 ? value + ((amount / 2) - (Math.random() * amount)) : value;

export const Message = (props, text) => (
  <RevertableState>
    <Rect x={0} y={260} width={props.resolution.x} height={80} fill="rgba(100, 100, 100, 0.5)" />
    <Text x={jitter(400, props.jitter)} y={jitter(300, props.jitter)} size={60} baseline="middle" align="center">{text}</Text>
  </RevertableState>
);
