import * as THREE from 'three';
import { COLORS as C } from './config.js';
import { add } from './utils.js';

// Cada builder segue o contrato de enemies.js: build(model) -> animate(t). Inimigos olham para +x.
const B = new THREE.BoxGeometry(1, 1, 1);
const S = new THREE.SphereGeometry(1, 8, 6);
const D = new THREE.DodecahedronGeometry(1, 0);
const cyl = (a, b, h, n = 7) => new THREE.CylinderGeometry(a, b, h, n);
const cone = (r, h, n = 5) => new THREE.ConeGeometry(r, h, n);
const glow = (c, i = 1.4, extra = {}) => ({ emissive: c, emissiveIntensity: i, ...extra });
const sw = Math.sin;
const PI = Math.PI;

function eyes(p, x, y, z, c, s, angry = true) {
  [-1, 1].forEach((k) => {
    add(p, S, c, { x, y, z: z * k, sx: s, sy: s, sz: s, cast: false, matOpts: glow(c, 1.6) });
    if (angry) add(p, B, C.black, { x: x - 0.01, y: y + s * 1.1, z: z * k, sx: s * 0.6, sy: s * 0.35, sz: s * 2.2, rx: -0.5 * k });
  });
}

/* ---------------- Esqueleto Pirata: bandana, cutelo enferrujado ---------------- */
function buildSkeleton(model) {
  const bone = 0xe8e2cf, j = new THREE.Group();
  j.scale.setScalar(0.85);
  model.add(j);
  const legs = [-1, 1].map((k) => {
    const l = new THREE.Group(); l.position.set(0, 0.6, 0.16 * k); j.add(l);
    add(l, B, bone, { y: -0.28, sx: 0.1, sy: 0.56, sz: 0.1 });
    add(l, B, C.woodDark, { x: 0.07, y: -0.58, sx: 0.26, sy: 0.12, sz: 0.16 }); // bota velha
    return l;
  });
  add(j, B, bone, { y: 0.66, sx: 0.28, sy: 0.14, sz: 0.4 }); // pÃ©lvis
  add(j, B, bone, { y: 0.95, sx: 0.07, sy: 0.55, sz: 0.07 }); // coluna
  [0.82, 0.98, 1.14].forEach((y, i) => add(j, B, bone, { x: 0.06, y, sx: 0.12, sy: 0.07, sz: 0.5 - i * 0.07 }));
  add(j, B, 0x7a2e2a, { x: -0.18, y: 0.5, sx: 0.06, sy: 0.5, sz: 0.55, rz: 0.1 }); // trapos
  add(j, B, C.woodDark, { x: 0.05, y: 0.7, sx: 0.36, sy: 0.07, sz: 0.5 }); // cinto
  const head = new THREE.Group(); head.position.y = 1.5; j.add(head);
  add(head, S, bone, { sx: 0.3, sy: 0.28, sz: 0.27 });
  add(head, B, bone, { x: 0.14, y: -0.2, sx: 0.16, sy: 0.09, sz: 0.2 });
  eyes(head, 0.25, 0.04, 0.1, 0x6dff7a, 0.06);
  add(head, cyl(0.29, 0.29, 0.13, 8), C.red, { y: 0.2 }); // bandana
  add(head, B, C.red, { x: -0.3, y: 0.18, sx: 0.28, sy: 0.07, sz: 0.1, rz: -0.4 });
  const arm = new THREE.Group(); arm.position.set(0, 1.2, 0.34); j.add(arm);
  add(arm, B, bone, { y: -0.25, sx: 0.07, sy: 0.5, sz: 0.07 });
  const blade = new THREE.Group(); blade.position.y = -0.5; blade.rotation.z = -PI / 2; arm.add(blade);
  add(blade, B, 0x8a6a2a, { y: 0.1, sx: 0.07, sy: 0.05, sz: 0.3 });
  add(blade, B, 0xa08e78, { y: 0.55, sx: 0.04, sy: 0.8, sz: 0.14 }); // lÃ¢mina enferrujada
  add(blade, B, 0xa08e78, { x: 0, y: 0.98, sx: 0.04, sy: 0.12, sz: 0.2, rz: 0.4 });
  const off = new THREE.Group(); off.position.set(0, 1.2, -0.34); j.add(off);
  add(off, B, bone, { y: -0.25, sx: 0.07, sy: 0.5, sz: 0.07 });
  return (t) => {
    legs.forEach((l, i) => (l.rotation.z = sw(t * 8 + i * PI) * 0.5));
    arm.rotation.z = 0.3 + sw(t * 8) * 0.3; off.rotation.z = -sw(t * 8) * 0.4;
    j.position.y = Math.abs(sw(t * 8)) * 0.05; head.rotation.z = sw(t * 4) * 0.08;
  };
}

