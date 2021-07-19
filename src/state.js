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

    const updateBuffer = [];
    const dispatch = fn => updateBuffer.push(fn);
    
    beforeTick(state, delta, context2d, dispatch);
    
    while (pendingUpdates.length) {
      const update = pendingUpdates.pop();
      const [fn, ...effects] = [].concat(update);

      state = fn(state, self.update);

      effects
        .filter(Boolean)
        .forEach(fx => self.update(fx));
    }
    render(context2d, view(state, context2d));
    updateBuffer.forEach(fn => pendingUpdates.push(fn));
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
  initEffects.filter(Boolean).forEach(fx => self.update(fx));

  return self;
};


