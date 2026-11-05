import * as THREE from 'three';
import { COLORS as C, MAP } from './config.js';
import { mat, add, makeRng, rand } from './utils.js';
import * as M from './models.js';
import { createFx } from './fx.js';

const { radiusX: RX, radiusZ: RZ, groundY: GY, pathY: PY, pathWidth: PW, waterY: WY } = MAP;

/* ------------------------------------------------------------------ */
/* Forma da ilha                                                       */
/* ------------------------------------------------------------------ */

/** Raio relativo da ilha para um ângulo (1 = elipse perfeita). Dá o contorno irregular. */
export function islandRadius(theta) {
  return (
    1 +
    0.07 * Math.sin(3 * theta + 0.6) +
    0.045 * Math.sin(5 * theta + 2.1) +
    0.03 * Math.sin(8 * theta + 4.0)
  );
}

/** Posição relativa dentro da ilha: 0 = centro, 1 = borda da grama, ~1.17 = borda da areia. */
export function islandRho(x, z) {
  const nx = x / RX;
  const nz = z / RZ;
  return Math.hypot(nx, nz) / islandRadius(Math.atan2(nz, nx));
}

function islandGeometry(scale, depth, topY) {
  const shape = new THREE.Shape();
  const N = 96;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    const r = islandRadius(a) * scale;
    const x = Math.cos(a) * RX * r;
    const z = Math.sin(a) * RZ * r;
    if (i === 0) shape.moveTo(x, -z);
    else shape.lineTo(x, -z);
  }
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: false,
    curveSegments: 1,
    steps: 1,
  });
  geo.rotateX(-Math.PI / 2); // a profundidade da extrusão vira altura
  geo.translate(0, topY - depth, 0);
  return geo;
}

/* ------------------------------------------------------------------ */
/* Caminho                                                             */
/* ------------------------------------------------------------------ */