/* ---------------- Fantasma: tricÃ³rnio, gancho e correntes ---------------- */
function buildGhost(model) {
  const g = new THREE.Group(); model.add(g);
  const fx = { transparent: true, opacity: 0.62, emissive: 0x5fb0ff, emissiveIntensity: 0.6 };
  add(g, cyl(0.5, 0.18, 1.3, 8), 0xbfeaff, { y: 1.0, matOpts: fx });
  [0, 1, 2, 3, 4].forEach((i) => add(g, cone(0.14, 0.45, 4), 0xbfeaff, { x: Math.cos(i * 1.26) * 0.3, z: Math.sin(i * 1.26) * 0.3, y: 0.28, rx: PI, matOpts: fx }));
  add(g, S, 0xe8f8ff, { y: 1.85, sx: 0.4, sy: 0.38, sz: 0.38, matOpts: fx });
  eyes(g, 0.34, 1.9, 0.14, 0x1a3a7a, 0.1);
  add(g, B, 0x1a3a7a, { x: 0.36, y: 1.7, sx: 0.04, sy: 0.12, sz: 0.3, matOpts: fx }); // boca
  add(g, B, C.black, { y: 2.18, sx: 0.5, sy: 0.08, sz: 1.1, matOpts: { transparent: true, opacity: 0.85 } });
  [-1, 1].forEach((s) => add(g, B, C.black, { y: 2.25, z: 0.5 * s, sx: 0.5, sy: 0.2, sz: 0.1, matOpts: { transparent: true, opacity: 0.85 } }));
  add(g, cyl(0.24, 0.3, 0.26, 8), C.black, { y: 2.3, matOpts: { transparent: true, opacity: 0.85 } });
  add(g, B, 0x7fe3ff, { x: 0.26, y: 2.2, sx: 0.04, sy: 0.06, sz: 1.1, matOpts: glow(0x7fe3ff, 1) });
  const arm = new THREE.Group(); arm.position.set(0.1, 1.5, 0.5); g.add(arm);
  add(arm, B, 0xbfeaff, { x: 0.25, y: -0.1, sx: 0.5, sy: 0.12, sz: 0.12, matOpts: fx });
  add(arm, cone(0.07, 0.3, 4), 0xdde6ee, { x: 0.6, y: -0.15, rz: -PI / 2 - 0.5 }); // gancho
  const chain = [];
  for (let i = 0; i < 6; i++) chain.push(add(g, new THREE.TorusGeometry(0.1, 0.03, 4, 6), 0x7fa0b8, { x: -0.1 - i * 0.12, y: 1.2 - i * 0.14, z: -0.45, ry: i % 2 ? PI / 2 : 0 }));
  return (t) => {
    g.position.y = 0.4 + sw(t * 2.5) * 0.15;
    arm.rotation.z = sw(t * 3) * 0.2;
    chain.forEach((c, i) => (c.position.z = -0.45 + sw(t * 3 + i) * 0.05));
  };
}

