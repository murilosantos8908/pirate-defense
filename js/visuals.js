import * as THREE from 'three';
import { COLORS as C } from './config.js';

/* Texturas procedurais em tons de cinza (multiplicam a cor do material). Sem arquivos externos. */
const cache = {};
function canvasTex(key, size, draw) {
  if (cache[key]) return cache[key];
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  draw(g, size);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return (cache[key] = t);
}
const shade = (v) => `rgb(${v},${v},${v})`;
let seed = 7;
const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

const grain = () => canvasTex('grain', 128, (g, s) => {
  g.fillStyle = shade(235); g.fillRect(0, 0, s, s);
  for (let i = 0; i < 900; i++) { g.fillStyle = shade(205 + r() * 50 | 0); g.fillRect(r() * s, r() * s, 2 + r() * 4, 2 + r() * 4); }
});
const wood = () => canvasTex('wood', 128, (g, s) => {
  g.fillStyle = shade(240); g.fillRect(0, 0, s, s);
  for (let i = 0; i < 40; i++) { g.fillStyle = shade(190 + r() * 55 | 0); g.fillRect(r() * s, 0, 1 + r() * 3, s); }
  for (let i = 0; i < 6; i++) { g.fillStyle = shade(170); g.beginPath(); g.ellipse(r() * s, r() * s, 3, 6, 0, 0, 7); g.fill(); }
});
const stone = () => canvasTex('stone', 128, (g, s) => {
  g.fillStyle = shade(238); g.fillRect(0, 0, s, s);
  for (let i = 0; i < 60; i++) { g.fillStyle = shade(190 + r() * 60 | 0); g.beginPath(); g.arc(r() * s, r() * s, 3 + r() * 10, 0, 7); g.fill(); }
  g.strokeStyle = shade(170); g.lineWidth = 1;
  for (let i = 0; i < 8; i++) { g.beginPath(); g.moveTo(r() * s, r() * s); g.lineTo(r() * s, r() * s); g.stroke(); }
});

const WOOD = new Set([C.wood, C.woodDark, C.woodLight, C.trunk, C.trunkDark]);
const STONE = new Set([C.rock, C.rockDark, C.rockLight, C.stone, C.stoneDark, C.stoneLight]);
const done = new WeakSet();

function upgrade(m) {
  if (done.has(m) || !m.isMeshStandardMaterial) return;
  done.add(m);
  if (m.transparent || m.emissiveIntensity > 0.5 && m.emissive.getHex() !== 0) return; // não mexe em brilhos/vidros
  const hex = m.color.getHex();
  if (WOOD.has(hex)) { m.map = wood(); m.bumpMap = wood(); m.bumpScale = 0.6; m.roughness = 0.8; }
  else if (STONE.has(hex)) { m.map = stone(); m.bumpMap = stone(); m.bumpScale = 0.9; m.roughness = 0.9; }
  else if (hex === C.gold) { m.metalness = 0.35; m.roughness = 0.35; }
  else { m.map = grain(); }
  m.needsUpdate = true;
}

/** Aplica texturas leves e ajustes de material em tudo que está sob `root` (só visual). */
export function polish(root) {
  root.traverse((o) => {
    if (!o.isMesh || !o.geometry.attributes.uv) return;
    (Array.isArray(o.material) ? o.material : [o.material]).forEach(upgrade);
  });
}

/** Sombras mais suaves e luz de preenchimento levemente mais fria. */
export function polishLights({ sun, hemi }) {
  sun.shadow.radius = 3;
  sun.shadow.mapSize.set(2048, 2048);
  hemi.intensity *= 1.0;
}