function ribbonMesh(curve, width, y, color, segments = 260) {
  const pos = [];
  const nor = [];
  const idx = [];
  for (let i = 0; i <= segments; i++) {
    const u = i / segments;
    const p = curve.getPointAt(u);
    const t = curve.getTangentAt(u);
    const len = Math.hypot(t.x, t.z) || 1;
    const ox = ((-t.z / len) * width) / 2;
    const oz = ((t.x / len) * width) / 2;
    pos.push(p.x + ox, y, p.z + oz, p.x - ox, y, p.z - oz);
    nor.push(0, 1, 0, 0, 1, 0);
    if (i < segments) {
      const a = i * 2;
      idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  geo.setIndex(idx);
  const mesh = new THREE.Mesh(geo, mat(color, { side: THREE.DoubleSide }));
  mesh.receiveShadow = true;
  return mesh;
}

/* ------------------------------------------------------------------ */
/* Mapa completo                                                       */
/* ------------------------------------------------------------------ */

export function buildIslandMap(scene, theme = {}) {
  const rng = makeRng(20241104);
  const world = new THREE.Group();
  world.name = MAP.name;
  scene.add(world);

  const updaters = [];

  /* ---------- Mar ---------- */
  const seaGeo = new THREE.PlaneGeometry(170, 170, 68, 68);
  seaGeo.rotateX(-Math.PI / 2);
  const seaPos = seaGeo.attributes.position;
  const seaBase = Float32Array.from(seaPos.array);
  const sea = new THREE.Mesh(seaGeo, mat(C.sea, { roughness: 0.55, ...theme.seaOpts }));
  sea.position.y = WY;
  sea.receiveShadow = true;
  world.add(sea);

  const farSea = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), mat(C.sea, { roughness: 0.55, ...theme.seaOpts }));
  farSea.rotation.x = -Math.PI / 2;
  farSea.position.y = WY - 0.02;
  world.add(farSea);

  updaters.push((t) => {
    const arr = seaPos.array;
    for (let i = 0; i < arr.length; i += 3) {
      const x = seaBase[i];
      const z = seaBase[i + 2];
      const r = Math.hypot(x, z);
      const fade = 1 - THREE.MathUtils.smoothstep(r, 45, 82); // sem ondas na borda
      arr[i + 1] =
        (Math.sin(x * 0.22 + t * 1.1) * 0.1 +
          Math.cos(z * 0.27 + t * 0.9) * 0.08 +
          Math.sin((x + z) * 0.12 + t * 0.7) * 0.06) *
        fade;
    }
    seaPos.needsUpdate = true;
  });

  /* ---------- Ilha: espuma, areia e grama ---------- */
  const foam = new THREE.Mesh(
    islandGeometry(1.27, 0.02, WY + 0.15),
    mat(C.foam, { transparent: true, opacity: 0.55, depthWrite: false })
  );
  world.add(foam);
  updaters.push((t) => {
    const s = 1 + Math.sin(t * 1.3) * 0.012;
    foam.scale.set(s, 1, s);
  });

  const sand = new THREE.Mesh(islandGeometry(1.17, 1.6, GY - 0.02), [mat(C.sand), mat(C.sandDark)]);
  sand.receiveShadow = true;
  world.add(sand);

  const grass = new THREE.Mesh(islandGeometry(1, 1.4, GY), [mat(C.grass), mat(C.grassSide)]);
  grass.receiveShadow = true;
  grass.castShadow = true;
  world.add(grass);

  /* ---------- Caminho de areia com curvas ---------- */
  const curve = new THREE.CatmullRomCurve3(
    MAP.waypoints.map(([x, z]) => new THREE.Vector3(x, PY, z)),
    false,
    'centripetal'
  );
  const pathSamples = curve.getSpacedPoints(320);
  const distToPath = (x, z) => {
    let best = Infinity;
    for (const p of pathSamples) {
      const d = Math.hypot(p.x - x, p.z - z);
      if (d < best) best = d;
    }
    return best;
  };

  world.add(ribbonMesh(curve, PW + 0.8, PY - 0.015, C.pathEdge));
  world.add(ribbonMesh(curve, PW, PY, C.path));

  // Pedrinhas claras no meio do caminho
  {
    const geo = new THREE.DodecahedronGeometry(1, 0);
    const inst = new THREE.InstancedMesh(geo, mat(C.pathStone), 80);
    const d = new THREE.Object3D();
    for (let i = 0; i < 80; i++) {
      const u = rng();
      const p = curve.getPointAt(u);
      const t = curve.getTangentAt(u);
      const off = rand(rng, -PW * 0.32, PW * 0.32);
      d.position.set(p.x - t.z * off, PY + 0.02, p.z + t.x * off);
      d.rotation.set(0, rng() * 6.28, 0);
      d.scale.set(rand(rng, 0.25, 0.5), 0.07, rand(rng, 0.2, 0.4));
      d.updateMatrix();
      inst.setMatrixAt(i, d.matrix);
    }
    inst.receiveShadow = true;
    world.add(inst);
  }

  /* ---------- Entrada dos inimigos ---------- */
  const startP = curve.getPointAt(0);
  const startT = curve.getTangentAt(0);
  const entrancePosition = new THREE.Vector3(startP.x, GY, startP.z);

  // Plataforma de surgimento (pulsa em vermelho)
  const padMat = mat(C.red, { emissive: C.red, emissiveIntensity: 0.6 });
  const pad = add(world, new THREE.CylinderGeometry(1.25, 1.25, 0.08, 24), C.red, {
    material: padMat,
    x: startP.x,
    z: startP.z,
    y: PY + 0.04,
  });
  const padRing = add(world, new THREE.TorusGeometry(1.5, 0.09, 6, 28), C.gold, {
    x: startP.x,
    z: startP.z,
    y: PY + 0.08,
    rx: Math.PI / 2,
  });
  updaters.push((t) => {
    padMat.emissiveIntensity = 0.5 + Math.sin(t * 3) * 0.3;
    const s = 1 + Math.sin(t * 3) * 0.04;
    pad.scale.set(s, 1, s);
    padRing.scale.set(s, s, 1);
  });

  // Portão logo depois da plataforma
  const gateU = 0.05;
  const gateP = curve.getPointAt(gateU);
  const gateT = curve.getTangentAt(gateU);
  const gate = M.createGate();
  gate.position.set(gateP.x, GY, gateP.z);
  gate.rotation.y = Math.atan2(-gateT.z, gateT.x);
  world.add(gate);

  // Píer e navio atracado
  const pier = M.createPier(8);
  pier.position.set(startP.x - startT.x * 1.5, 0.52, startP.z - startT.z * 1.5);
  pier.rotation.y = Math.atan2(startT.z, -startT.x);
  world.add(pier);

  const ship = M.createShip();
  ship.position.set(startP.x - 8.5, WY - 0.1, startP.z + 7 * (Math.sign(startP.z) || 1));
  ship.rotation.y = 0.12;
  if (!theme.noShips) world.add(ship);
  updaters.push((t) => {
    ship.position.y = WY - 0.1 + Math.sin(t * 1.2) * 0.07;
    ship.rotation.z = Math.sin(t * 0.9) * 0.015;
    if (ship.userData.flag) ship.userData.flag.rotation.y = Math.PI / 2 + Math.sin(t * 2.2) * 0.15;
  });

  // Barris e caixotes perto do portão
  const gn = new THREE.Vector3(-gateT.z, 0, gateT.x).normalize();
  const crateSpot = (k, off, extra = 0) => ({
    x: gateP.x + gn.x * (PW / 2 + off) + extra,
    z: gateP.z + gn.z * (PW / 2 + off),
  });
  [
    [crateSpot(0, 2.6), 0],
    [crateSpot(0, 3.9, 0.4), 1.2],
  ].forEach(([p, ry], i) => {
    const o = i === 0 ? M.createBarrel() : M.createCrate(1);
    o.position.set(p.x, GY, p.z);
    o.rotation.y = ry;
    world.add(o);
  });
  {
    const p = crateSpot(0, 2.6, 1.4);
    const b = M.createBarrel();
    b.position.set(p.x, GY, p.z);
    world.add(b);
    const q = { x: gateP.x - gn.x * (PW / 2 + 2.8), z: gateP.z - gn.z * (PW / 2 + 2.8) };
    const c1 = M.createCrate(1);
    c1.position.set(q.x, GY, q.z);
    c1.rotation.y = 0.4;
    const c2 = M.createCrate(0.8);
    c2.position.set(q.x + 0.2, GY + 1, q.z);
    c2.rotation.y = -0.3;
    world.add(c1, c2);
  }

  /* ---------- Base no final do caminho ---------- */
  const base = M.createBase();
  base.position.set(MAP.basePosition.x, GY, MAP.basePosition.z);
  world.add(base);
  const basePosition = new THREE.Vector3(MAP.basePosition.x, GY, MAP.basePosition.z);
  updaters.push((t) => {
    if (base.userData.flag) base.userData.flag.rotation.y = Math.sin(t * 2.2) * 0.18;
    if (base.userData.glow) base.userData.glow.intensity = 22 + Math.sin(t * 5) * 3;
  });

  /* ---------- Decoração da ilha ---------- */
  const reserved = [
    { x: gateP.x, z: gateP.z, r: 5 },
    { x: startP.x, z: startP.z, r: 4.5 },
    { x: MAP.basePosition.x, z: MAP.basePosition.z, r: 6.2 },
    { x: MAP.campPosition.x, z: MAP.campPosition.z, r: 3.6 },
    { x: MAP.markPosition.x, z: MAP.markPosition.z, r: 2.6 },
  ];
  const placed = [];

  const isFree = (x, z, spacing, pathClear) => {
    if (distToPath(x, z) < PW / 2 + pathClear) return false;
    if (reserved.some((r) => Math.hypot(x - r.x, z - r.z) < r.r)) return false;
    return !placed.some((p) => Math.hypot(x - p.x, z - p.z) < spacing + p.r);
  };

  /** Sorteia posições livres dentro da ilha. rho: fração do raio (1 = fim da grama). */
  const scatter = (count, { rMin, rMax, spacing, pathClear }, fn) => {
    for (let i = 0; i < count; i++) {
      for (let tries = 0; tries < 80; tries++) {
        const a = rng() * Math.PI * 2;
        const rho = rand(rng, rMin, rMax);
        const r = islandRadius(a) * rho;
        const x = Math.cos(a) * RX * r;
        const z = Math.sin(a) * RZ * r;
        if (!isFree(x, z, spacing, pathClear)) continue;
        placed.push({ x, z, r: spacing / 2 });
        fn(x, z);
        break;
      }
    }
  };

  theme.deco?.({ world, rng, rand, add, mat, M, scatter, reserved, updaters, curve, startP, gateP, gn, GY, WY, RX, RZ, MAP, islandRadius });

  // Manchas de grama mais escura
  for (let i = 0; i < 14; i++) {
    const a = rng() * Math.PI * 2;
    const r = islandRadius(a) * rand(rng, 0.1, 0.85);
    const patch = new THREE.Mesh(new THREE.CircleGeometry(rand(rng, 1.4, 3.2), 7), mat(C.grassDark));
    patch.rotation.set(-Math.PI / 2, 0, rng() * 6);
    patch.position.set(Math.cos(a) * RX * r, GY + 0.012, Math.sin(a) * RZ * r);
    patch.receiveShadow = true;
    world.add(patch);
  }

  const Tree = theme.dead ? M.createDeadTree : M.createPalm;
  const [nIn, nOut] = theme.trees ?? [18, 8];
  scatter(nIn, { rMin: 0.25, rMax: 0.98, spacing: 3.6, pathClear: 2.4 }, (x, z) => {
    const p = Tree(rng, rand(rng, 0.9, 1.35)); p.position.set(x, GY, z); world.add(p);
  });
  scatter(nOut, { rMin: 1.03, rMax: 1.12, spacing: 5, pathClear: 2.4 }, (x, z) => {
    const p = Tree(rng, rand(rng, 1, 1.3)); p.position.set(x, GY - 0.02, z); world.add(p);
  });

  // Rochas
  scatter(14, { rMin: 0.3, rMax: 1.1, spacing: 2.2, pathClear: 1.5 }, (x, z) => {
    const rock = M.createRock(rng, rand(rng, 0.5, 1.3));
    rock.position.set(x, GY - 0.05, z);
    world.add(rock);
  });
  scatter(3, { rMin: 0.4, rMax: 0.95, spacing: 4, pathClear: 2.2 }, (x, z) => {
    const rock = M.createRock(rng, rand(rng, 1.6, 2.1));
    rock.position.set(x, GY - 0.1, z);
    world.add(rock);
  });

  // Arbustos
  scatter(18, { rMin: 0.15, rMax: 0.95, spacing: 1.8, pathClear: 1.5 }, (x, z) => {
    const bush = M.createBush(rng, rand(rng, 0.8, 1.3));
    bush.position.set(x, GY - 0.05, z);
    world.add(bush);
  });

  // Rochas no mar, ao redor da ilha (longe do píer)
  const entranceAngle = Math.atan2(startP.z / RZ, startP.x / RX);
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2 + rand(rng, -0.1, 0.1);
    const diff = Math.abs(Math.atan2(Math.sin(a - entranceAngle), Math.cos(a - entranceAngle)));
    if (diff < 0.4) continue;
    const r = islandRadius(a) * rand(rng, 1.24, 1.42);
    const rock = M.createRock(rng, rand(rng, 0.8, 1.7));
    rock.position.set(Math.cos(a) * RX * r, WY - 0.1, Math.sin(a) * RZ * r);
    world.add(rock);
  }

  // Pedrinhas nas bordas do caminho
  {
    const geo = new THREE.DodecahedronGeometry(0.17, 0);
    const n = 90;
    const inst = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ flatShading: true, roughness: 0.9 }), n);
    const d = new THREE.Object3D();
    const col = new THREE.Color();
    const tones = [C.rock, C.rockDark, C.rockLight];
    for (let i = 0; i < n; i++) {
      const u = rng();
      const p = curve.getPointAt(u);
      const t = curve.getTangentAt(u);
      const side = rng() < 0.5 ? -1 : 1;
      const off = side * (PW / 2 + 0.4 + rng() * 0.6);
      d.position.set(p.x - t.z * off, GY + 0.05, p.z + t.x * off);
      d.rotation.set(rng() * 3, rng() * 3, rng() * 3);
      d.scale.setScalar(rand(rng, 0.6, 1.4));
      d.updateMatrix();
      inst.setMatrixAt(i, d.matrix);
      inst.setColorAt(i, col.set(tones[i % 3]));
    }
    inst.castShadow = true;
    world.add(inst);
  }

  // Tufos de grama e flores
  const placeInstanced = (geo, count, colors, y, scaleRange, minPathClear) => {
    const inst = new THREE.InstancedMesh(
      geo,
      new THREE.MeshStandardMaterial({ flatShading: true, roughness: 0.9 }),
      count
    );
    const d = new THREE.Object3D();
    const col = new THREE.Color();
    let n = 0;
    for (let tries = 0; tries < count * 6 && n < count; tries++) {
      const a = rng() * Math.PI * 2;
      const r = islandRadius(a) * rand(rng, 0.05, 0.96);
      const x = Math.cos(a) * RX * r;
      const z = Math.sin(a) * RZ * r;
      if (distToPath(x, z) < PW / 2 + minPathClear) continue;
      if (reserved.some((q) => Math.hypot(x - q.x, z - q.z) < q.r - 0.8)) continue;
      d.position.set(x, y, z);
      d.rotation.set(0, rng() * 6, 0);
      d.scale.setScalar(rand(rng, scaleRange[0], scaleRange[1]));
      d.updateMatrix();
      inst.setMatrixAt(n, d.matrix);
      inst.setColorAt(n, col.set(colors[n % colors.length]));
      n++;
    }
    inst.count = n;
    world.add(inst);
  };
  placeInstanced(new THREE.ConeGeometry(0.09, 0.55, 4), 380, [C.grassTuft, C.leaf, C.grassDark], GY + 0.2, [0.7, 1.4], 0.5);
  placeInstanced(new THREE.IcosahedronGeometry(0.11, 0), 80, [C.red, C.yellow, C.white, 0xff8fc7, C.blue], GY + 0.08, [0.8, 1.2], 0.6);

  // Marca do tesouro: X vermelho no chão
  {
    const x = new THREE.Group();
    x.position.set(MAP.markPosition.x, GY + 0.07, MAP.markPosition.z);
    [Math.PI / 4, -Math.PI / 4].forEach((a) =>
      add(x, new THREE.BoxGeometry(2.4, 0.1, 0.38), C.red, { ry: a, cast: false })
    );
    world.add(x);
  }

  // Acampamento dos náufragos
  if (!theme.noCamp) {
    const cx = MAP.campPosition.x;
    const cz = MAP.campPosition.z;
    const tent = M.createTent();
    tent.position.set(cx - 1.3, GY, cz - 0.4);
    tent.rotation.y = 0.5;
    world.add(tent);

    const fire = M.createCampfire();
    fire.position.set(cx + 1.6, GY, cz + 0.9);
    world.add(fire);
    updaters.push((t) => {
      const [outer, inner] = fire.userData.flames;
      outer.scale.set(1 + Math.sin(t * 9) * 0.1, 1 + Math.sin(t * 11) * 0.18, 1 + Math.sin(t * 9) * 0.1);
      inner.scale.set(1, 1 + Math.sin(t * 13 + 1) * 0.22, 1);
      fire.userData.light.intensity = 14 + Math.sin(t * 12) * 3;
    });

    const b1 = M.createBarrel();
    b1.position.set(cx - 0.2, GY, cz + 2);
    const b2 = M.createBarrel();
    b2.position.set(cx - 1.1, GY, cz + 2.6);
    const cr = M.createCrate(0.9);
    cr.position.set(cx - 3.2, GY, cz + 1.2);
    cr.rotation.y = 0.5;
    world.add(b1, b2, cr);
  }

  // Naufrágio no mar, perto da praia sul
  const wreck = M.createShip({ wreck: true });
  wreck.position.set(-9, WY - 0.75, 26);
  wreck.rotation.set(0.12, 0.6, 0.28);
  if (!theme.noShips) world.add(wreck);
  updaters.push((t) => {
    wreck.position.y = WY - 0.75 + Math.sin(t * 1.0) * 0.05;
  });

  /* ---------- Nuvens ---------- */
  const clouds = [];
  const cloudMat = mat(0xffffff, { emissive: 0xffffff, emissiveIntensity: 0.35, roughness: 1 });
  for (let i = 0; i < 9; i++) {
    const c = new THREE.Group();
    const puffs = 4 + Math.floor(rng() * 3);
    for (let k = 0; k < puffs; k++) {
      const s = rand(rng, 2.2, 4);
      const puff = new THREE.Mesh(new THREE.IcosahedronGeometry(s, 0), cloudMat);
      puff.position.set(k * 3.2 - puffs * 1.6, rand(rng, -0.5, 0.8), rand(rng, -1.5, 1.5));
      puff.scale.y = 0.65;
      c.add(puff);
    }
    const a = rng() * Math.PI * 2;
    const dist = rand(rng, 55, 110);
    c.position.set(Math.cos(a) * dist, rand(rng, 26, 38), Math.sin(a) * dist);
    c.userData.speed = rand(rng, 0.6, 1.4);
    world.add(c);
    clouds.push(c);
  }
  updaters.push((t, dt) => {
    for (const c of clouds) {
      c.position.x += c.userData.speed * dt;
      if (c.position.x > 130) c.position.x = -130;
    }
  });

  for (const f of theme.fx || []) updaters.push(createFx(world, f));

  return {
    name: MAP.name,
    group: world,
    curve,
    pathLength: curve.getLength(),
    entrancePosition,
    basePosition,
    /** Local válido para defensor: na grama, longe do caminho, das zonas reservadas e da decoração. */
    canBuild(x, z) {
      return (
        islandRho(x, z) < 0.92 &&
        distToPath(x, z) > PW / 2 + 0.9 &&
        !reserved.some((r) => Math.hypot(x - r.x, z - r.z) < r.r) &&
        !placed.some((p) => Math.hypot(x - p.x, z - p.z) < p.r + 0.7)
      );
    },
    update(t, dt) {
      for (const fn of updaters) fn(t, dt);
    },
  };
}
