import * as THREE from 'three';
import { COLORS as C } from './config.js';
import { mat, add, rand, pick } from './utils.js';

// Geometrias compartilhadas
const G = {
  leaf: new THREE.ConeGeometry(0.55, 2.5, 4).rotateZ(-Math.PI / 2),
  rock: new THREE.DodecahedronGeometry(1, 0),
  bush: new THREE.IcosahedronGeometry(1, 0),
  coconut: new THREE.SphereGeometry(0.2, 6, 4),
};

/* ------------------------------------------------------------------ */
/* Natureza                                                            */
/* ------------------------------------------------------------------ */

export function createPalm(rng, scale = 1) {
  const g = new THREE.Group();
  const trunk = new THREE.Group();
  trunk.rotation.y = rng() * Math.PI * 2;
  g.add(trunk);

  const height = rand(rng, 3.4, 5.2);
  const segs = 6;
  const segH = height / segs;
  const bend = rand(rng, 0.04, 0.1) * (rng() < 0.5 ? -1 : 1);
  let px = 0;
  let py = 0;

  for (let i = 0; i < segs; i++) {
    const t = i * bend;
    const r0 = 0.34 - i * 0.03;
    const r1 = 0.34 - (i + 1) * 0.03;
    add(trunk, new THREE.CylinderGeometry(r1, r0, segH * 1.04, 7), i % 2 ? C.trunkDark : C.trunk, {
      x: px + (Math.sin(t) * segH) / 2,
      y: py + (Math.cos(t) * segH) / 2,
      rz: -t,
    });
    px += Math.sin(t) * segH;
    py += Math.cos(t) * segH;
  }

  const crown = new THREE.Group();
  crown.position.set(px, py, 0);
  trunk.add(crown);

  const n = 8;
  for (let i = 0; i < n; i++) {
    const yaw = new THREE.Group();
    yaw.rotation.y = (i / n) * Math.PI * 2 + rand(rng, -0.15, 0.15);
    crown.add(yaw);
    const tilt = new THREE.Group();
    tilt.rotation.z = -rand(rng, 0.25, 0.8);
    yaw.add(tilt);
    add(tilt, G.leaf, i % 2 ? C.leaf : C.leafLight, { x: 0.05, sy: 0.2 });
  }

  [
    [0.25, -0.22, 0.15],
    [-0.2, -0.25, 0.2],
    [0.0, -0.22, -0.28],
  ].forEach(([x, y, z]) => add(crown, G.coconut, C.woodDark, { x, y, z }));

  g.scale.setScalar(scale);
  return g;
}

export function createRock(rng, size = 1) {
  const color = pick(rng, [C.rock, C.rockDark, C.rockLight]);
  const m = add(new THREE.Group(), G.rock, color, {
    sx: size * rand(rng, 0.9, 1.3),
    sy: size * rand(rng, 0.6, 0.9),
    sz: size * rand(rng, 0.9, 1.2),
    rx: rand(rng, -0.2, 0.2),
    ry: rng() * Math.PI * 2,
    rz: rand(rng, -0.2, 0.2),
    y: size * 0.35,
  });
  const g = new THREE.Group();
  g.add(m);
  return g;
}

export function createBush(rng, size = 1) {
  const g = new THREE.Group();
  const count = 3;
  for (let i = 0; i < count; i++) {
    const s = size * rand(rng, 0.5, 0.8);
    add(g, G.bush, i % 2 ? C.bush : C.leaf, {
      x: rand(rng, -0.5, 0.5) * size,
      y: s * 0.7,
      z: rand(rng, -0.5, 0.5) * size,
      sx: s,
      sy: s * 0.85,
      sz: s,
      ry: rng() * 3,
    });
  }
  return g;
}

/* ------------------------------------------------------------------ */
/* Caveira e bandeira pirata                                           */
/* ------------------------------------------------------------------ */

