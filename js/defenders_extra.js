import * as THREE from 'three';
import { COLORS as C } from './config.js';
import { add } from './utils.js';

const G = {
  limb: new THREE.CylinderGeometry(0.1, 0.1, 0.5, 6),
  ball: new THREE.SphereGeometry(1, 8, 6),
  box: new THREE.BoxGeometry(1, 1, 1),
};
const lerp = THREE.MathUtils.lerp;
const now = () => performance.now() / 1000;
const PI = Math.PI;

/** Corpo base humanoide (mesmas proporções do Marinheiro). Tudo fica em `body`. */
function humanoid(m, o) {
  const A = (p, g, c, x = {}) => add(p, g, c, { ...x, matOpts: { ...o.fx, ...x.matOpts } });
  const body = new THREE.Group();
  m.add(body);
  const w = o.w || 1;
  if (!o.noLegs) [-0.15, 0.15].forEach((z) => A(body, G.box, o.pants, { y: 0.22, z: z * w, sx: o.legW || 0.24, sy: 0.45, sz: 0.22 }));
  A(body, new THREE.CylinderGeometry(0.33 * w, 0.37 * w, 0.62, 8), o.top, { y: 0.76 });
  A(body, G.ball, o.skin, { y: 1.36, sx: 0.28, sy: 0.28, sz: 0.28 });
  [-0.1, 0.1].forEach((z) => A(body, G.ball, o.eye || C.black, { x: 0.25, y: 1.38, z, sx: o.eyeS || 0.04, sy: o.eyeS || 0.04, sz: o.eyeS || 0.04, matOpts: o.eyeFx }));
  return { body, A };
}

/** Braço de ataque com pivô no ombro; `w` aponta a lâmina para +x. */
function arm(body, A, color, skin, t = 1) {
  const a = new THREE.Group();
  a.position.set(0, 1.02, 0.42 * (t > 1 ? 1.2 : 1));
  body.add(a);
  A(a, G.limb, color, { y: -0.25, sx: t, sz: t });
  A(a, G.ball, skin, { y: -0.5, sx: 0.1 * t, sy: 0.1 * t, sz: 0.1 * t });
  A(body, G.limb, color, { y: 0.95, z: -0.42, rx: 0.15, sx: t, sz: t });
  const w = new THREE.Group();
  w.position.y = -0.5;
  w.rotation.z = -PI / 2;
  a.add(w);
  return { a, w };
}

const swingPose = (a, s, wind = -1, hit = 1.6) => {
  if (s < 0) a.rotation.z = 0.25;
  else if (s < 0.35) a.rotation.z = lerp(0.25, wind, s / 0.35);
  else if (s < 0.6) a.rotation.z = lerp(wind, hit, (s - 0.35) / 0.25);
  else a.rotation.z = lerp(hit, 0.25, (s - 0.6) / 0.4);
};

/** Partículas que orbitam (energia/água/brilho). Barato: poucas malhas emissivas. */
function orbiters(p, geo, color, n, { r, y, bob = 0.1, speed = 1.5, opacity = 1 }) {
  const list = Array.from({ length: n }, () =>
    add(p, geo, color, { cast: false, matOpts: { emissive: color, emissiveIntensity: 1, transparent: opacity < 1, opacity } }));
  return (t) => list.forEach((m, i) => {
    const ang = t * speed + (i * 2 * PI) / n;
    m.position.set(Math.cos(ang) * r, y + Math.sin(t * 2 + i * 1.7) * bob, Math.sin(ang) * r);
    m.rotation.y = ang;
  });
}

const SPARK = new THREE.OctahedronGeometry(0.07, 0);
const DROP = new THREE.SphereGeometry(0.07, 6, 4);
const WISP = new THREE.ConeGeometry(0.08, 0.3, 5);

