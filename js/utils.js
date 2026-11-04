import * as THREE from 'three';

const materials = new Map();

/** Material de cor sólida com visual "cartoon" (flat shading), reaproveitado por cor/opções. */
export function mat(color, opts = {}) {
  const key = color + '|' + JSON.stringify(opts);
  let m = materials.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.85,
      metalness: 0,
      flatShading: true,
      ...opts,
    });
    materials.set(key, m);
  }
  return m;
}

/**
 * Cria uma malha, aplica posição/rotação/escala e adiciona ao pai.
 * Opções: x y z rx ry rz sx sy sz cast receive matOpts material
 */
export function add(parent, geometry, color, o = {}) {
  const m = new THREE.Mesh(geometry, o.material || mat(color, o.matOpts));
  m.position.set(o.x ?? 0, o.y ?? 0, o.z ?? 0);
  m.rotation.set(o.rx ?? 0, o.ry ?? 0, o.rz ?? 0);
  m.scale.set(o.sx ?? 1, o.sy ?? 1, o.sz ?? 1);
  m.castShadow = o.cast ?? true;
  m.receiveShadow = o.receive ?? true;
  parent.add(m);
  return m;
}

/** Gerador pseudoaleatório com semente (o mapa fica sempre igual). */
export function makeRng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const rand = (rng, a, b) => a + rng() * (b - a);
export const pick = (rng, list) => list[Math.floor(rng() * list.length)];