export function createSkull(size = 1) {
  const g = new THREE.Group();
  add(g, new THREE.SphereGeometry(0.5, 8, 6), C.white, { sx: 1, sy: 0.95, sz: 0.9 });
  add(g, new THREE.BoxGeometry(0.55, 0.28, 0.45), C.white, { y: -0.45, z: 0.02 });
  add(g, new THREE.SphereGeometry(0.13, 6, 4), C.black, { x: -0.18, y: 0.03, z: 0.38 });
  add(g, new THREE.SphereGeometry(0.13, 6, 4), C.black, { x: 0.18, y: 0.03, z: 0.38 });
  add(g, new THREE.BoxGeometry(0.1, 0.12, 0.08), C.black, { y: -0.18, z: 0.43 });
  g.scale.setScalar(size);
  return g;
}

export function createCrossbones(size = 1) {
  const g = new THREE.Group();
  [-0.55, 0.55].forEach((a) => {
    const bone = new THREE.Group();
    bone.rotation.z = a;
    add(bone, new THREE.BoxGeometry(1.5, 0.14, 0.14), C.white);
    add(bone, new THREE.SphereGeometry(0.13, 5, 4), C.white, { x: -0.75, z: 0.06 });
    add(bone, new THREE.SphereGeometry(0.13, 5, 4), C.white, { x: 0.75, z: 0.06 });
    g.add(bone);
  });
  g.scale.setScalar(size);
  return g;
}

/** Bandeira preta com caveira. A dobradiça fica na origem e a bandeira se estende para +x. */
export function createJollyRoger(w = 1.8, h = 1.2) {
  const g = new THREE.Group();
  add(g, new THREE.BoxGeometry(w, h, 0.06), C.black, { x: w / 2 });
  const skull = createSkull(h * 0.5);
  skull.position.set(w / 2, h * 0.08, 0.05);
  g.add(skull);
  const bones = createCrossbones(h * 0.35);
  bones.position.set(w / 2, -h * 0.22, 0.05);
  g.add(bones);
  return g;
}

/* ------------------------------------------------------------------ */
/* Navios                                                              */
/* ------------------------------------------------------------------ */

function hullShape() {
  const s = new THREE.Shape();
  s.moveTo(-4, -1.3);
  s.lineTo(-4, 1.3);
  s.lineTo(1.5, 1.9);
  s.lineTo(4.6, 0);
  s.lineTo(1.5, -1.9);
  s.closePath();
  return s;
}