/* ---------------- Magmaling: rocha viva com chifres ---------------- */
function buildMagmaling(model) {
  const j = new THREE.Group(); model.add(j);
  const lava = glow(0xff4a10, 1.4);
  add(j, D, 0x3a2a28, { y: 0.6, sx: 0.65, sy: 0.55, sz: 0.6 });
  [[0.1, 0.8, 0.4, 0.4], [-0.2, 0.5, 0.45, -0.3], [0.2, 0.4, -0.45, 0.2]].forEach(([x, y, z, r]) =>
    add(j, B, 0xff5a1c, { x: x + 0.1, y, z, sx: 0.5, sy: 0.05, sz: 0.1, rz: r, cast: false, matOpts: lava }));
  add(j, S, 0xff7a2a, { x: 0.35, y: 0.5, sx: 0.3, sy: 0.22, sz: 0.3, cast: false, matOpts: lava }); // boca em brasa
  eyes(j, 0.5, 0.82, 0.2, 0xffe066, 0.09);
  [-1, 1].forEach((s) => {
    add(j, cone(0.1, 0.45), 0x2a2020, { x: 0.05, y: 1.2, z: 0.28 * s, rz: -0.3, rx: 0.3 * s });
    add(j, D, 0x3a2a28, { y: 0.45, z: 0.62 * s, sx: 0.2, sy: 0.2, sz: 0.2 });
    add(j, D, 0x2a2020, { x: 0.1, y: 0.1, z: 0.25 * s, sx: 0.2, sy: 0.15, sz: 0.2 });
  });
  const flames = [0, 1, 2].map((i) => add(j, cone(0.1, 0.35, 4), 0xff9a2e, { x: -0.3, y: 1.1, z: (i - 1) * 0.22, cast: false, matOpts: lava }));
  return (t) => {
    j.position.y = Math.abs(sw(t * 6)) * 0.08;
    j.rotation.z = sw(t * 6) * 0.05;
    flames.forEach((f, i) => f.scale.y = 1 + sw(t * 10 + i * 2) * 0.4);
  };
}

/* ---------------- Obsidiana: golem de cristal negro ---------------- */
function buildObsidian(model) {
  const j = new THREE.Group(); model.add(j);
  const rock = 0x2a2630, core = glow(0xff6a20, 1.6);
  [-1, 1].forEach((s) => add(j, B, rock, { y: 0.3, z: 0.28 * s, sx: 0.34, sy: 0.6, sz: 0.3 }));
  add(j, new THREE.OctahedronGeometry(1, 0), rock, { y: 1.15, sx: 0.55, sy: 0.7, sz: 0.65 });
  const c = add(j, S, 0xff7a2a, { x: 0.42, y: 1.15, sx: 0.15, sy: 0.15, sz: 0.15, cast: false, matOpts: core });
  add(j, D, rock, { y: 1.95, sx: 0.3, sy: 0.28, sz: 0.3 });
  eyes(j, 0.26, 1.98, 0.12, 0xff9a2e, 0.06);
  [-1, 1].forEach((s) => add(j, cone(0.1, 0.6, 4), 0x4a3a5a, { x: -0.1, y: 1.8, z: 0.4 * s, rz: 0.2, rx: 0.4 * s, matOpts: { emissive: 0x6a2aff, emissiveIntensity: 0.5 } }));
  [0, 1, 2].forEach((i) => add(j, cone(0.12, 0.7 - i * 0.12, 4), 0x4a3a5a, { x: -0.4, y: 1.0 + i * 0.3, z: (i - 1) * 0.3, rz: 0.7, matOpts: { emissive: 0x6a2aff, emissiveIntensity: 0.5 } }));
  const arms = [-1, 1].map((s) => {
    const a = new THREE.Group(); a.position.set(0, 1.45, 0.6 * s); j.add(a);
    add(a, B, rock, { y: -0.4, sx: 0.2, sy: 0.8, sz: 0.2 });
    add(a, D, 0x3a3344, { y: -0.9, sx: 0.28, sy: 0.28, sz: 0.28 });
    add(a, cone(0.07, 0.25, 4), 0xff6a20, { x: 0.2, y: -0.9, rz: -PI / 2, matOpts: core });
    return a;
  });
  return (t) => {
    j.position.y = Math.abs(sw(t * 3)) * 0.06;
    arms.forEach((a, i) => (a.rotation.z = sw(t * 3 + i * PI) * 0.35));
    c.scale.setScalar(0.15 + 0.03 * sw(t * 5));
  };
}