/* ------------------------------ Bruxa do Mar ------------------------------ */
function buildSeaWitch(m, level = 1) {
  const P = 0x7b3fc4, D = 0x4a2a8a, T = 0x3fd0d0, skin = 0xf2c4a0;
  const { body, A } = humanoid(m, { skin, pants: D, top: P });
  A(body, new THREE.CylinderGeometry(0.3, 0.62, 0.6, 9), D, { y: 0.34 });
  A(body, new THREE.CylinderGeometry(0.64, 0.64, 0.06, 9), T, { y: 0.06 });
  A(body, new THREE.CylinderGeometry(0.36, 0.36, 0.08, 8), T, { y: 0.58 });
  A(body, G.ball, 0x2b1a5a, { x: -0.12, y: 1.4, sx: 0.3, sy: 0.3, sz: 0.32 });
  A(body, G.box, 0x2b1a5a, { x: -0.24, y: 1.02, sx: 0.1, sy: 0.7, sz: 0.3 });
  A(body, new THREE.CylinderGeometry(0.45, 0.45, 0.05, 10), D, { y: 1.6 });
  A(body, new THREE.ConeGeometry(0.27, 0.75, 8), P, { y: 2.0, rz: -0.15 });
  A(body, new THREE.CylinderGeometry(0.28, 0.28, 0.07, 8), T, { y: 1.65 });
  A(body, new THREE.TorusGeometry(0.3, 0.05, 5, 10), T, { y: 1.12, rx: PI / 2 }); // gola
  const { a } = arm(body, A, P, skin);
  A(a, new THREE.CylinderGeometry(0.04, 0.05, 2, 6), C.woodDark, { y: 0.4 });
  const orb = A(a, new THREE.IcosahedronGeometry(0.2, 0), T, { y: 1.5, cast: false, matOpts: { emissive: T, emissiveIntensity: 1.3 } });
  const ring = A(a, new THREE.TorusGeometry(0.3, 0.03, 5, 10), C.gold, { y: 1.5, rx: PI / 2 });
  const orbit = orbiters(body, SPARK, 0xb78cff, 4, { r: 0.75, y: 1.0, bob: 0.2, speed: 1.4 });
  const setLevel = (l) => { ring.visible = l >= 3; orb.material.emissiveIntensity = l >= 5 ? 2 : 1.3; };
  setLevel(level);
  return {
    setLevel,
    pose(s) {
      const t = now();
      body.scale.y = 1 + Math.sin(t * 2.2) * 0.015;
      orb.scale.setScalar(1 + Math.sin(t * 4) * 0.12 + (s >= 0.3 && s < 0.6 ? 0.5 : 0));
      ring.rotation.z = t * 2;
      orbit(t);
      swingPose(a, s, -0.5, 1.4);
    },
  };
}

/* ----------------------------- Esqueleto Pirata ---------------------------- */
function buildSkeleton(m, level = 1) {
  const bone = 0xe9e4d0;
  const { body, A } = humanoid(m, { skin: bone, pants: bone, top: 0x6a4a35, legW: 0.12, eye: 0x7dff8a, eyeS: 0.06, eyeFx: { emissive: 0x3dff5a, emissiveIntensity: 1 } });
  [0.62, 0.76, 0.9].forEach((y) => A(body, G.box, bone, { x: 0.3, y, sx: 0.06, sy: 0.05, sz: 0.4 })); // costelas
  A(body, G.box, bone, { x: 0.22, y: 1.2, sx: 0.12, sy: 0.12, sz: 0.2 }); // mandíbula
  [-0.22, 0.22].forEach((z) => A(body, G.box, 0x7a2e2a, { x: -0.2, y: 0.38, z, sx: 0.08, sy: 0.35, sz: 0.2, rz: z * 0.4 })); // trapos
  A(body, new THREE.CylinderGeometry(0.4, 0.4, 0.07, 10), C.black, { y: 1.58 });
  A(body, new THREE.CylinderGeometry(0.25, 0.3, 0.26, 10), C.black, { y: 1.72 });
  A(body, G.ball, bone, { x: 0.27, y: 1.72, sx: 0.07, sy: 0.07, sz: 0.04 });
  const { a, w } = arm(body, A, bone, bone, 0.7);
  A(w, new THREE.CylinderGeometry(0.04, 0.04, 0.22, 5), C.woodDark, { y: 0.05 });
  A(w, G.box, 0x8a6a2a, { y: 0.17, sx: 0.07, sy: 0.05, sz: 0.3 });
  const blade = A(w, G.box, 0x9aa8a0, { y: 0.6, sx: 0.04, sy: 0.8, sz: 0.11 });
  blade.material = blade.material.clone();
  const setLevel = (l) => { blade.material.color.set(l >= 5 ? 0xdfe6ee : 0x9aa8a0); };
  return {
    setLevel,
    pose(s) {
      const t = now();
      body.rotation.z = Math.sin(t * 6) * 0.015; // tremor dos ossos
      body.scale.y = 1 + Math.sin(t * 2.4) * 0.012;
      swingPose(a, s);
    },
  };
}

