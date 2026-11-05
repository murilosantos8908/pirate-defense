import * as THREE from 'three';
import { DEFENDER_TYPES } from './defenders.js';

const SIZE = 256;
const FILES = {
  sailor: 'marinheiro', parrot: 'papagaio', musketeer: 'mosqueteiro', cannoneer: 'canhoneiro',
  captain: 'capitao', markswoman: 'atiradora', seawitch: 'bruxa-do-mar', skeleton: 'esqueleto-pirata',
  brute: 'brutamontes', ghostcaptain: 'capitao-fantasma', admiral: 'almirante-dourado', poseidon: 'poseidon-pirata',
};
const cache = new Map();
let r, scene, cam;

function init() {
  if (r) return true;
  try {
    r = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
  } catch { return false; }
  r.setSize(SIZE, SIZE);
  r.setPixelRatio(1);
  r.setClearColor(0x000000, 0);
  scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xcfeeff, 0x7fae5a, 1.8));
  const sun = new THREE.DirectionalLight(0xfff1d0, 2.4);
  sun.position.set(3, 5, 4);
  scene.add(sun);
  cam = new THREE.PerspectiveCamera(28, 1, 0.1, 50);
  return true;
}

/** PNG (dataURL) quadrado, fundo transparente, personagem centralizado. null se sem WebGL. */
export function iconUrl(id) {
  if (cache.has(id)) return cache.get(id);
  const def = DEFENDER_TYPES[id];
  if (!def || !init()) return null;
  const root = new THREE.Group();
  const model = new THREE.Group();
  root.add(model);
  const rig = def.build(model, 3);
  rig.pose(-1);
  model.rotation.y = -0.6;
  scene.add(root);
  const box = new THREE.Box3().setFromObject(root);
  const c = box.getCenter(new THREE.Vector3());
  const s = box.getSize(new THREE.Vector3());
  const d = (Math.max(s.y, s.x, s.z) * 0.62) / Math.tan(THREE.MathUtils.degToRad(14));
  cam.position.set(c.x + d * 0.45, c.y + s.y * 0.12, c.z + d * 0.9);
  cam.lookAt(c);
  r.render(scene, cam);
  const url = r.domElement.toDataURL('image/png');
  scene.remove(root);
  cache.set(id, url);
  return url;
}

/** Salva os PNGs em arquivo: no console do navegador, rode __icons() */
export function downloadIcons(ids = Object.keys(DEFENDER_TYPES)) {
  ids.forEach((id, i) => setTimeout(() => {
    const a = document.createElement('a');
    a.href = iconUrl(id);
    a.download = `${FILES[id] || id}.png`;
    a.click();
  }, i * 250));
}
window.__icons = downloadIcons;
