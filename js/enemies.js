import * as THREE from 'three';
import { COLORS as C } from './config.js';
import { add } from './utils.js';

/* ------------------------------------------------------------------ */
/* Geometrias compartilhadas                                           */
/* ------------------------------------------------------------------ */
const G = {
  body: new THREE.SphereGeometry(0.5, 10, 8),
  eye: new THREE.SphereGeometry(0.1, 6, 5),
  pupil: new THREE.SphereGeometry(0.05, 5, 4),
  leg: new THREE.BoxGeometry(0.1, 0.1, 0.5),
  stalk: new THREE.CylinderGeometry(0.03, 0.03, 0.22, 5),
  barPlane: new THREE.PlaneGeometry(1, 1).translate(0.5, 0, 0),
};

/* ------------------------------------------------------------------ */
/* Definições (atributos + aparência). Para criar outro inimigo,       */
/* basta adicionar uma entrada aqui.                                   */
/* ------------------------------------------------------------------ */
export const ENEMY_TYPES = {
  crab: {
    name: 'Caranguejo',
    hp: 40,
    speed: 3.0,
    damage: 1,
    barY: 1.35,
    build: buildCrab,
  },
  slime: {
    name: 'Slime Marinho',
    hp: 80,
    speed: 1.8,
    damage: 2,
    barY: 1.5,
    build: buildSlime,
  },
};

function buildCrab(model) {
  add(model, G.body, C.red, { y: 0.42, sx: 1.05, sy: 0.55, sz: 0.85 });
  add(model, G.body, C.redDark, { y: 0.3, sx: 1.1, sy: 0.3, sz: 0.9 });

  const claws = [];
  [-1, 1].forEach((s) => {
    const arm = new THREE.Group();
    arm.position.set(0.5, 0.45, 0.5 * s);
    model.add(arm);
    add(arm, G.body, C.red, { x: 0.18, sx: 0.4, sy: 0.3, sz: 0.28 });
    add(arm, G.body, C.redDark, { x: 0.4, y: 0.06, sx: 0.28, sy: 0.18, sz: 0.2 });
    claws.push(arm);
  });

  [-1, 1].forEach((s) => {
    add(model, G.stalk, C.redDark, { x: 0.35, y: 0.78, z: 0.18 * s });
    add(model, G.eye, C.white, { x: 0.35, y: 0.93, z: 0.18 * s });
    add(model, G.pupil, C.black, { x: 0.41, y: 0.94, z: 0.18 * s });
  });

  const legs = [];
  [-1, 1].forEach((s) => {
    [-0.25, 0, 0.25].forEach((x, i) => {
      const leg = add(model, G.leg, C.redDark, { x, y: 0.2, z: 0.55 * s, ry: 0.5 * s });
      leg.userData.phase = i;
      legs.push(leg);
    });
  });

  return (t) => {
    claws.forEach((c, i) => (c.rotation.z = Math.sin(t * 6 + i * 3) * 0.12));
    legs.forEach((l) => (l.rotation.x = Math.sin(t * 14 + l.userData.phase * 2) * 0.35));
    model.position.y = Math.abs(Math.sin(t * 7)) * 0.04;
  };
}

function buildSlime(model) {
  const jelly = new THREE.Group();
  model.add(jelly);
  add(jelly, G.body, 0x2fd6b4, {
    y: 0.38,
    sx: 1.15,
    sy: 0.85,
    sz: 1.15,
    matOpts: { transparent: true, opacity: 0.82, emissive: 0x0f8f7a, emissiveIntensity: 0.4 },
  });
  add(jelly, G.body, 0xbff7ea, { x: -0.15, y: 0.2, sx: 0.35, sy: 0.3, sz: 0.35, cast: false });
  [-1, 1].forEach((s) => {
    add(jelly, G.eye, C.white, { x: 0.45, y: 0.52, z: 0.2 * s, sx: 1.3, sy: 1.3, sz: 1.3 });
    add(jelly, G.pupil, C.black, { x: 0.57, y: 0.52, z: 0.2 * s, sx: 1.4, sy: 1.4, sz: 1.4 });
  });

  return (t) => {
    const k = Math.sin(t * 5);
    jelly.scale.set(1 - k * 0.08, 1 + k * 0.14, 1 - k * 0.08);
  };
}

const BAR_W = 1.1;
const BAR_H = 0.14;
const barBgMat = new THREE.MeshBasicMaterial({ color: 0x1a1a24, depthTest: false, fog: false });
const barBorderMat = new THREE.MeshBasicMaterial({ color: 0xffffff, depthTest: false, fog: false });