/* ---------------- Abissal: homem-peixe com colete e tridente ---------------- */
function buildDeepling(model) {
  const j = new THREE.Group(); model.add(j);
  const skin = 0x2a8fb0, belly = 0x8fd8e0;
  const legs = [-1, 1].map((k) => {
    const l = new THREE.Group(); l.position.set(0, 0.5, 0.2 * k); j.add(l);
    add(l, B, skin, { y: -0.25, sx: 0.18, sy: 0.5, sz: 0.2 });
    add(l, cone(0.2, 0.3, 3), 0x1a6a8a, { x: 0.2, y: -0.5, rz: -PI / 2, sz: 1.5 }); // pÃ©-nadadeira
    return l;
  });
  add(j, S, skin, { y: 0.95, sx: 0.45, sy: 0.55, sz: 0.4 });
  add(j, S, belly, { x: 0.15, y: 0.85, sx: 0.3, sy: 0.42, sz: 0.3 });
  add(j, B, 0x8a3a2a, { x: 0.05, y: 1.0, sx: 0.86, sy: 0.5, sz: 0.8 }); // colete rasgado
  add(j, B, C.gold, { x: 0.41, y: 1.0, sx: 0.04, sy: 0.4, sz: 0.1 });
  add(j, S, skin, { x: 0.1, y: 1.65, sx: 0.36, sy: 0.3, sz: 0.34 });
  [-1, 1].forEach((s) => {
    add(j, S, 0xffe066, { x: 0.3, y: 1.8, z: 0.2 * s, sx: 0.13, sy: 0.13, sz: 0.13, matOpts: glow(0xffe066, 0.6) });
    add(j, S, C.black, { x: 0.41, y: 1.8, z: 0.2 * s, sx: 0.05, sy: 0.09, sz: 0.05 });
    add(j, B, 0x1a6a8a, { x: 0.2, y: 1.5, z: 0.3 * s, sx: 0.12, sy: 0.04, sz: 0.04, rz: 0.4 }); // guelras
  });
  add(j, B, 0xd8f0f0, { x: 0.4, y: 1.5, sx: 0.04, sy: 0.05, sz: 0.3 }); // dentes
  [0, 1, 2, 3].forEach((i) => add(j, cone(0.09, 0.45 - i * 0.06, 3), 0xff7a4a, { x: 0.05 - i * 0.14, y: 2.0 - i * 0.1, rz: 0.2 + i * 0.1 })); // crista
  const arm = new THREE.Group(); arm.position.set(0.1, 1.2, 0.5); j.add(arm);
  add(arm, B, skin, { y: -0.25, sx: 0.14, sy: 0.5, sz: 0.14 });
  const tri = new THREE.Group(); tri.position.y = -0.5; tri.rotation.z = -PI / 2; arm.add(tri);
  add(tri, cyl(0.04, 0.04, 1.6, 5), C.woodDark, { y: 0.4 });
  [-1, 0, 1].forEach((z) => add(tri, cone(0.05, z ? 0.4 : 0.55, 4), 0xc9d4dc, { y: 1.3, z: z * 0.16 }));
  add(tri, B, 0xc9d4dc, { y: 1.1, sx: 0.05, sy: 0.05, sz: 0.4 });
  return (t) => {
    legs.forEach((l, i) => (l.rotation.z = sw(t * 9 + i * PI) * 0.5));
    j.position.y = Math.abs(sw(t * 9)) * 0.05; j.rotation.z = sw(t * 4.5) * 0.04;
    arm.rotation.z = 0.3 + sw(t * 5) * 0.25;
  };
}

/* ---------------- TitÃ£ de Lava: chefe colossal ---------------- */
function buildLavaTitan(model) {
  const j = new THREE.Group(); model.add(j);
  const rock = 0x2a2020, lava = glow(0xff4a10, 1.5);
  [-1, 1].forEach((s) => add(j, D, rock, { y: 0.55, z: 0.5 * s, sx: 0.45, sy: 0.6, sz: 0.4 }));
  add(j, D, rock, { y: 1.7, sx: 0.95, sy: 0.95, sz: 1.1 });
  [[0.5, 1.9, 0.3], [0.5, 1.5, -0.3], [0.4, 1.2, 0.1]].forEach(([x, y, z], i) => add(j, B, 0xff5a1c, { x, y, z, sx: 0.06, sy: 0.5, sz: 0.1, rz: i * 0.5, cast: false, matOpts: lava }));
  add(j, B, 0xff7a2a, { x: 0.8, y: 1.3, sx: 0.06, sy: 0.15, sz: 0.5, cast: false, matOpts: lava }); // fenda de lava
  add(j, D, 0x3a2a28, { y: 2.75, sx: 0.5, sy: 0.45, sz: 0.5 });
  eyes(j, 0.4, 2.85, 0.2, 0xffe066, 0.1);
  add(j, B, 0xff7a2a, { x: 0.45, y: 2.55, sx: 0.06, sy: 0.12, sz: 0.4, cast: false, matOpts: lava });
  [-1, 1].forEach((s) => {
    add(j, cone(0.14, 0.8), 0x1a1414, { y: 3.2, z: 0.35 * s, rx: 0.4 * s });
    add(j, D, 0x3a2a28, { y: 2.45, z: 1.0 * s, sx: 0.4, sy: 0.4, sz: 0.4 });
    add(j, cone(0.12, 0.5, 4), 0xff9a2e, { y: 2.9, z: 1.0 * s, cast: false, matOpts: lava });
  });
  const arms = [-1, 1].map((s) => {
    const a = new THREE.Group(); a.position.set(0, 2.3, 1.0 * s); j.add(a);
    add(a, B, rock, { y: -0.7, sx: 0.4, sy: 1.4, sz: 0.4 });
    add(a, D, 0x3a2a28, { y: -1.5, sx: 0.5, sy: 0.5, sz: 0.5 });
    add(a, B, 0xff5a1c, { x: 0.22, y: -1.5, sx: 0.04, sy: 0.3, sz: 0.4, cast: false, matOpts: lava });
    return a;
  });
  return (t) => {
    j.position.y = Math.abs(sw(t * 2.5)) * 0.12;
    arms.forEach((a, i) => (a.rotation.z = sw(t * 2.5 + i * PI) * 0.35));
    j.rotation.z = sw(t * 2.5) * 0.03;
  };
}