/** Navio pirata (proa apontando para +x). Com { wreck: true } vira um naufrágio. */
export function createShip({ wreck = false } = {}) {
  const g = new THREE.Group();
  const hullColor = wreck ? 0x5a4636 : C.woodDark;

  const hull = new THREE.ExtrudeGeometry(hullShape(), {
    depth: 1.4,
    bevelEnabled: true,
    bevelSize: 0.12,
    bevelThickness: 0.12,
    bevelSegments: 1,
    steps: 1,
  });
  hull.rotateX(-Math.PI / 2);
  add(g, hull, hullColor);

  const deckGeo = new THREE.ShapeGeometry(hullShape());
  deckGeo.rotateX(-Math.PI / 2);
  add(g, deckGeo, wreck ? 0x7a6249 : C.woodLight, {
    y: 1.54,
    sx: 0.86,
    sz: 0.8,
    matOpts: { side: THREE.DoubleSide },
  });

  // Faixa de acabamento e janelas de canhão
  [-2.2, -0.6, 1.0].forEach((x) => {
    const z = 1.3 + ((x + 4) / 5.5) * 0.6 + 0.07;
    [-1, 1].forEach((side) =>
      add(g, new THREE.BoxGeometry(0.5, 0.4, 0.1), C.black, { x, y: 0.85, z: z * side })
    );
  });

  if (!wreck) {
    add(g, new THREE.BoxGeometry(2, 1.1, 2.8), C.wood, { x: -3, y: 2.1 });
    add(g, new THREE.BoxGeometry(2.1, 0.18, 2.9), C.woodLight, { x: -3, y: 2.7 });

    // Mastros e velas
    add(g, new THREE.CylinderGeometry(0.13, 0.17, 7.6, 6), C.woodDark, { x: -0.4, y: 5.2 });
    add(g, new THREE.CylinderGeometry(0.11, 0.15, 6, 6), C.woodDark, { x: 2.2, y: 4.5 });
    add(g, new THREE.BoxGeometry(0.1, 3, 3.6), C.cream, { x: -0.25, y: 4.2 });
    add(g, new THREE.BoxGeometry(0.1, 2, 2.6), C.cream, { x: -0.25, y: 6.9 });
    add(g, new THREE.BoxGeometry(0.1, 2.6, 3), C.cream, { x: 2.35, y: 4 });
    add(g, new THREE.BoxGeometry(0.16, 0.16, 3.8), C.woodDark, { x: -0.25, y: 5.75 });

    const flag = createJollyRoger(1.6, 1.0);
    flag.position.set(-0.4, 8.6, 0);
    flag.rotation.y = Math.PI / 2;
    g.add(flag);
    g.userData.flag = flag;

    add(g, new THREE.CylinderGeometry(0.1, 0.12, 2.4, 5), C.woodDark, { x: 4.9, y: 1.9, rz: -1.15 });
    add(g, new THREE.SphereGeometry(0.22, 6, 4), C.yellow, {
      x: -4.05,
      y: 2.4,
      matOpts: { emissive: C.yellow, emissiveIntensity: 0.8 },
    });
  } else {
    // Naufrágio: mastro quebrado, costelas do casco e vela rasgada
    add(g, new THREE.CylinderGeometry(0.12, 0.17, 3.4, 6), 0x5a4636, { x: -0.4, y: 3.1, rz: 0.22 });
    add(g, new THREE.BoxGeometry(0.08, 1.8, 1.9), C.cream, { x: -0.2, y: 3.2, rz: 0.22, rx: 0.25 });
    [-2.8, -1.4, 0, 1.4].forEach((x, i) => {
      [-1, 1].forEach((side) => {
        if ((i + (side > 0 ? 1 : 0)) % 3 === 0) return;
        add(g, new THREE.BoxGeometry(0.22, 1.6 + (i % 2) * 0.5, 0.2), 0x5a4636, {
          x,
          y: 2.3,
          z: side * (1.35 + ((x + 4) / 5.5) * 0.5),
          rx: side * 0.12,
        });
      });
    });
  }
  return g;
}

/* ------------------------------------------------------------------ */
/* Entrada: píer e portão                                              */
/* ------------------------------------------------------------------ */

/** Píer de madeira que se estende para +x local. */
export function createPier(length = 8) {
  const g = new THREE.Group();
  const plank = new THREE.BoxGeometry(0.85, 0.14, 2.9);
  const n = Math.floor(length / 0.95);
  for (let i = 0; i < n; i++) {
    add(g, plank, i % 2 ? C.wood : C.woodLight, { x: i * 0.95 + 0.5 });
  }
  [-1.1, 1.1].forEach((z) =>
    add(g, new THREE.BoxGeometry(length, 0.2, 0.25), C.woodDark, { x: length / 2, y: -0.17, z })
  );
  for (let x = 1.5; x < length; x += 3.4) {
    [-1.55, 1.55].forEach((z) => {
      add(g, new THREE.CylinderGeometry(0.17, 0.2, 3.2, 6), C.woodDark, { x, z, y: -0.9 });
      add(g, new THREE.SphereGeometry(0.2, 6, 4), C.woodLight, { x, z, y: 0.72 });
    });
  }
  return g;
}

/** Portão da entrada dos inimigos. O caminho passa pelo eixo x local. */
export function createGate() {
  const g = new THREE.Group();
  [-2.5, 2.5].forEach((z) => {
    add(g, new THREE.CylinderGeometry(0.26, 0.3, 4.4, 7), C.woodDark, { y: 2.2, z });
    add(g, new THREE.SphereGeometry(0.3, 6, 4), C.yellow, {
      y: 4.7,
      z,
      matOpts: { emissive: C.orange, emissiveIntensity: 0.9 },
    });
  });
  add(g, new THREE.BoxGeometry(0.5, 0.45, 6), C.wood, { y: 4.3 });
  add(g, new THREE.BoxGeometry(0.4, 0.3, 5.4), C.woodDark, { y: 3.7 });

  [1, -1].forEach((side) => {
    const skull = createSkull(0.95);
    skull.position.set(0.32 * side, 4.3, 0);
    skull.rotation.y = (Math.PI / 2) * side;
    g.add(skull);
  });

  [-1.5, 1.5].forEach((z) =>
    add(g, new THREE.BoxGeometry(0.08, 1.6, 0.9), C.red, { y: 3.2, z })
  );
  return g;
}