/* ------------------------------- Brutamontes ------------------------------- */
function buildBrute(m, level = 1) {
  const skin = 0xd89a6a;
  m.scale.setScalar(1.18);
  const { body, A } = humanoid(m, { skin, pants: 0x5a3a2a, top: 0xb02f28, w: 1.5, legW: 0.34 });
  A(body, new THREE.CylinderGeometry(0.5, 0.56, 0.1, 8), C.black, { y: 0.55 });
  A(body, G.box, C.gold, { x: 0.54, y: 0.55, sx: 0.05, sy: 0.14, sz: 0.22 });
  A(body, new THREE.CylinderGeometry(0.3, 0.3, 0.12, 8), C.red, { y: 1.58 }); // bandana
  A(body, G.box, C.red, { x: -0.3, y: 1.55, sx: 0.24, sy: 0.08, sz: 0.1, rz: -0.25 });
  A(body, G.ball, 0x3a2012, { x: 0.15, y: 1.22, sx: 0.2, sy: 0.18, sz: 0.24 }); // barba
  const spikes = new THREE.Group();
  body.add(spikes);
  [-1, 1].forEach((s) => {
    A(body, G.ball, skin, { y: 1.06, z: 0.55 * s, sx: 0.2, sy: 0.2, sz: 0.2 });
    A(spikes, new THREE.ConeGeometry(0.08, 0.3, 5), C.stoneDark, { y: 1.28, z: 0.55 * s });
  });
  const { a, w } = arm(body, A, skin, skin, 1.7);
  A(w, new THREE.CylinderGeometry(0.06, 0.06, 1.1, 6), C.woodDark, { y: 0.35 });
  const head = A(w, G.box, 0x757c88, { y: 1.0, sx: 0.5, sy: 0.4, sz: 0.8, matOpts: { metalness: 0.4 } });
  head.material = head.material.clone();
  [-0.3, 0.3].forEach((z) => A(w, G.box, C.gold, { y: 1.0, z, sx: 0.54, sy: 0.44, sz: 0.06 }));
  const setLevel = (l) => {
    spikes.visible = l >= 3;
    head.material.color.set(l >= 5 ? C.gold : 0x757c88);
    head.material.emissive.set(l >= 5 ? 0x8a5a00 : 0);
  };
  setLevel(level);
  return {
    setLevel,
    pose(s) {
      body.scale.y = 1 + Math.sin(now() * 1.8) * 0.02;
      swingPose(a, s, -1.5, 1.7);
    },
  };
}

/* ----------------------------- Capitão Fantasma ---------------------------- */
function buildGhostCaptain(m, level = 1) {
  const fx = { transparent: true, opacity: 0.72, emissive: 0x2a8cff, emissiveIntensity: 0.55 };
  const { body, A } = humanoid(m, { skin: 0xbfe6ff, pants: 0x2a5aa0, top: 0x2f6fd0, noLegs: true, fx, eye: 0xffffff, eyeS: 0.05, eyeFx: { emissive: 0xffffff, emissiveIntensity: 1.5 } });
  A(body, new THREE.ConeGeometry(0.42, 0.9, 8), 0x2a5aa0, { y: 0.28, rx: PI }); // cauda espectral
  A(body, G.box, 0x9ad0ff, { y: 1.45, x: 0.2, sx: 0.04, sy: 0.04, sz: 0.2 });
  A(body, G.box, C.black, { y: 1.64, sx: 0.5, sy: 0.1, sz: 1.1, matOpts: { opacity: 0.85 } });
  [-1, 1].forEach((s) => A(body, G.box, C.black, { y: 1.72, z: 0.52 * s, sx: 0.5, sy: 0.2, sz: 0.1, matOpts: { opacity: 0.85 } }));
  A(body, new THREE.CylinderGeometry(0.25, 0.3, 0.26, 8), C.black, { y: 1.76, matOpts: { opacity: 0.85 } });
  A(body, G.box, 0x7fe3ff, { x: 0.26, y: 1.66, sx: 0.04, sy: 0.07, sz: 1.1 });
  const cape = new THREE.Group();
  cape.position.set(-0.36, 1.1, 0);
  body.add(cape);
  A(cape, G.box, 0x1d4a9a, { x: -0.04, y: -0.55, sx: 0.06, sy: 1.1, sz: 0.85 });
  const { a, w } = arm(body, A, 0x2f6fd0, 0xbfe6ff);
  A(w, new THREE.CylinderGeometry(0.04, 0.04, 0.22, 5), 0x7fe3ff, { y: 0.05 });
  A(w, G.box, 0x7fe3ff, { y: 0.17, sx: 0.07, sy: 0.05, sz: 0.34 });
  const blade = A(w, G.box, 0x9ff0ff, { y: 0.66, sx: 0.04, sy: 0.9, sz: 0.12, matOpts: { emissive: 0x39d8ff, emissiveIntensity: 1.6, opacity: 0.85 } });
  const wisps = orbiters(body, WISP, 0x6fd0ff, 5, { r: 0.55, y: 0.6, bob: 0.35, speed: 1.1, opacity: 0.6 });
  const setLevel = (l) => { blade.material.emissiveIntensity = l >= 5 ? 3 : 1.6; blade.scale.y = l >= 3 ? 1.15 : 1; };
  setLevel(level);
  return {
    setLevel,
    pose(s) {
      const t = now();
      body.position.y = 0.25 + Math.sin(t * 1.8) * 0.08; // flutua
      cape.rotation.z = 0.12 + Math.sin(t * 2.5) * 0.08;
      wisps(t);
      swingPose(a, s);
    },
  };
}

