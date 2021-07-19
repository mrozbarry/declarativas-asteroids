import * as vec from './lib/vec.js';
import * as geo from './lib/geometry.js';
import { d2r } from './lib/math.js';

const initialShip = {
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
};

export const init = (width, height) => ({
  resolution: vec.make({ x: width, y: height }),

  view: 'loading',
  loading: [
    { id: 'fonts', done: false },
  ],

  menu: {
    items: [
      {
        label: 'resume',
        onselect: (state, dispatch) => {
          if (state.isPaused) dispatch(togglePause);
          return state;
        },
        isDisabled: state => state.view !== 'game',
      },
      { label: 'new game', onselect: startGame },
      { label: 'controls', onselect: state => state },
      { label: 'high scores', onselect: state => state },
    ],
    index: 0,
  },

  ship: { ...initialShip },
  particles: [],
  asteroids: [],
  shots: [],

  points: 0,
  lives: 3,
  level: 0,
  time: 0,
  isPaused: false,
  nextLevelTimeout: null,
  playerRespawnTimeout: null,
});

export const setView = view => state => ({ ...state, view });

export const resetGame = state => ({
  ...state,
  ship: { ...initialShip },
  particles: [],
  asteroids: [],
  shots: [],

  points: 0,
  lives: 3,
  level: 0,
  time: 0,
  isPaused: false,
  nextLevelTimeout: null,
  playerRespawnTimeout: null,
});

export const startGame = (state, dispatch) => {
  dispatch(resetGame);
  dispatch(completeLevel);
  dispatch(setView('game'));

  return state;
};

export const loadedItem = id => (state, dispatch) => {
  const loading = state.loading.map(l => l.id === id ? { ...l, done: true } : l);
  const remaining = loading.filter(l => !l.done).length;

  if (remaining === 0) {
    dispatch(setView('menu'));
  }

  return { ...state, loading };
};

export const waitForFont = (family) => (state, dispatch) => {
  document.fonts
    .load(`16px ${family}`)
    .then(() => {
      dispatch(loadedItem('fonts'))
    });

  return state;
};

export const afterResize = context2d => (state) => {
  const { innerWidth, innerHeight } = window;
  context2d.canvas.width = innerWidth;
  context2d.canvas.height = innerHeight;

  return state;
};

export const onPress = (key) => (state) => ({
  ...state,
  ship: {
    ...state.ship,
    [key]: true,
  }
});

export const onRelease = (key) => (state) => ({
  ...state,
  ship: {
    ...state.ship,
    [key]: false,
  }
});

const keysToTurn = ship => (
  (ship.left ? -1 : 0) + (ship.right ? 1 : 0)
);

const shipDirection = ship => {
  const rad = d2r(ship.angle);
  const x = Math.cos(rad);
  const y = Math.sin(rad);
  
  return vec.make({ x, y });
};

const makeAsteroid = (resolution, size) => {
  const count = 4 + Math.floor(Math.random() * (size / 4));
  const spacing = 360 / count;
  const points = Array.from({ length: count }, (_, index) => vec.make({
    x: Math.sin(d2r(index * spacing)) * (size - (Math.random() * size / 4)),
    y: Math.cos(d2r(index * spacing)) * (size - (Math.random() * size / 4)),
  }));

  return {
    geometry: points,
    p: vec.make({
      x: Math.random() * resolution.x,
      y: Math.random() * resolution.y,
    }),
    v: vec.make({
      x: 150 - (Math.random() * 300),
      y: 150 - (Math.random() * 300),
    }),
    angle: Math.random() * 359,
    angleV: 60 - (Math.random() * 120),
    size,
    id: Math.random().toString(36),
  }
};

const splitAsteroid = (resolution, collision, asteroid) => {

  return [
    makeAsteroid(resolution, asteroid.size / 2),
    makeAsteroid(resolution, asteroid.size / 2),
  ]
    .map((a, i) => ({
      ...a,
      p: { ...asteroid.p },
      v: vec.clamp(
        vec.scale(
          (i === 0
            ? vec.add(asteroid.v, vec.scale(collision.shot.v, -1))
            : vec.add(asteroid.v, vec.flip(collision.shot.v), -1)
          ),
          1 / 2,
        ),
        150,
      ),
    }));
};

