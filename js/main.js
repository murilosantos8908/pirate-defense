import * as THREE from 'three';
import { CAMERA, MAP } from './config.js';
import { setupLighting } from './lighting.js';
import { buildIslandMap } from './map.js';
import { CameraRig } from './camera.js';
import { EnemyManager } from './enemies.js';
import { DefenderManager } from './defenders.js';
import { WaveManager, rewardForKill, MAX_WAVES } from './waves.js';

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

/* ---------- Vida da base ---------- */
const BASE_MAX_HP = 20;
let baseHp = BASE_MAX_HP;
let gameOver = false;
let money = 0;

const style = document.createElement('style');
style.textContent = `
  .base-hp{position:fixed;top:max(14px,env(safe-area-inset-top));left:50%;transform:translateX(-50%);
    min-width:220px;padding:8px 14px;background:rgba(15,42,67,.88);border:3px solid #ffc83d;border-radius:14px;
    box-shadow:0 5px 0 rgba(0,0,0,.22);font-size:16px;color:#ffc83d;pointer-events:none;text-align:center}
  .base-hp-track{margin-top:6px;height:12px;background:#1a1a24;border-radius:8px;overflow:hidden}
  .base-hp-fill{height:100%;width:100%;background:#4cd964;transition:width .25s ease,background .25s ease}
  .base-hp.hit{animation:basehit .3s}
  @keyframes basehit{0%,100%{transform:translateX(-50%)}25%{transform:translateX(calc(-50% - 6px))}75%{transform:translateX(calc(-50% + 6px))}}
  .game-over{position:fixed;left:50%;top:42%;transform:translate(-50%,-50%);padding:22px 30px;text-align:center;
    background:#0f2a43;border:3px solid #ff5a4f;border-radius:16px;font-size:28px;color:#fff4d6}
  .game-over button{margin-top:14px;pointer-events:auto}
  @media (max-width:900px){.base-hp{top:64px}}
`;
document.head.appendChild(style);

const hpBox = document.createElement('div');
hpBox.className = 'base-hp';
hpBox.hidden = true;
hpBox.innerHTML = '<div class="base-hp-text"></div><div class="base-hp-track"><div class="base-hp-fill"></div></div>';
document.body.appendChild(hpBox);
const hpText = hpBox.querySelector('.base-hp-text');
const hpFill = hpBox.querySelector('.base-hp-fill');

const overBox = document.createElement('div');
overBox.className = 'game-over';
overBox.hidden = true;
overBox.innerHTML = '<span class="over-message">Sua base foi destruída!</span><br><button class="btn btn-primary" type="button">Tentar de novo</button>';
document.body.appendChild(overBox);

function renderBaseHp() {
  const r = baseHp / BASE_MAX_HP;
  hpText.textContent = `Base: ${baseHp} / ${BASE_MAX_HP}`;
  hpFill.style.width = `${r * 100}%`;
  hpFill.style.background = r > 0.5 ? '#4cd964' : r > 0.25 ? '#ffd23d' : '#ff4b3e';
}

function damageBase(amount) {
  if (gameOver) return;
  baseHp = Math.max(0, baseHp - amount);
  renderBaseHp();
  hpBox.classList.remove('hit');
  void hpBox.offsetWidth;
  hpBox.classList.add('hit');
  if (baseHp <= 0) {
    gameOver = true;
    overBox.hidden = false;
    waves.fail();
  }
}

/* ---------- Inimigos ---------- */
const enemies = new EnemyManager(scene, map, {
  onBaseHit: (damage, enemy) => { damageBase(damage); waves.resolveEnemy(enemy); },
  onKill: (enemy) => { money += rewardForKill(enemy); waves.resolveEnemy(enemy); renderMoney(); },
});
function renderMoney() { $('hud-money').textContent = money; }
const waves = new WaveManager({
  enemies,
  onReward: (amount) => { money += amount; renderMoney(); },
  onChange: (s) => {
    $('hud-wave').textContent = s.number;
    $('hud-enemies').textContent = s.remaining;
    $('btn-wave').disabled = s.state !== 'ready' || s.number >= MAX_WAVES;
    $('btn-wave').textContent = s.state === 'intermission' ? `Próxima wave em ${s.seconds}s` : 'Iniciar Wave';
    $('hud-wave-status').textContent = ({ ready: 'Wave pronta', spawning: 'Inimigos chegando…', active: 'Derrote os inimigos!', intermission: 'Wave concluída!', victory: 'Vitória!' })[s.state] || '';
  },
  onVictory: () => { gameOver = true; overBox.querySelector('.over-message').textContent = 'Vitória! Você defendeu a base!'; overBox.hidden = false; },
});
const defenders = new DefenderManager({ scene, camera, dom: renderer.domElement, map, enemies });

function resetRound() {
  enemies.clear();
  defenders.clear();
  baseHp = BASE_MAX_HP;
  gameOver = false;
  overBox.hidden = true;
  money = 0;
  renderMoney();
  waves.reset();
  overBox.querySelector('.over-message').textContent = 'Sua base foi destruída!';
  renderBaseHp();
}
overBox.querySelector('button').addEventListener('click', resetRound);
renderBaseHp();

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
  hpBox.hidden = false;
  resetRound();
  defenders.setEnabled(true);
  rig.setMenuMode(false);
  rig.reset(true);
}

function backToMenu() {
  inGame = false;
  $('hud').hidden = true;
  hpBox.hidden = true;
  overBox.hidden = true;
  enemies.clear();
  defenders.setEnabled(false);
  defenders.clear();
  $('menu').hidden = false;
  rig.setMenuMode(true);
}

$('btn-start').addEventListener('click', startGame);
$('btn-wave').addEventListener('click', () => waves.startNext());
$('btn-recenter').addEventListener('click', () => rig.reset(true));
$('btn-menu').addEventListener('click', backToMenu);
window.addEventListener('keydown', (e) => {
  if (e.code === 'Escape' && inGame) {
    if (!defenders.cancel()) backToMenu();
  } else if (e.code === 'Digit1' && inGame && !gameOver) {
    defenders.togglePlacing('sailor');
  } else if ((e.code === 'Enter' || e.code === 'Space') && !inGame && document.activeElement === document.body) {
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
  if (inGame && !gameOver) {
    waves.update(dt);
    enemies.update(dt, t, camera);
    defenders.update(dt, t);
  }
  updateLabels();
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
frame();

window.__pirate = { scene, camera, renderer, map, rig, MAP, enemies };