/* ------------------------------------------------------------------ */
/* Acampamento e objetos                                               */
/* ------------------------------------------------------------------ */

export function createBarrel() {
  const g = new THREE.Group();
  add(g, new THREE.CylinderGeometry(0.5, 0.5, 0.95, 9), C.wood, { y: 0.48 });
  [0.2, 0.75].forEach((y) =>
    add(g, new THREE.CylinderGeometry(0.53, 0.53, 0.09, 9), C.woodDark, { y })
  );
  return g;
}

export function createCrate(size = 0.9) {
  const g = new THREE.Group();
  add(g, new THREE.BoxGeometry(size, size, size), C.woodLight, { y: size / 2 });
  [0.02, size - 0.02].forEach((y) =>
    add(g, new THREE.BoxGeometry(size * 1.04, 0.1, size * 1.04), C.woodDark, { y })
  );
  return g;
}

export function createTent() {
  const g = new THREE.Group();
  add(g, new THREE.ConeGeometry(1.7, 2, 4), C.cream, { y: 1, ry: Math.PI / 4 });
  add(g, new THREE.ConeGeometry(0.76, 0.85, 4), C.red, { y: 1.575, ry: Math.PI / 4 });
  add(g, new THREE.CylinderGeometry(0.05, 0.05, 1, 5), C.woodDark, { y: 2.4 });
  add(g, new THREE.BoxGeometry(0.5, 0.28, 0.04), C.red, { x: 0.25, y: 2.7 });
  return g;
}

export function createCampfire() {
  const g = new THREE.Group();
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    add(g, new THREE.IcosahedronGeometry(0.22, 0), i % 2 ? C.rock : C.rockDark, {
      x: Math.cos(a) * 0.75,
      z: Math.sin(a) * 0.75,
      y: 0.15,
    });
  }
  [0, Math.PI / 2, Math.PI / 4, -Math.PI / 4].forEach((a) =>
    add(g, new THREE.BoxGeometry(1.1, 0.18, 0.18), C.woodDark, { y: 0.2, ry: a, rz: 0.08 })
  );
  const flames = [
    add(g, new THREE.ConeGeometry(0.38, 0.95, 5), C.orange, {
      y: 0.65,
      cast: false,
      matOpts: { emissive: C.orange, emissiveIntensity: 1 },
    }),
    add(g, new THREE.ConeGeometry(0.22, 0.6, 5), C.yellow, {
      y: 0.55,
      cast: false,
      matOpts: { emissive: C.yellow, emissiveIntensity: 1 },
    }),
  ];
  const light = new THREE.PointLight(0xff9a3c, 14, 10, 2);
  light.position.y = 1.1;
  g.add(light);
  g.userData.flames = flames;
  g.userData.light = light;
  return g;
}

/** Bandeiras que balançam ficam em userData.flag. */
export function createFlagPole(height = 3.2) {
  const g = new THREE.Group();
  add(g, new THREE.CylinderGeometry(0.07, 0.09, height, 6), C.woodDark, { y: height / 2 });
  add(g, new THREE.SphereGeometry(0.13, 6, 4), C.gold, { y: height + 0.05 });
  const flag = createJollyRoger(1.7, 1.1);
  flag.position.set(0.05, height - 0.75, 0);
  g.add(flag);
  g.userData.flag = flag;
  return g;
}

/* ------------------------------------------------------------------ */
/* Base (final do caminho)                                             */
/* ------------------------------------------------------------------ */