const detectShotCollisions = (context2d, shots, asteroids) => {
  const collisions = [];
  for (let shot of shots) {
    if (collisions.some(c => c.shot.id === shot.id)) continue;

    for (let asteroid of asteroids) {
      if (collisions.some(c => c.asteroid.id === asteroid.id)) continue;

      const path = geo.toPath(asteroid.geometry);
      const rShotP = vec.add(asteroid.p, vec.scale(shot.p, -1));

      const shotCollidesWithAsteroid = context2d.isPointInPath(path, rShotP.x, rShotP.y);

      if (shotCollidesWithAsteroid) {
        collisions.push({
          shot,
          asteroid,
          shotVecUnit: vec.unit(shot.v) || 0,
        });
      }
    }
  }
  return collisions;
};

const detectShipAsteroidCollision = (ship, asteroids) => {
  for (let asteroid of asteroids) {
    if (geo.hasObjectCollision(ship, asteroid)) {
      return {
        shot: ship,
        asteroid,
        showVecUnit: vec.unit(ship.v),
      };
    }
  }

  return null;
};

const advanceShots = (isAlive, resolution, ship, time, direction, shots, delta) => {
  const canShoot = isAlive && time > ship.nextShot;
  const shotV = vec.scale(direction, 300);
  const shot = ship.fire && canShoot
    ? {
      p: vec.add(ship.p, vec.scale(vec.angle(ship.angle), 12)),
      v: shotV,
      angle: 0,
      ttl: ship.slow ? 0.5 : 1.5,
      id: Math.random().toString(36),
    } : [];
  
  return shots
    .concat(shot)
    .map((shot) => ({
      ...shot,
      angle: shot.angle + (100 * delta),
      p: vec.wrap(vec.add(shot.p, vec.scale(shot.v, delta)), resolution),
      ttl: shot.ttl - delta,
    }))
    .filter((shot) => shot.ttl > 0);
};

const handleCollisions = (context2d, isAlive, ship, shots, asteroids, dispatch) => {
  const collisions = detectShotCollisions(context2d, shots, asteroids);
  if (!isAlive) return collisions;

  const asteroidShipCollision = detectShipAsteroidCollision(ship, asteroids);
  if (asteroidShipCollision) {
    collisions.push(asteroidShipCollision);
    dispatch(playerKilled);
  }

  return collisions;
};

const advanceAsteroids = (resolution, collisions, asteroids, delta) => {
  return asteroids
    .filter((asteroid) => asteroid.size >= 20 || !collisions.some(c => c.asteroid.id === asteroid.id))
    .reduce((collection, asteroid) => {
      const collision = collisions.find(c => c.asteroid.id === asteroid.id);

      if (!collision) return collection.concat(asteroid);

      return collection.concat(splitAsteroid(resolution, collision, asteroid));
    }, [])
    .map((asteroid) => ({
      ...asteroid,
      p: vec.wrap(vec.add(asteroid.p, vec.scale(asteroid.v, delta)), resolution),
      angle: (asteroid.angle + (asteroid.angleV * delta)) % 360,
    }));
};

const makeParticle = (p, v, rgb, ttl) => ({
  p,
  v,
  rgb,
  maxTtl: ttl,
  ttl,
  id: Math.random().toString(36),
});

const advanceParticles = (isAlive, resolution, ship, asteroids, collisions, delta, particles) => {
  const shipThrustPosition = vec.add(
    ship.p,
    vec.scale(vec.unit(vec.angle(ship.angle)), -12)
  );
  const rgbs = [
    { r: 200 + Math.floor(Math.random() * 50), g: Math.floor(Math.random() * 100), b: Math.floor(Math.random() * 100) },
    { r: 200 + Math.floor(Math.random() * 50), g: Math.floor(Math.random() * 100), b: Math.floor(Math.random() * 100) },
    { r: 200 + Math.floor(Math.random() * 50), g: Math.floor(Math.random() * 100), b: Math.floor(Math.random() * 100) },
  ];
  const shipParticles = isAlive && ship.thrust
    ? rgbs.map((rgb, index) => makeParticle(
      vec.add(
        shipThrustPosition,
        vec.make({
          x: 1 - index,
          y: 1 - index,
        }),
      ),
      vec.scale(vec.unit(ship.v), -80),
      rgb,
      5,
    )) : [];

  const collisionParticles = collisions.reduce((cp, collision) => {
    return [
      ...cp,
      ...Array.from({ length: 20 }, () => makeParticle(
        collision.asteroid.p,
        vec.make({
          x: Math.cos(d2r(Math.random() * 359)) * 50,
          y: Math.sin(d2r(Math.random() * 359)) * 50,
        }),
        { r: 40, g: 40, b: 40 },
        4,
      )),
    ];
  }, []);

  const asteroidParticles = asteroids.reduce((p, asteroid) => {
    if (Math.random() > 0.4) return p;
    const grayscale = 100 + Math.floor(Math.random() * 155);

    return [
      ...p,
      makeParticle(
        vec.add(
          vec.add(
            asteroid.p,
            vec.scale(vec.unit(asteroid.v), -asteroid.size)
          ),
          vec.make({
            x: (asteroid.size / 2) - (Math.random() * asteroid.size),
            y: (asteroid.size / 2) - (Math.random() * asteroid.size),
          }),
        ),
        vec.scale(vec.unit(ship.v), -80),
        { r: grayscale, g: grayscale, b: grayscale },
        1,
      ),
    ];
  }, []);

  return particles
    .concat(shipParticles)
    .concat(asteroidParticles)
    .concat(collisionParticles)
    .map((particle) => ({
      ...particle,
      p: vec.wrap(vec.add(particle.p, vec.scale(particle.v, delta)), resolution),
      ttl: particle.ttl - delta,
    }))
    .filter(p => p.ttl > 0);
};