/* ----------------------------- Almirante Dourado --------------------------- */
function buildAdmiral(m, level = 1) {
  const gold = { emissive: C.gold, emissiveIntensity: 0.45 };
  const skin = 0xf2b98a;
  const { body, A } = humanoid(m, { skin, pants: C.white, top: 0x1a2a6a, w: 1.1 });
  A(body, new THREE.CylinderGeometry(0.4, 0.5, 0.5, 8), 0x1a2a6a, { y: 0.45 }); // casaca longa
  A(body, new THREE.CylinderGeometry(0.52, 0.52, 0.07, 8), C.gold, { y: 0.2, matOpts: gold });
  A(body, new THREE.CylinderGeometry(0.38, 0.38, 0.08, 8), C.gold, { y: 0.56, matOpts: gold });
  [0.7, 0.88, 1.04].forEach((y) => A(body, G.ball, C.gold, { x: 0.38 - (y - 0.7) * 0.15, y, sx: 0.05, sy: 0.05, sz: 0.05, matOpts: gold }));
  A(body, G.box, C.red, { x: 0.33, y: 0.84, sx: 0.05, sy: 0.6, sz: 0.2, rz: 0.1 }); // faixa
  const epa = new THREE.Group();
  body.add(epa);
  [-1, 1].forEach((s) => A(epa, G.box, C.gold, { y: 1.12, z: 0.44 * s, sx: 0.24, sy: 0.07, sz: 0.26, matOpts: gold }));
  A(body, G.ball, C.white, { x: 0.12, y: 1.24, sx: 0.2, sy: 0.14, sz: 0.2 }); // barba
  // Coroa
  A(body, new THREE.CylinderGeometry(0.27, 0.24, 0.16, 8), C.gold, { y: 1.68, matOpts: gold });
  for (let i = 0; i < 6; i++) {
    const ang = (i / 6) * PI * 2;
    A(body, new THREE.ConeGeometry(0.06, 0.2, 4), C.gold, { x: Math.cos(ang) * 0.24, z: Math.sin(ang) * 0.24, y: 1.84, matOpts: gold });
  }
  A(body, G.ball, C.red, { x: 0.25, y: 1.68, sx: 0.05, sy: 0.05, sz: 0.05, matOpts: { emissive: C.red, emissiveIntensity: 0.8 } });
  const cape = new THREE.Group();
  cape.position.set(-0.4, 1.12, 0);
  body.add(cape);
  A(cape, G.box, C.redDark, { x: -0.04, y: -0.6, sx: 0.06, sy: 1.2, sz: 0.95 });
  A(cape, G.box, C.white, { x: -0.07, y: -0.05, sx: 0.07, sy: 0.12, sz: 0.97 });
  const { a, w } = arm(body, A, 0x1a2a6a, skin);
  A(w, new THREE.CylinderGeometry(0.04, 0.04, 0.22, 5), C.gold, { y: 0.05, matOpts: gold });
  A(w, G.box, C.gold, { y: 0.17, sx: 0.07, sy: 0.05, sz: 0.36, matOpts: gold });
  A(w, G.ball, C.blue, { y: 0.2, sx: 0.07, sy: 0.07, sz: 0.07, matOpts: { emissive: C.blue, emissiveIntensity: 1 } });
  const blade = A(w, G.box, C.gold, { y: 0.7, sx: 0.045, sy: 1.0, sz: 0.13, matOpts: { emissive: 0xb87a00, emissiveIntensity: 0.8, metalness: 0.5 } });
  const aura = add(body, new THREE.TorusGeometry(0.8, 0.04, 5, 24), C.gold, { y: 0.1, rx: PI / 2, cast: false, matOpts: { emissive: C.gold, emissiveIntensity: 1, transparent: true, opacity: 0.6 } });
  const sparks = orbiters(body, SPARK, 0xffe680, 6, { r: 0.8, y: 1.0, bob: 0.5, speed: 1.0 });
  const setLevel = (l) => { epa.visible = l >= 3; aura.visible = l >= 3; blade.scale.y = l >= 5 ? 1.2 : 1; };
  setLevel(level);
  return {
    setLevel,
    pose(s) {
      const t = now();
      body.scale.y = 1 + Math.sin(t * 2) * 0.015;
      cape.rotation.z = 0.08 + Math.sin(t * 2.2) * 0.05;
      aura.scale.setScalar(1 + Math.sin(t * 3) * 0.06);
      aura.material.opacity = 0.45 + Math.sin(t * 3) * 0.2;
      sparks(t);
      swingPose(a, s);
    },
  };
}

