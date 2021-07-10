export const storage = () => {
  let memory = new Map();

  const get = (key) => {
    const item = memory.get(key);
    if (!item) return null;
    memory.set(key, {
      ...item,
      count: item.count + 1,
      accessedAt: performance.now(),
    });
    return item.value;
  };
  const set = (key, value) => {
    memory.set(key, {
      value,
      count: 0,
      accessedAt: performance.now(),
    });

    return value;
  };
  const clear = () => memory.clear();

  return { get, set, clear };
};

export const memoize = (fn) => {
  const memory = storage();

  const wrapped = (...args) => {
    return memory.get(args) || memory.set(args, fn(...args));
  };
  wrapped.reset = () => {
    memory.clear();
  };

  return wrapped;
};
