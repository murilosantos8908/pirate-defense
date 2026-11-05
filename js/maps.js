import * as THREE from 'three';
import { COLORS, MAP } from './config.js';

const BASE_COLORS = { ...COLORS };
const BASE_MAP = { ...MAP };
export function applyTheme(i) {
  const t = MAPS[i];
  Object.assign(COLORS, BASE_COLORS, t.colors);
  Object.assign(MAP, BASE_MAP, t.map, { name: t.name });
}
const CAMP = { campPosition: { x: -6, z: -14 }, markPosition: { x: 11, z: -12 } };
const BASE = { basePosition: { x: 21, z: 0 } };

export const MAPS = [
  { // 1 – original
    id: 'island', name: 'Ilha dos Náufragos', note: 'Aventura tropical. Boss: Capitão Amaldiçoado.',
    colors: {}, map: {},
    light: { sky: 0x9fdcf2, fog: [110, 240], hemi: [0xcfeeff, 0x7fae5a, 1.6], sun: [0xfff1d0, 2.6] },
    roster: { basic: 'crab', tough: 'slime', boss: 'cursedCaptain' },
    fx: [{ color: 0xfff3b0, count: 40, size: 0.15, rise: 0.4 }],
  },
  { // 2
    id: 'graveyard', name: 'Cemitério dos Piratas', note: 'Névoa, túmulos e mortos-vivos.',
    colors: { sky: 0x5b6d80, sea: 0x2b4a5e, foam: 0xbcc8d0, grass: 0x5d7a55, grassDark: 0x4a6347, grassTuft: 0x3f5a3e,
      grassSide: 0x4a3a2c, sand: 0x8d8a78, sandDark: 0x6e6b5c, path: 0x9a9585, pathEdge: 0x6f6a5c, pathStone: 0xb5b09f, leaf: 0x5a6b45, leafLight: 0x6d7a50 },
    map: { ...BASE, waypoints: [[-27,-9],[-19,-10],[-12,-6],[-14,2],[-8,8],[0,10],[6,6],[2,0],[-2,-4],[6,-8],[13,-6],[12,0],[17.5,0.3]],
      campPosition: { x: -4, z: 15 }, markPosition: { x: 10, z: -14 } },
    light: { sky: 0x5b6d80, fog: [40, 130], hemi: [0x8fa4c0, 0x3a4a40, 0.9], sun: [0xa9bfe0, 1.1] },
    roster: { basic: 'skeleton', tough: 'ghost', boss: null },
    dead: true, trees: [7, 4], noCamp: true,
    fx: [{ color: 0xbfd0e0, count: 60, size: 1.4, rise: 0.15, opacity: 0.16, area: [70, 6, 50] },
         { color: 0x9affc8, count: 25, size: 0.25, rise: 0.5, area: [50, 8, 36] }],
    deco({ world, rng, add, scatter, updaters, GY, M }) {
      const put = (o, x, z, y = GY) => { o.position.set(x, y, z); o.rotation.y = rng() * 6.28; world.add(o); };
      scatter(26, { rMin: .15, rMax: .95, spacing: 2, pathClear: 1.6 }, (x, z) => put(rng() < .6 ? M.createTomb(rng) : M.createCross(rng), x, z));
      scatter(8, { rMin: .2, rMax: .95, spacing: 1.8, pathClear: 1.2 }, (x, z) => put(M.createBones(rng), x, z, GY + .02));
      scatter(6, { rMin: .2, rMax: .9, spacing: 3.5, pathClear: 2 }, (x, z) => put(M.createPillar(rng), x, z));
      const lamps = [];
      scatter(5, { rMin: .2, rMax: .9, spacing: 6, pathClear: 2.5 }, (x, z) => {
        const l = new THREE.PointLight(0x7dffb0, 12, 9, 2); l.position.set(x, 1.4, z); world.add(l); lamps.push(l);
        add(world, new THREE.SphereGeometry(.18, 6, 4), 0x7dffb0, { x, y: 1.4, z, cast: false, matOpts: { emissive: 0x7dffb0, emissiveIntensity: 1.2 } });
      });
      updaters.push((t) => lamps.forEach((l, i) => (l.intensity = 12 + Math.sin(t * 3 + i * 2) * 4)));
    },
  },
  { // 3
    id: 'volcano', name: 'Vulcão Perdido', note: 'Lava, cinzas e calor. Boss: Titã de Lava.',
    colors: { sky: 0x3a1d1a, sea: 0xff5a1c, foam: 0xffb347, grass: 0x4a4442, grassDark: 0x3a3534, grassTuft: 0x2f2a29,
      grassSide: 0x2a2220, sand: 0x3b3330, sandDark: 0x2a2321, path: 0x6b5a4e, pathEdge: 0x3e312a, pathStone: 0x8a7565,
      rock: 0x4a4650, rockDark: 0x2d2a33, rockLight: 0x6a6470, leaf: 0x5a3a2a, leafLight: 0x6a4a30, bush: 0x6a3a22 },
    map: { ...BASE, waypoints: [[-27,-10],[-18,-11],[-10,-12],[-6,-6],[-14,-1],[-16,6],[-8,12],[0,11],[2,4],[8,-2],[4,-8],[11,-10],[16,-6],[17.5,0.3]],
      campPosition: { x: -4, z: 16 }, markPosition: { x: 8, z: 15 } },
    light: { sky: 0x3a1d1a, fog: [60, 170], hemi: [0xff9a5a, 0x3a1a10, 1.0], sun: [0xff7a3a, 1.6] },
    roster: { basic: 'magmaling', tough: 'obsidian', boss: 'lavaTitan' },
    dead: true, trees: [6, 0], noCamp: true, noShips: true,
    seaOpts: { emissive: 0xff4a10, emissiveIntensity: 0.8 },
    fx: [{ color: 0x999999, count: 120, size: 0.12, rise: 0.8, area: [60, 25, 40] },
         { color: 0xff7a2a, count: 80, size: 0.2, rise: 2.2, area: [50, 20, 36] }],
    deco({ world, rng, rand, add, mat, scatter, reserved, updaters, GY, M }) {
      const v = M.createVolcano(1.3); v.position.set(-8, GY - 0.2, -22); world.add(v);
      reserved.push({ x: -8, z: -22, r: 9 });
      const lava = mat(0xff5a1c, { emissive: 0xff4a10, emissiveIntensity: 1 });
      const lights = [];
      scatter(9, { rMin: .2, rMax: .9, spacing: 5, pathClear: 2.6 }, (x, z) => {
        add(world, new THREE.CircleGeometry(rand(rng, 1.1, 2.3), 9), 0xff5a1c, { material: lava, x, y: GY + .02, z, rx: -Math.PI / 2, cast: false });
        if (lights.length < 3) { const l = new THREE.PointLight(0xff7a2a, 14, 10, 2); l.position.set(x, 1, z); world.add(l); lights.push(l); }
      });
      scatter(12, { rMin: .2, rMax: .95, spacing: 3, pathClear: 2 }, (x, z) =>
        add(world, new THREE.BoxGeometry(rand(rng, 2, 4.5), .05, .22), 0xff5a1c, { material: lava, x, y: GY + .03, z, ry: rng() * 3, cast: false }));
      scatter(5, { rMin: .2, rMax: .9, spacing: 3.5, pathClear: 2 }, (x, z) => { const p = M.createPillar(rng); p.position.set(x, GY, z); world.add(p); });
      updaters.push((t) => { lava.emissiveIntensity = 0.8 + Math.sin(t * 2) * 0.25; lights.forEach((l, i) => (l.intensity = 14 + Math.sin(t * 4 + i) * 4)); });
    },
  },
  { // 4
    id: 'kraken', name: 'Fortaleza do Kraken', note: 'Confronto final. Boss: Kraken.',
    colors: { sky: 0x7a9bb8, sea: 0x1a4f7a, foam: 0xcfe8f5, grass: 0x8a8f99, grassDark: 0x767b86, grassTuft: 0x6a707b,
      grassSide: 0x555a63, sand: 0x6f7580, sandDark: 0x4f545e, path: 0xb8b2a2, pathEdge: 0x7a746a, pathStone: 0xd6d0c0, rock: 0x7c828d },
    map: { ...BASE, waypoints: [[-27,12],[-14,12],[-14,5],[-2,5],[-2,-5],[8,-5],[8,9],[16,9],[17.5,0.3]],
      campPosition: { x: -6, z: -15 }, markPosition: { x: 10, z: -14 } },
    light: { sky: 0x7a9bb8, fog: [90, 220], hemi: [0xbcd6ee, 0x4a5a70, 1.3], sun: [0xffe6c0, 2.2] },
    roster: { basic: 'deepling', tough: 'obsidian', boss: 'kraken' },
    trees: [0, 0], noCamp: true,
    fx: [{ color: 0xffffff, count: 50, size: 0.18, rise: 0.6, opacity: 0.6, area: [60, 8, 40] }],
    deco({ world, rng, scatter, updaters, GY, WY, M, RX, RZ, islandRadius, startP, gateP, gn, MAP }) {
      const b = MAP.basePosition;
      const far = (x, z) => Math.hypot(x - startP.x, z - startP.z) > 9 && Math.hypot(x - b.x, z - b.z) > 9;
      const N = 16, pts = [];
      for (let i = 0; i < N; i++) { const a = (i / N) * Math.PI * 2, r = islandRadius(a) * 1.1; pts.push([Math.cos(a) * RX * r, Math.sin(a) * RZ * r]); }
      pts.forEach(([x, z], i) => {
        if (!far(x, z)) return;
        const t = M.createFortTower(); t.position.set(x, GY - .3, z); world.add(t);
        const [x2, z2] = pts[(i + 1) % N];
        if (!far(x2, z2)) return;
        const w = M.createWall(Math.hypot(x2 - x, z2 - z));
        w.position.set((x + x2) / 2, GY - .3, (z + z2) / 2);
        w.rotation.y = Math.atan2(-(z2 - z), x2 - x);
        world.add(w);
      });
      [-1, 1].forEach((s) => { const t = M.createFortTower(1.5); t.position.set(gateP.x + gn.x * s * 5.5, GY - .3, gateP.z + gn.z * s * 5.5); world.add(t); });
      [[-40, -14, .4], [-12, -33, 2.2], [40, 18, 1]].forEach(([x, z, ry]) => {
        const w = M.createShip({ wreck: true }); w.position.set(x, WY - .75, z); w.rotation.set(.1, ry, .25); world.add(w);
      });
      const k = M.createKraken(rng); k.position.set(47, WY, -4); world.add(k); updaters.push(k.userData.update);
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2 + .3, r = islandRadius(a) * 1.33, x = Math.cos(a) * RX * r, z = Math.sin(a) * RZ * r;
        if (!far(x, z) || x > 30) continue;
        const t = M.createTentacle(rng, 1.6); t.position.set(x, WY, z); t.rotation.y = -a; world.add(t); updaters.push(t.userData.update);
      }
      scatter(10, { rMin: .3, rMax: .9, spacing: 2, pathClear: 1.5 }, (x, z) => {
        const o = rng() < .5 ? M.createBarrel() : M.createCrate(1); o.position.set(x, GY, z); o.rotation.y = rng() * 6; world.add(o);
      });
    },
  },
];