/* ---------------- Kraken: cabeÃ§a com chapÃ©u roubado e tentÃ¡culos ---------------- */
function buildKraken(model) {
  const j = new THREE.Group(); model.add(j);
  const purple = 0x7a3fa0;
  add(j, S, purple, { y: 2.2, sx: 1.1, sy: 1.3, sz: 1.1 });
  [[0.8, 2.7, 0.4], [0.9, 2.2, -0.5], [0.6, 3.0, -0.3]].forEach(([x, y, z]) => add(j, S, 0xb070d0, { x, y, z, sx: 0.12, sy: 0.12, sz: 0.12 })); // manchas
  [-1, 1].forEach((s) => {
    add(j, S, 0xffe066, { x: 0.95, y: 2.4, z: 0.45 * s, sx: 0.2, sy: 0.22, sz: 0.2, matOpts: glow(0xffe066, 1) });
    add(j, B, C.black, { x: 1.14, y: 2.4, z: 0.45 * s, sx: 0.04, sy: 0.3, sz: 0.06 });
    add(j, B, 0x40206a, { x: 0.95, y: 2.75, z: 0.45 * s, sx: 0.1, sy: 0.08, sz: 0.4, rx: -0.5 * s });
  });
  add(j, B, 0xd8c8e8, { x: 1.05, y: 1.75, sx: 0.06, sy: 0.12, sz: 0.5 });
  add(j, B, C.black, { y: 3.4, sx: 0.7, sy: 0.1, sz: 1.7, rz: 0.1 }); // tricÃ³rnio roubado
  add(j, cyl(0.4, 0.5, 0.4, 8), C.black, { y: 3.65 });
  add(j, cyl(0.51, 0.51, 0.08, 8), C.gold, { y: 3.48 });
  const tents = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * PI * 2, root = new THREE.Group();
    root.position.set(Math.cos(a) * 0.8, 1.1, Math.sin(a) * 0.8); root.rotation.y = -a; j.add(root);
    let parent = root;
    const segs = [];
    for (let k = 0; k < 4; k++) {
      const sg = new THREE.Group(); sg.position.y = k ? -0.5 : 0; parent.add(sg);
      add(sg, cyl(0.2 - k * 0.04, 0.26 - k * 0.04, 0.55, 6), k % 2 ? 0x8a4fb0 : purple, { y: -0.25, rz: 0 });
      segs.push(sg); parent = sg;
    }
    root.rotation.z = 0.5; tents.push({ segs, ph: i });
  }
  return (t) => {
    j.position.y = sw(t * 2) * 0.1;
    tents.forEach(({ segs, ph }) => segs.forEach((s, k) => (s.rotation.z = sw(t * 3 + ph + k * 0.7) * 0.28)));
  };
}

export const ENEMY_MODELS = {
  skeleton: buildSkeleton, ghost: buildGhost, magmaling: buildMagmaling, obsidian: buildObsidian,
  deepling: buildDeepling, lavaTitan: buildLavaTitan, kraken: buildKraken,
};