function createChest() {
  const g = new THREE.Group();
  add(g, new THREE.BoxGeometry(1.6, 0.8, 1.1), C.wood, { y: 0.4 });
  [-0.5, 0.5].forEach((x) => add(g, new THREE.BoxGeometry(0.14, 0.84, 1.14), C.gold, { x, y: 0.4 }));
  add(g, new THREE.SphereGeometry(0.7, 8, 5), C.gold, {
    y: 0.78,
    sx: 1.05,
    sy: 0.38,
    sz: 0.75,
    matOpts: { emissive: C.gold, emissiveIntensity: 0.3 },
  });
  add(g, new THREE.IcosahedronGeometry(0.16, 0), C.red, {
    x: 0.3,
    y: 1.02,
    z: 0.1,
    matOpts: { emissive: C.red, emissiveIntensity: 0.5 },
  });
  add(g, new THREE.IcosahedronGeometry(0.14, 0), C.blue, {
    x: -0.35,
    y: 1.0,
    z: 0.15,
    matOpts: { emissive: C.blue, emissiveIntensity: 0.5 },
  });

  // Tampa aberta, articulada na borda de trás
  const lid = new THREE.Group();
  lid.position.set(0, 0.8, -0.55);
  lid.rotation.x = -1.25;
  g.add(lid);
  add(lid, new THREE.BoxGeometry(1.6, 0.16, 1.1), C.woodLight, { y: 0.08, z: 0.55 });
  [-0.5, 0.5].forEach((x) =>
    add(lid, new THREE.BoxGeometry(0.14, 0.2, 1.14), C.gold, { x, y: 0.09, z: 0.55 })
  );
  return g;
}

function createCannon() {
  const g = new THREE.Group();
  add(g, new THREE.BoxGeometry(1.5, 0.3, 0.8), C.woodDark, { y: 0.45 });
  [-0.5, 0.5].forEach((z) =>
    add(g, new THREE.CylinderGeometry(0.35, 0.35, 0.12, 10), C.wood, { y: 0.35, z: z * 0.95, rx: Math.PI / 2 })
  );
  // Boca do canhão aponta para -x (na direção do caminho)
  add(g, new THREE.CylinderGeometry(0.28, 0.38, 1.7, 10), C.black, { y: 0.78, rz: Math.PI / 2 });
  add(g, new THREE.TorusGeometry(0.3, 0.06, 5, 10), C.stoneDark, { x: -0.8, y: 0.78, ry: Math.PI / 2 });
  return g;
}

/** Base do jogador: plataforma de pedra com torre, tesouro e canhões. Origem no chão. */
export function createBase() {
  const g = new THREE.Group();

  // Plataforma e degraus (entrada pelo lado -x)
  add(g, new THREE.CylinderGeometry(3.9, 4.1, 0.4, 12), C.stone, { y: 0.2 });
  add(g, new THREE.CylinderGeometry(3.45, 3.45, 0.06, 12), C.stoneLight, { y: 0.41 });
  add(g, new THREE.BoxGeometry(0.8, 0.2, 2.6), C.stoneDark, { x: -4.3, y: 0.1 });
  add(g, new THREE.BoxGeometry(0.7, 0.4, 2.6), C.stone, { x: -3.75, y: 0.2 });

  // Torre com bandeira
  const tower = new THREE.Group();
  tower.position.set(1.4, 0.4, -1.5);
  g.add(tower);
  add(tower, new THREE.CylinderGeometry(1.25, 1.45, 4.4, 9), C.stone, { y: 2.2 });
  add(tower, new THREE.CylinderGeometry(1.5, 1.5, 0.25, 9), C.wood, { y: 3.0 });
  add(tower, new THREE.BoxGeometry(0.45, 0.8, 0.2), C.black, { x: 0, y: 2.0, z: 1.38 });
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    add(tower, new THREE.BoxGeometry(0.55, 0.5, 0.5), C.stoneDark, {
      x: Math.cos(a) * 1.3,
      z: Math.sin(a) * 1.3,
      y: 4.65,
      ry: -a,
    });
  }
  const pole = createFlagPole(3);
  pole.position.y = 4.4;
  tower.add(pole);
  g.userData.flag = pole.userData.flag;

  // Tesouro
  const chest = createChest();
  chest.position.set(0.3, 0.4, 1.9);
  chest.rotation.y = -0.25;
  g.add(chest);

  const coinGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.05, 8);
  const coinPos = [
    [-0.9, 2.2], [-1.3, 1.6], [1.5, 2.6], [1.9, 1.7], [-0.4, 3.0], [0.9, 3.0],
    [-1.6, 2.7], [2.2, 2.4], [-1.1, 1.0], [1.2, 1.2],
  ];
  coinPos.forEach(([x, z], i) =>
    add(g, coinGeo, C.gold, {
      x,
      z,
      y: 0.46,
      ry: i,
      rz: (i % 3) * 0.12,
      matOpts: { emissive: C.gold, emissiveIntensity: 0.25 },
    })
  );

  // Canhões voltados para o caminho
  const c1 = createCannon();
  c1.position.set(-2.3, 0.4, -2.5);
  c1.rotation.y = 0.2;
  const c2 = createCannon();
  c2.position.set(-2.3, 0.4, 3.0);
  c2.rotation.y = -0.2;
  g.add(c1, c2);
  const ballGeo = new THREE.SphereGeometry(0.2, 6, 4);
  [[-1.4, -3.3], [-1.0, -3.0], [-1.7, -3.0], [-1.2, 3.9], [-0.8, 3.7]].forEach(([x, z]) =>
    add(g, ballGeo, C.black, { x, z, y: 0.6 })
  );

  const glow = new THREE.PointLight(0xffd36a, 22, 12, 2);
  glow.position.set(0.3, 2, 1.9);
  g.add(glow);
  g.userData.glow = glow;

  return g;
}


