import * as THREE from 'three';
import { CAMERA, MAP } from './config.js';
import { setupLighting } from './lighting.js';
import { buildIslandMap } from './map.js';
import { CameraRig } from './camera.js';

const $ = (id) => document.getElementById(id);

function showError(message) {
  const box = $('error');
  box.textContent = message;
  box.hidden = false;
  $('menu').hidden = true;
}

/* ---------- Renderizador ---------- */
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
} catch (err) {
  showError('Seu navegador não conseguiu iniciar o WebGL. Ative a aceleração de hardware ou tente outro navegador.');
  throw err;
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
$('app').appendChild(renderer.domElement);

/* ---------- Cena, câmera, luzes e mapa ---------- */
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  CAMERA.fov,
  window.innerWidth / window.innerHeight,
  CAMERA.near,
  CAMERA.far
);
setupLighting(scene);
const map = buildIslandMap(scene);
const rig = new CameraRig(camera, renderer.domElement);
rig.setMenuMode(true);

/* ---------- Etiquetas 3D (Entrada / Base) ---------- */
const labels = [
  { el: $('label-entrance'), pos: map.entrancePosition.clone().add(new THREE.Vector3(0, 5.6, 0)) },
  { el: $('label-base'), pos: map.basePosition.clone().add(new THREE.Vector3(1.4, 8.4, -1.5)) },
];
const tmp = new THREE.Vector3();
function updateLabels() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  for (const l of labels) {
    tmp.copy(l.pos).project(camera);
    const inFront = tmp.z < 1;
    l.el.style.visibility = inFront && inGame ? 'visible' : 'hidden';
    if (inFront && inGame) {
      // Prende a etiqueta dentro da tela (abaixo do topo do HUD e acima da ajuda)
      const halfW = l.el.offsetWidth / 2 + 8;
      const x = THREE.MathUtils.clamp((tmp.x * 0.5 + 0.5) * w, halfW, w - halfW);
      const y = THREE.MathUtils.clamp((-tmp.y * 0.5 + 0.5) * h, 90, h - 90);
      l.el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%)`;
    }
  }
}

/* ---------- Interface ---------- */
let inGame = false;

function startGame() {
  inGame = true;
  $('menu').hidden = true;
  $('hud').hidden = false;
  rig.setMenuMode(false);
  rig.reset(true);
}

function backToMenu() {
  inGame = false;
  $('hud').hidden = true;
  $('menu').hidden = false;
  rig.setMenuMode(true);
}

$('btn-start').addEventListener('click', startGame);
$('btn-recenter').addEventListener('click', () => rig.reset(true));
$('btn-menu').addEventListener('click', backToMenu);
window.addEventListener('keydown', (e) => {
  if (e.code === 'Escape' && inGame) backToMenu();
  else if ((e.code === 'Enter' || e.code === 'Space') && !inGame && document.activeElement === document.body) {
    e.preventDefault();
    startGame();
  }
});

/* ---------- Redimensionamento ---------- */
function onResize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', onResize);

/* ---------- Loop principal ---------- */
const clock = new THREE.Clock();
function frame() {
  const dt = Math.min(clock.getDelta(), 0.1);
  const t = clock.elapsedTime;
  map.update(t, dt);
  rig.update(dt);
  updateLabels();
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
frame();

// Facilita testes e as próximas etapas
window.__pirate = { scene, camera, renderer, map, rig, MAP };
