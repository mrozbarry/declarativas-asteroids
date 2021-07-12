import * as vec from './lib/vec.js';
import * as geo from './lib/geometry.js';
import { d2r } from './lib/math.js';

export const INITIAL_STATE = {
  particles: [],
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
};

export const afterResize = (state, context2d) => {
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

const makeAsteroid = (size) => {
  const count = 4 + Math.floor(Math.random() * (size / 4));
  const spacing = 360 / count;
  const points = Array.from({ length: count }, (_, index) => vec.make({
    x: Math.sin(d2r(index * spacing)) * (size - (Math.random() * size / 4)),
    y: Math.cos(d2r(index * spacing)) * (size - (Math.random() * size / 4)),
  }));

  return {
    geometry: points,
    p: vec.make({
      x: Math.random() * 800,
      y: Math.random() * 600,
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

const splitAsteroid = (collision, asteroid) => {

  return [
    makeAsteroid(asteroid.size / 2),
    makeAsteroid(asteroid.size / 2),
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

const advanceShots = (isAlive, ship, time, direction, shots, delta) => {
  const canShoot = isAlive && time > ship.nextShot;
  const shotV = vec.scale(direction, 300);
  const shot = ship.fire && canShoot
    ? {
      p: { ...ship.p },
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
      p: vec.wrap(vec.add(shot.p, vec.scale(shot.v, delta)), 800, 600),
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
    dispatch(function foo(app) {
      app.update(playerKilled(app));
    });
  }

  return collisions;
};

const advanceAsteroids = (collisions, asteroids, delta) => {
  return asteroids
    .filter((asteroid) => asteroid.size >= 20 || !collisions.some(c => c.asteroid.id === asteroid.id))
    .reduce((collection, asteroid) => {
      const collision = collisions.find(c => c.asteroid.id === asteroid.id);

      if (!collision) return collection.concat(asteroid);

      return collection.concat(splitAsteroid(collision, asteroid));
    }, [])
    .map((asteroid) => ({
      ...asteroid,
      p: vec.wrap(vec.add(asteroid.p, vec.scale(asteroid.v, delta)), 800, 600),
      angle: (asteroid.angle + (asteroid.angleV * delta)) % 360,
    }));
};

const makeParticle = (p, v, rgb, ttl) => ({
  p,
  v,
  rgb,
  ttl,
  id: Math.random().toString(36),
});

export const advanceParticles = (isAlive, ship, collisions, delta, particles) => {
  const shipThrustPosition = vec.add(
    vec.add(ship.p, vec.scale(vec.unit(ship.v), -8)),
    vec.make({
      x: 2 - (Math.random() * 4),
      y: 2 - (Math.random() * 4),
    }),
  );
  const shipParticles = isAlive && ship.thrust
    ? makeParticle(
      shipThrustPosition,
      vec.scale(vec.unit(ship.v), -1.1),
      { r: 200 + Math.floor(Math.random() * 50), g: Math.floor(Math.random() * 100), b: Math.floor(Math.random() * 100) },
      1
    )
    : [];

  const collisionParticles = collisions.reduce((cp, collision) => {
    return [
      ...cp,
      ...Array.from({ length: 8 }, () => makeParticle(
        collision.asteroid.p,
        vec.make({
          x: Math.cos(d2r(Math.random() * 359)) * 50,
          y: Math.sin(d2r(Math.random() * 359)) * 50,
        }),
        { r: 40, g: 40, b: 40 },
        1,
      )),
    ];
  }, [])

  return particles
    .concat(shipParticles)
    .concat(collisionParticles)
    .map((particle) => ({
      ...particle,
      p: vec.wrap(vec.add(particle.p, vec.scale(particle.v, delta)), 800, 600),
      ttl: particle.ttl - delta,
    }))
    .filter(p => p.ttl > 0);
};


export const advance = (prevState, context2d, delta, dispatch) => {
  const { ship, ...state } = prevState;

  const isAlive = state.playerRespawnTimeout === null;
  const moveModifier = ship.slow ? 0.4 : 1;
  const canShoot = isAlive && state.time > ship.nextShot;

  const direction = shipDirection(ship);

  let shots = advanceShots(isAlive, ship, state.time, direction, state.shots, delta * moveModifier);
  const collisions = handleCollisions(context2d, isAlive, ship, shots, state.asteroids, dispatch);
  const asteroids = advanceAsteroids(collisions, state.asteroids, delta * moveModifier);
  
  shots = shots.filter((shot) => !collisions.some(c => c.shot.id === shot.id));

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
      p: vec.wrap(vec.add(ship.p, vec.scale(v, delta * moveModifier)), 800, 600),
      v,
      angle: ship.angle + (keysToTurn(ship) * 150 * delta * moveModifier),
    },
    shots,
    asteroids,
    particles: advanceParticles(isAlive, ship, collisions, delta * moveModifier, state.particles),
    time: state.time + (delta * moveModifier),
    points: state.points + (collisions.length * 10),
  };
};

export const nextLevel = (state) => {
  const level = state.level + 1;
  return {
    ...state,
    asteroids: Array.from({ length: level }, () => makeAsteroid(40)),
    shots: [],
    level,
    nextLevelTimeout: null,
  }
};

export const completeLevel = app => (state) => {
  if (state.level === 0 || state.nextLevelTimeout || state.asteroids.length > 0) return state;
  
  const nextLevelTimeout = setTimeout(
      () => app.update(nextLevel),
      5000,
    );
  
  return { ...state, nextLevelTimeout };
};

export const respawn = (state) => {
  const lives = Math.max(0, state.lives - 1);
  return {
    ...state,
    ship: {
      ...state.ship,
      p: { x: 400, y: 300 },
      v: vec.zero,
    },
    lives,
    playerRespawnTimeout: lives > 0 ? null : state.playerRespawnTimeout,
  };
};

export const playerKilled = (app) => (state) => {
  const playerRespawnTimeout = setTimeout(
    () => app.update(respawn),
    3000,
  );
  return { ...state, playerRespawnTimeout };
};