export function createTomb(rng) {
  const g = new THREE.Group(), c = pick(rng, [C.rock, C.rockDark, C.rockLight]);
  add(g, new THREE.BoxGeometry(0.9, 1.2, 0.3), c, { y: 0.6 });
  add(g, new THREE.CylinderGeometry(0.45, 0.45, 0.3, 8), c, { y: 1.2, rx: Math.PI / 2 });
  add(g, new THREE.BoxGeometry(1.2, 0.12, 1.6), C.rockDark, { y: 0.06, z: 0.7 });
  g.rotation.z = rand(rng, -0.1, 0.1);
  return g;
}
export function createCross(rng) {
  const g = new THREE.Group();
  add(g, new THREE.BoxGeometry(0.14, 1.6, 0.14), C.woodDark, { y: 0.8 });
  add(g, new THREE.BoxGeometry(0.8, 0.14, 0.14), C.woodDark, { y: 1.2 });
  g.rotation.set(rand(rng, -0.15, 0.15), 0, rand(rng, -0.2, 0.2));
  return g;
}
export function createDeadTree(rng, s = 1) {
  const g = new THREE.Group();
  add(g, new THREE.CylinderGeometry(0.12, 0.28, 3, 5), C.woodDark, { y: 1.5, rz: rand(rng, -0.1, 0.1) });
  for (let i = 0; i < 4; i++)
    add(g, new THREE.BoxGeometry(1.3, 0.1, 0.1), C.woodDark, { y: 1.7 + i * 0.35, ry: i * 1.6 + rng(), rz: rand(rng, 0.4, 1) });
  g.rotation.y = rng() * 6;
  g.scale.setScalar(s);
  return g;
}
export function createBones(rng) {
  const g = new THREE.Group();
  const s = createSkull(0.5); s.position.y = 0.25; s.rotation.y = rng() * 6; g.add(s);
  const b = createCrossbones(0.6); b.position.set(0.9, 0.08, 0.4); b.rotation.x = -Math.PI / 2; g.add(b);
  return g;
}
export function createPillar(rng) {
  const g = new THREE.Group(), h = rand(rng, 1.4, 3.2);
  add(g, new THREE.BoxGeometry(1.2, 0.3, 1.2), C.stoneDark, { y: 0.15 });
  add(g, new THREE.CylinderGeometry(0.45, 0.5, h, 7), C.stone, { y: h / 2 + 0.3, rz: rand(rng, -0.05, 0.05) });
  [0, 1].forEach(() => add(g, G.rock, C.stoneDark, { x: rand(rng, -1, 1), z: rand(rng, -1, 1), y: 0.15, sx: 0.3, sy: 0.2, sz: 0.3 }));
  return g;
}
export function createVolcano(s = 1) {
  const g = new THREE.Group();
  add(g, new THREE.CylinderGeometry(1.8, 6.5, 9, 9), C.rockDark, { y: 4.5 });
  add(g, new THREE.CylinderGeometry(1.6, 1.7, 0.3, 9), 0xff5a1c, { y: 8.9, cast: false, matOpts: { emissive: 0xff4a10, emissiveIntensity: 1.2 } });
  const l = new THREE.PointLight(0xff6a20, 40, 30, 2); l.position.y = 10; g.add(l);
  g.scale.setScalar(s);
  return g;
}
export function createFortTower(s = 1) {
  const g = new THREE.Group();
  add(g, new THREE.BoxGeometry(3.6, 3, 3.6), C.stoneDark, { y: -0.2 });
  add(g, new THREE.BoxGeometry(3, 6, 3), C.stone, { y: 3.5 });
  add(g, new THREE.BoxGeometry(3.5, 0.4, 3.5), C.stoneLight, { y: 6.7 });
  [[-1.5,-1.5],[1.5,-1.5],[-1.5,1.5],[1.5,1.5],[0,-1.6],[0,1.6],[-1.6,0],[1.6,0]].forEach(([x, z]) =>
    add(g, new THREE.BoxGeometry(0.7, 0.8, 0.7), C.stoneDark, { x, y: 7.3, z }));
  add(g, new THREE.BoxGeometry(0.5, 0.9, 0.1), C.black, { y: 4, z: 1.52 });
  const f = createFlagPole(2.4); f.position.y = 7.1; g.add(f);
  g.scale.setScalar(s);
  return g;
}
export function createWall(len) {
  const g = new THREE.Group();
  add(g, new THREE.BoxGeometry(len, 3.2, 1.2), C.stone, { y: 1.1 });
  for (let x = -len / 2 + 0.5; x < len / 2; x += 1.4) add(g, new THREE.BoxGeometry(0.7, 0.7, 1.2), C.stoneDark, { x, y: 3.05 });
  return g;
}
export function createTentacle(rng, s = 1) {
  const g = new THREE.Group(), segs = [], phase = rng() * 6, bend = rand(rng, 0.1, 0.3);
  let parent = g;
  for (let i = 0; i < 6; i++) {
    const seg = new THREE.Group(); seg.position.y = i ? 1 : 0; parent.add(seg);
    add(seg, new THREE.CylinderGeometry(0.42 - i * 0.06, 0.48 - i * 0.06, 1.05, 6), i % 2 ? 0x8a4fb0 : 0x7a3fa0, { y: 0.5 });
    if (i < 4) add(seg, G.coconut, 0xe8b4f0, { x: 0.4 - i * 0.05, y: 0.5 });
    segs.push(seg); parent = seg;
  }
  g.scale.setScalar(s);
  g.userData.update = (t) => segs.forEach((sg, i) => (sg.rotation.z = bend + Math.sin(t * 1.3 + phase + i * 0.6) * 0.22));
  return g;
}
export function createKraken(rng) {
  const g = new THREE.Group(), ts = [];
  const head = add(g, new THREE.SphereGeometry(3, 8, 6), 0x7a3fa0, { y: 3, sy: 1.2 });
  [-1, 1].forEach((z) => add(g, new THREE.SphereGeometry(0.5, 6, 4), C.yellow, { x: 2.7, y: 3.6, z: z * 1.2, matOpts: { emissive: C.yellow, emissiveIntensity: 1 } }));
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2, t = createTentacle(rng, 1.6);
    t.position.set(Math.cos(a) * 2.4, 0, Math.sin(a) * 2.4); t.rotation.y = -a; g.add(t); ts.push(t);
  }
  g.userData.update = (t) => { ts.forEach((x) => x.userData.update(t)); head.position.y = 3 + Math.sin(t) * 0.1; };
  return g;
}