/* ------------------------------ Poseidon Pirata ---------------------------- */
function buildPoseidon(m, level = 1) {
  const skin = 0x6fc4c0, T = 0x1fb8c8, wet = 0x58d0ff;
  m.scale.setScalar(1.1);
  const { body, A } = humanoid(m, { skin, pants: 0x1a6a9a, top: skin, w: 1.2 });
  A(body, new THREE.CylinderGeometry(0.42, 0.5, 0.45, 8), 0x1a6a9a, { y: 0.45 });
  A(body, new THREE.CylinderGeometry(0.44, 0.44, 0.08, 8), C.gold, { y: 0.66 });
  [0.2, 0.4].forEach((y) => A(body, G.ball, 0xfff0cf, { x: 0.4, y: 0.4 + y, sx: 0.08, sy: 0.06, sz: 0.1 })); // conchas
  [0, 1, 2, 3, 4].forEach((i) =>
    A(body, G.ball, C.white, { x: 0.2 + Math.abs(i - 2) * -0.02, y: 1.28 - Math.abs(i - 2) * 0.05 - i * 0.04, z: (i - 2) * 0.1, sx: 0.14, sy: 0.2, sz: 0.1 })); // barba volumosa
  A(body, G.ball, C.white, { x: 0.22, y: 1.28, sx: 0.06, sy: 0.04, sz: 0.2 }); // bigode
  A(body, new THREE.CylinderGeometry(0.3, 0.3, 0.1, 8), 0x2a8a9a, { y: 1.58 });
  A(body, G.ball, C.white, { x: -0.1, y: 1.4, sx: 0.3, sy: 0.3, sz: 0.34 }); // cabelo
  for (let i = -2; i <= 2; i++)
    A(body, new THREE.ConeGeometry(0.06, 0.28 - Math.abs(i) * 0.05, 4), C.gold, { x: 0.05, y: 1.8, z: i * 0.1, matOpts: { emissive: C.gold, emissiveIntensity: 0.4 } }); // coroa de coral
  const { a } = arm(body, A, skin, skin, 1.2);
  A(a, new THREE.CylinderGeometry(0.05, 0.05, 2.3, 6), C.woodDark, { y: 0.55 });
  const tip = new THREE.Group();
  tip.position.y = 1.8;
  a.add(tip);
  [-0.16, 0, 0.16].forEach((z) => A(tip, new THREE.ConeGeometry(0.05, z === 0 ? 0.5 : 0.38, 5), C.gold, { y: 0.2, z, matOpts: { emissive: C.gold, emissiveIntensity: 0.5 } }));
  A(tip, G.box, C.gold, { sx: 0.06, sy: 0.06, sz: 0.4 });
  const glow = A(tip, new THREE.SphereGeometry(0.12, 6, 5), wet, { y: 0.5, cast: false, matOpts: { emissive: wet, emissiveIntensity: 1.5, transparent: true, opacity: 0.8 } });
  const wave = add(body, new THREE.TorusGeometry(0.7, 0.05, 5, 24), wet, { y: 0.1, rx: PI / 2, cast: false, matOpts: { emissive: wet, emissiveIntensity: 0.8, transparent: true, opacity: 0.55 } });
  const drops = orbiters(body, DROP, wet, 6, { r: 0.75, y: 0.9, bob: 0.4, speed: 1.6, opacity: 0.8 });
  const setLevel = (l) => { wave.visible = l >= 3; glow.scale.setScalar(l >= 5 ? 1.8 : 1); };
  setLevel(level);
  return {
    setLevel,
    pose(s) {
      const t = now();
      body.scale.y = 1 + Math.sin(t * 1.8) * 0.018;
      const k = (t * 0.8) % 1; // onda se expandindo
      wave.scale.setScalar(0.7 + k * 0.7);
      wave.material.opacity = (1 - k) * 0.6;
      glow.scale.y = 1 + Math.sin(t * 5) * 0.2;
      drops(t);
      swingPose(a, s, -0.6, 1.5);
    },
  };
}