function createHealthBar() {
  const bar = new THREE.Group();
  bar.renderOrder = 10;

  const border = new THREE.Mesh(G.barPlane, barBorderMat);
  border.scale.set(BAR_W + 0.08, BAR_H + 0.08, 1);
  border.position.x = -(BAR_W + 0.08) / 2;
  const bg = new THREE.Mesh(G.barPlane, barBgMat);
  bg.scale.set(BAR_W, BAR_H, 1);
  bg.position.set(-BAR_W / 2, 0, 0.001);
  const fillMat = new THREE.MeshBasicMaterial({ color: 0x4cd964, depthTest: false, fog: false });
  const fill = new THREE.Mesh(G.barPlane, fillMat);
  fill.scale.set(BAR_W, BAR_H, 1);
  fill.position.set(-BAR_W / 2, 0, 0.002);

  [border, bg, fill].forEach((m) => (m.renderOrder = 10));
  fill.renderOrder = 12;
  bg.renderOrder = 11;
  bar.add(border, bg, fill);
  return { bar, fill, fillMat };
}

const _green = new THREE.Color(0x4cd964);
const _yellow = new THREE.Color(0xffd23d);
const _red = new THREE.Color(0xff4b3e);

export class Enemy {
  constructor(typeId, curve, pathLength) {
    const def = ENEMY_TYPES[typeId];
    this.type = typeId;
    this.def = def;
    this.curve = curve;
    this.pathLength = pathLength;

    this.maxHp = def.hp;
    this.hp = def.hp;
    this.speed = def.speed;
    this.damage = def.damage;

    this.distance = 0;
    this.state = 'walking';
    this.deathTimer = 0;
    this.hitPulse = 0;
    this.seed = Math.random() * 10;

    this.root = new THREE.Group();
    this.model = new THREE.Group();
    this.root.add(this.model);
    this.animate = def.build(this.model);

    const hb = createHealthBar();
    this.healthBar = hb.bar;
    this.fill = hb.fill;
    this.fillMat = hb.fillMat;
    this.healthBar.position.y = def.barY;
    this.root.add(this.healthBar);
    this._placeOnPath();
  }

  get alive() {
    return this.state === 'walking';
  }

  get position() {
    return this.root.position;
  }

  takeDamage(amount) {
    if (!this.alive) return;
    this.hp = Math.max(0, this.hp - amount);
    this.hitPulse = 0.15;
    const r = this.hp / this.maxHp;
    this.fill.scale.x = Math.max(0.0001, BAR_W * r);
    this.fillMat.color.copy(r > 0.5 ? _yellow.clone().lerp(_green, (r - 0.5) * 2) : _red.clone().lerp(_yellow, r * 2));
    if (this.hp <= 0) {
      this.state = 'dying';
      this.deathTimer = 0.35;
      this.healthBar.visible = false;
    }
  }

  _placeOnPath() {
    const u = Math.min(this.distance / this.pathLength, 1);
    const p = this.curve.getPointAt(u);
    const t = this.curve.getTangentAt(u);
    this.root.position.copy(p);
    this.model.rotation.y = Math.atan2(-t.z, t.x);
  }

  update(dt, time, camera) {
    if (this.state === 'dying') {
      this.deathTimer -= dt;
      const k = Math.max(0, this.deathTimer / 0.35);
      this.model.scale.setScalar(k);
      this.model.position.y = (1 - k) * 0.3;
      return this.deathTimer <= 0 ? 'dead' : null;
    }

    this.distance += this.speed * dt;
    if (this.distance >= this.pathLength) return 'reached';
    this._placeOnPath();

    this.animate(time + this.seed);
    if (this.hitPulse > 0) {
      this.hitPulse -= dt;
      this.model.scale.setScalar(1 + Math.max(0, this.hitPulse) * 1.2);
    } else {
      this.model.scale.setScalar(1);
    }

    this.healthBar.quaternion.copy(camera.quaternion);
    return null;
  }

  dispose() {
    this.fillMat.dispose();
  }
}

export class EnemyManager {
  constructor(scene, map, hooks = {}) {
    this.map = map;
    this.hooks = hooks;
    this.group = new THREE.Group();
    this.group.name = 'enemies';
    scene.add(this.group);
    this.enemies = [];
  }

  spawn(typeId) {
    if (!ENEMY_TYPES[typeId]) throw new Error(`Inimigo desconhecido: ${typeId}`);
    const e = new Enemy(typeId, this.map.curve, this.map.pathLength);
    this.group.add(e.root);
    this.enemies.push(e);
    return e;
  }

  damage(enemy, amount) {
    const wasAlive = enemy.alive;
    enemy.takeDamage(amount);
    if (wasAlive && !enemy.alive) this.hooks.onKill?.(enemy);
  }

  get aliveCount() {
    return this.enemies.filter((e) => e.alive).length;
  }

  update(dt, time, camera) {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      const result = e.update(dt, time, camera);
      if (result === 'reached') {
        this.hooks.onBaseHit?.(e.damage, e);
        this._remove(i);
      } else if (result === 'dead') {
        this._remove(i);
      }
    }
  }

  clear() {
    for (let i = this.enemies.length - 1; i >= 0; i--) this._remove(i);
  }

  _remove(index) {
    const [e] = this.enemies.splice(index, 1);
    e.state = 'removed';
    this.group.remove(e.root);
    e.dispose();
  }
}
