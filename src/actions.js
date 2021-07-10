import * as vec from './lib/vec.js';
import * as geo from './lib/geometry.js';
import { d2r } from './lib/math.js';

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
      x: 200 - (Math.random() * 300),
      y: 200 - (Math.random() * 300),
    }),
    angle: Math.random() * 359,
    angleV: 60 - (Math.random() * 120),
    size,
    id: Math.random().toString(36),
  }
};

const splitAsteroid = (collision, asteroid) => {
  const shotVec = vec.unit(collision.shot.v);
  const asteroidVec = vec.unit(asteroid.v);

  return [
    makeAsteroid(asteroid.size / 2),
    makeAsteroid(asteroid.size / 2),
  ]
    .map((a, i) => ({
      ...a,
      p: { ...asteroid.p },
      v: vec.scale(
        (i === 0
          ? vec.make({ x: asteroidVec.x * -shotVec.x, y: asteroidVec.y * -shotVec.y })
          : vec.make({ x: asteroidVec.y * -shotVec.y, y: asteroidVec.x * -shotVec.x })
        ),
        200,
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

export const advance = (prevState, context2d, delta, dispatch) => {
  const { ship, ...state } = prevState;

  const moveModifier = ship.slow
    ? 0.4
    : 1;

  const direction = shipDirection(ship);

  const canShoot = state.time > ship.nextShot;
  const shotV = vec.scale(direction, 300);
  const shot = ship.fire && canShoot
    ? [{ p: { ...ship.p }, v: shotV, angle: 0, ttl: ship.slow ? 0.5 : 1.5, id: Math.random().toString(36) }]
    : [];
  
  let shots = state.shots
    .concat(shot)
    .map((shot) => ({
      ...shot,
      angle: shot.angle + (100 * delta * moveModifier),
      p: vec.wrap(vec.add(shot.p, vec.scale(shot.v, delta * moveModifier)), 800, 600),
      ttl: shot.ttl - (delta * moveModifier),
    }))
    .filter((shot) => shot.ttl > 0);
  
  const collisions = detectShotCollisions(context2d, shots, state.asteroids);
  const asteroidShipCollision = detectShipAsteroidCollision(ship, state.asteroids);
  if (asteroidShipCollision) {
    collisions.push(asteroidShipCollision);
    dispatch(function foo(app) {
      app.update(playerKilled(app));
    });
  }
  
  const asteroids = state.asteroids
    .filter((asteroid) => asteroid.size >= 20 || !collisions.some(c => c.asteroid.id === asteroid.id))
    .reduce((collection, asteroid) => {
      const collision = collisions.find(c => c.asteroid.id === asteroid.id);

      if (!collision) return collection.concat(asteroid);

      return collection.concat(splitAsteroid(collision, asteroid));
    }, [])
    .map((asteroid) => ({
      ...asteroid,
      p: vec.wrap(vec.add(asteroid.p, vec.scale(asteroid.v, delta * moveModifier)), 800, 600),
      angle: (asteroid.angle + (asteroid.angleV * delta)) % 360,
    }));
  
  shots = shots
    .filter((shot) => !collisions.some(c => c.shot.id === shot.id));

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
  return {
    ...state,
    ship: {
      ...state.ship,
      p: { x: 400, y: 300 },
      v: vec.zero,
    },
    lives: Math.max(0, state.lives - 1),
    playerRespawnTimeout: null,
  };
};

export const playerKilled = (app) => (state) => {
  const playerRespawnTimeout = setTimeout(
    () => app.update(respawn),
    3000,
  );
  return { ...state, playerRespawnTimeout };
};