/* --------------------------------- Definições ------------------------------ */
const lv = (list) => list.map(([upgradeCost, ability, visualTier]) => ({ upgradeCost, ability, ...(visualTier && { visualTier }) }));

export const EXTRA_TYPES = {
  seawitch: {
    name: 'Bruxa do Mar', desc: 'Feiticeira pirata. Lança rajadas mágicas a média distância.',
    cost: 240, damage: 40, range: 9, attackSpeed: 0.6, strikeAt: 0.45, projectile: true,
    levels: lv([[0, 'Cajado encantado'], [130, 'Maré arcana'], [220, 'Anel mágico', 2], [320, 'Conjuro veloz'], [440, 'Tempestade arcana', 2]]),
    build: buildSeaWitch,
  },
  skeleton: {
    name: 'Esqueleto Pirata', desc: 'Morto-vivo ágil com espada enferrujada.',
    cost: 170, damage: 26, range: 5, attackSpeed: 1.3, strikeAt: 0.5,
    levels: lv([[0, 'Espada enferrujada'], [90, 'Ossos reforçados'], [160, 'Fúria ossuda', 2], [240, 'Golpe veloz'], [340, 'Lâmina polida', 2]]),
    build: buildSkeleton,
  },
  brute: {
    name: 'Brutamontes', desc: 'Gigante pirata. Martelada devastadora, ataque lento.',
    cost: 260, damage: 70, range: 4.2, attackSpeed: 0.5, strikeAt: 0.55,
    levels: lv([[0, 'Martelo de ferro'], [140, 'Músculos de aço'], [230, 'Ombreiras de espinhos', 2], [330, 'Martelada rápida'], [450, 'Martelo dourado', 2]]),
    build: buildBrute,
  },
  ghostcaptain: {
    name: 'Capitão Fantasma', desc: 'Capitão espectral. Espada de energia azul.',
    cost: 330, damage: 44, range: 6.5, attackSpeed: 1.1, strikeAt: 0.5,
    levels: lv([[0, 'Lâmina espectral'], [160, 'Névoa gélida'], [260, 'Lâmina longa', 2], [370, 'Corte etéreo'], [500, 'Fúria fantasma', 2]]),
    build: buildGhostCaptain,
  },
  admiral: {
    name: 'Almirante Dourado', desc: 'Comandante real. Sabre dourado e grande alcance de combate.',
    cost: 420, damage: 60, range: 9, attackSpeed: 0.9, strikeAt: 0.5, projectile: true,
    levels: lv([[0, 'Sabre real'], [200, 'Ordem de fogo'], [320, 'Dragonas e aura', 2], [450, 'Comando rápido'], [600, 'Brilho supremo', 2]]),
    build: buildAdmiral,
  },
  poseidon: {
    name: 'Poseidon Pirata', desc: 'Senhor dos mares. Tridente que fere de longe.',
    cost: 480, damage: 85, range: 10, attackSpeed: 0.8, strikeAt: 0.5, projectile: true,
    levels: lv([[0, 'Tridente das marés'], [220, 'Onda cortante'], [350, 'Maré viva', 2], [490, 'Tsunami veloz'], [650, 'Fúria dos oceanos', 2]]),
    build: buildPoseidon,
  },
};