export const advance = (delta, context2d) => (prevState, dispatch) => {
  if (prevState.isPaused) return prevState;
  if (prevState.view !== 'game') return prevState;

  const { ship, ...state } = prevState;

  const isAlive = state.playerRespawnTimeout === null;
  const moveModifier = ship.slow ? 0.4 : 1;
  const canShoot = isAlive && state.time > ship.nextShot;

  const direction = shipDirection(ship);

  const shots = advanceShots(isAlive, state.resolution, ship, state.time, direction, state.shots, delta * moveModifier);
  const collisions = state.nextLevelTimeout
    ? []
    : handleCollisions(context2d, isAlive, ship, shots, state.asteroids, dispatch);
  const asteroids = advanceAsteroids(state.resolution, collisions, state.asteroids, delta * moveModifier);
  
  const v = ship.thrust
    ? vec.clamp(vec.add(ship.v, vec.scale(direction, 5)), 300)
    : ship.v;

  return {
    ...state,
    ship: {
      ...ship,
      nextShot: ship.fire && canShoot
        ? state.time + (ship.slow ? 0.01 : 0.2)
        : ship.nextShot,
      p: vec.wrap(vec.add(ship.p, vec.scale(v, delta * moveModifier)), state.resolution),
      v,
      angle: ship.angle + (keysToTurn(ship) * 150 * delta * moveModifier),
    },
    shots,
    asteroids,
    particles: advanceParticles(isAlive, state.resolution, ship, asteroids, collisions, delta * moveModifier, state.particles),
    time: state.time + (delta * moveModifier),
    points: state.points + (collisions.length * 10),
  };
};

export const nextLevel = (state) => {
  return {
    ...state,
    nextLevelTimeout: null,
  }
};

export const completeLevel = (state, dispatch) => {
  if (state.nextLevelTimeout || state.asteroids.length > 0) return state;
  
  const nextLevelTimeout = setTimeout(
      () => dispatch(nextLevel),
      5000,
    );
  
  return {
    ...state,
    nextLevelTimeout,
    level: state.level + 1,
    asteroids: Array.from({ length: state.level + 1 }, () => makeAsteroid(state.resolution, 40)),
  };
};

export const respawn = (state) => {
  return {
    ...state,
    ship: {
      ...state.ship,
      p: { x: 400, y: 300 },
      v: vec.zero,
    },
    playerRespawnTimeout: state.lives > 0 ? null : state.playerRespawnTimeout,
  };
};

export const playerKilled = (state, dispatch) => {
  const lives = Math.max(0, state.lives - 1);
  const playerRespawnTimeout = setTimeout(
    () => dispatch(respawn),
    3000,
  );
  return {
    ...state,
    playerRespawnTimeout,
    lives,
  };
};

export const togglePause = state => ({
  ...state,
  isPaused: !state.isPaused,
  menu: state.isPaused
    ? state.menu
    : { ...state.menu, index: 0 },
});

export const changeMenuItem = diff => state => ({
  ...state,
  menu: {
    ...state.menu,
    index: diff > 0
      ? (state.menu.index + 1) % state.menu.items.length
      : (state.menu.index > 0 ? state.menu.index - 1 : state.menu.items.length - 1)
  },
});

export const selectMenuItem = (state, dispatch) => {
  const isInMenu = state.view === 'menu';
  const isInPause = state.view === 'game' && state.isPaused;
  if (!isInMenu && !isInPause) return state;

  const item = state.menu.items[state.menu.index];
  if (!item) return state;

  dispatch(item.onselect);

  return state;
};
