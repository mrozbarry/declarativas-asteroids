import { render } from 'declarativas';

export const build = ({ init, view, onBeforeTick, context2d }) => {
  const [initState, ...initEffects] = [].concat(init);
  let state = { ...initState };
  let lastRender = null;
  let rafHandle = null;
  let pendingUpdates = [];
  let paused = false;
  const beforeTick = onBeforeTick || (() => {});
  
  let self = {};
  
  const animationFrame = (timestamp) => {
    if (paused) return;
    
    const delta = lastRender
      ? (timestamp - lastRender) / 1000
      : 0;
    
    lastRender = timestamp;
    
    beforeTick(self);
    
    while (pendingUpdates.length) {
      const update = pendingUpdates.pop();
      const [fn, ...effects] = [].concat(update);
      const extraEffects = [];
      const dispatchFromAction = (fn) => {
        extraEffects.push(fn);
      };
      state = fn(state, context2d, delta, dispatchFromAction);
      effects
        .concat(extraEffects)
        .filter(Boolean)
        .forEach(fx => fx(self));
    }
    render(context2d, view(state, context2d));
    rafHandle = requestAnimationFrame(animationFrame);
  };
    
  self.update = fn => {
    pendingUpdates.push(fn);
  };
  
  self.pause = () => {
    paused = true;
    lastRender = null;
    cancelAnimationFrame(rafHandle);
  };
  
  self.resume = () => {
    paused = false;
    rafHandle = requestAnimationFrame(animationFrame);
  };
  
  self.resume();
  initEffects.filter(Boolean).forEach(fx => fx(self));

  return self;
};


