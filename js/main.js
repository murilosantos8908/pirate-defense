import * as THREE from 'three';
import { CAMERA, MAP } from './config.js';
import { setupLighting, tuneLighting } from './lighting.js';
import { buildIslandMap } from './map.js';
import { CameraRig } from './camera.js';
import { EnemyManager, ENEMY_TYPES } from './enemies.js';
import { DefenderManager } from './defenders.js';
import { Meta, MAX_TEAM } from './collections.js';
import { createShopUi } from './shop.js';
import { WaveManager, rewardForKill, MAX_WAVES } from './waves.js';
import { MAPS, applyTheme } from './maps.js';

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
const lights = setupLighting(scene);
let mapIndex = 0;
let map;
function loadMap(i) {
  if (map) scene.remove(map.group);
  mapIndex = i;
  applyTheme(i);
  tuneLighting(lights, scene, MAPS[i].light);
  map = buildIslandMap(scene, MAPS[i]);
}
loadMap(0);
const rig = new CameraRig(camera, renderer.domElement);
rig.setMenuMode(true);

/* ---------- Vida da base ---------- */
let baseMax = 20;
let baseHp = baseMax;
let gameOver = false;
let money = 250;
let run = { kills: 0, bosses: 0, coins: 0 };
let announced = 0;
const testCodes = { money: false, levels: false };
let defenders = null;
const meta = new Meta();
let shop = null;
let rewarded = false;

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
const bossBox = document.createElement('div');
bossBox.className = 'boss-bar'; bossBox.hidden = true;
bossBox.innerHTML = '<div class="boss-name"></div><div class="boss-track"><div class="boss-fill"></div></div>';
document.body.appendChild(bossBox);
const bossName = bossBox.querySelector('.boss-name'); const bossFill = bossBox.querySelector('.boss-fill');

const overBox = document.createElement('div');
overBox.className = 'game-over';
overBox.hidden = true;
overBox.innerHTML = '<span class="over-message">Sua base foi destruída!</span><br><button class="btn btn-primary" type="button">Tentar de novo</button>';
document.body.appendChild(overBox);

function renderBaseHp() {
  const r = baseHp / baseMax;
  hpText.textContent = `Base: ${baseHp} / ${baseMax}`;
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
    waves.fail();
    endRound(false);
  }
}

/* ---------- Inimigos ---------- */
const enemies = new EnemyManager(scene, map, {
  onBaseHit: (damage, enemy) => { damageBase(damage); waves.resolveEnemy(enemy); },
  onKill: (enemy) => {
    const reward = rewardForKill(enemy);
    money += reward;
    meta.addCoins(reward);
    run.kills++; run.coins += reward;
    if (enemy.def.boss) { run.bosses++; toast(`👻 ${enemy.def.name} derrotado!`); }
    waves.resolveEnemy(enemy);
    renderMoney();
    renderMenuCoins();
    shop?.refresh();
  },
});
function renderMoney() {
  $('hud-money').textContent = testCodes.money ? '∞' : money;
  if (defenders?.selected) defenders.refreshInfo();
}
function payMoney(amount) {
  if (testCodes.money) return true;
  if (money < amount) return false;
  money -= amount;
  renderMoney();
  return true;
}
function refundMoney(amount) {
  if (testCodes.money) return;
  money += amount;
  renderMoney();
}
const waves = new WaveManager({
  enemies,
  onReward: (amount) => {
    money += amount;
    meta.addCoins(amount);
    run.coins += amount;
    renderMoney();
    renderMenuCoins();
    shop?.refresh();
  },
  onChange: (s) => {
    $('hud-wave').textContent = s.number;
    $('hud-enemies').textContent = s.remaining;
    $('btn-wave').disabled = s.state !== 'ready' || s.number >= MAX_WAVES;
    $('btn-wave').textContent = s.state === 'intermission' ? `Próxima wave em ${s.seconds}s` : 'Iniciar Wave';
    $('hud-wave-status').textContent = ({ ready: 'Wave pronta', spawning: 'Inimigos chegando…', active: 'Derrote os inimigos!', intermission: 'Wave concluída!', victory: 'Vitória!' })[s.state] || '';
    if (s.state === 'spawning' && s.number === MAX_WAVES && MAPS[mapIndex].roster.boss && announced !== s.number) {
      announced = s.number;
      toast(`⚠️ CHEFE: ${ENEMY_TYPES[MAPS[mapIndex].roster.boss].name}!`);
    }
  },
  onVictory: () => {
    gameOver = true;
    endRound(true);
  },
});
waves.roster = MAPS[mapIndex].roster;
defenders = new DefenderManager({
  scene, camera, dom: renderer.domElement, map, enemies,
  getMoney: () => money,
  pay: payMoney,
  refund: refundMoney,
});
defenders.setTeam(meta.teamEntries());
shop = createShopUi(meta, {
  onTeamChange: () => defenders.setTeam(meta.teamEntries()),
  getCodeStatus: () => ({ money: testCodes.money, levels: testCodes.levels }),
  onCodeSubmit: (raw) => {
    const code = raw.trim().toLowerCase();
    if (code === 'dinheiro') { testCodes.money = true; renderMoney(); return 'Código dinheiro ativado: compras da partida gratuitas.'; }
    if (code === 'niveis') { testCodes.levels = true; return 'Código niveis ativado: seleção de wave liberada.'; }
    return 'Código inválido.';
  },
  onWaveSelect: (number) => {
    if (!testCodes.levels) return 'Ative o código niveis primeiro.';
    if (!inGame) return 'Entre na ilha para iniciar uma wave.';
    if (!waves.startWave(number)) return 'Aguarde a partida ficar pronta para iniciar outra wave.';
    shop.close(); return `Iniciando a wave ${number}.`;
  },
});
shop.refresh();
const picker = $('map-picker');
MAPS.forEach((m, i) => {
  const b = document.createElement('button');
  b.className = 'btn btn-small'; b.type = 'button'; b.textContent = `${i + 1}. ${m.name}`;
  b.onclick = () => selectMap(i);
  picker.appendChild(b);
});
function selectMap(i) {
  waves.roster = MAPS[i].roster;
  if (i !== mapIndex) {
    loadMap(i);
    enemies.map = map;
    defenders.map = map;
    resetRound();
    rig.reset(false);
    if (window.__pirate) window.__pirate.map = map;
  }
  [...picker.children].forEach((b, k) => b.classList.toggle('active', k === i));
  document.querySelector('.map-card-name').textContent = MAPS[i].name;
  document.querySelector('.map-card-note').textContent = MAPS[i].note;
  $('hud-map-name').textContent = MAPS[i].name;
}
selectMap(0);

function renderMenuCoins() {
  $('menu-coins').textContent = `🪙 ${meta.coins}`;
}

function toast(text) {
  const el = document.createElement('div'); el.className = 'toast'; el.textContent = text;
  document.body.appendChild(el); setTimeout(() => el.remove(), 3200);
}

function endRound(victory) {
  if (rewarded) return;
  rewarded = true;
  const gain = waves.number * 15 + (victory ? 100 : 0) + run.bosses * 300;
  meta.addCoins(gain);
  if (run.bosses) meta.grantCopy('musketeer');
  meta.recordRun({ victory, wave: waves.number, kills: run.kills, bosses: run.bosses });
  renderMenuCoins();
  shop?.refresh();
  overBox.classList.toggle('win', victory);
  overBox.innerHTML = `<h2>${victory ? '🏆 Vitória!' : '☠️ Derrota'}</h2><p>${victory ? 'Você defendeu a ilha!' : 'Sua base foi destruída!'}</p>
    <dl class="res"><dt>Wave alcançada</dt><dd>${waves.number} / ${MAX_WAVES}</dd><dt>Inimigos derrotados</dt><dd>${run.kills}</dd>
    <dt>Chefes derrotados</dt><dd>${run.bosses}</dd><dt>Moedas na partida</dt><dd>${run.coins} 🪙</dd><dt>Bônus final</dt><dd>+${gain} 🪙</dd>
    ${run.bosses ? '<dt>Recompensa do chefe</dt><dd>+1 cópia Mosqueteiro</dd>' : ''}</dl>
    <div class="res-actions"><button class="btn btn-primary" data-act="again" type="button">Jogar de novo</button><button class="btn btn-small" data-act="menu" type="button">Menu</button></div>`;
  overBox.hidden = false;
}

function resetRound() {
  enemies.clear();
  defenders.clear();
  const b = meta.bonuses(); baseMax = 20 + b.baseHp; baseHp = baseMax;
  gameOver = false;
  overBox.hidden = true;
  money = 250 + b.startMoney; defenders.damageMult = b.damageMult;
  run = { kills: 0, bosses: 0, coins: 0 }; announced = 0;
  renderMoney();
  waves.reset();
  rewarded = false;
  renderBaseHp();
}
overBox.addEventListener('click', (e) => { const act = e.target.closest('[data-act]')?.dataset.act; if (act === 'again') resetRound(); else if (act === 'menu') backToMenu(); });
renderBaseHp();

/* ---------- Etiquetas 3D (Entrada / Base) ---------- */
const labels = [
  { el: $('label-entrance'), off: new THREE.Vector3(0, 5.6, 0) },
  { el: $('label-base'), off: new THREE.Vector3(1.4, 8.4, -1.5) },
];
const tmp = new THREE.Vector3();
function updateLabels() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  for (const l of labels) {
    tmp.copy(l === labels[0] ? map.entrancePosition : map.basePosition).add(l.off).project(camera);
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
  defenders.setTeam(meta.teamEntries());
  defenders.setEnabled(true);
  rig.setMenuMode(false);
  rig.reset(true);
}

function backToMenu() {
  shop?.close();
  inGame = false;
  $('hud').hidden = true;
  hpBox.hidden = true;
  overBox.hidden = true;
  bossBox.hidden = true;
  enemies.clear();
  defenders.setEnabled(false);
  defenders.clear();
  $('menu').hidden = false;
  rig.setMenuMode(true);
}

$('btn-start').addEventListener('click', startGame);
$('btn-wave').addEventListener('click', () => waves.startNext());
$('btn-recenter').addEventListener('click', () => rig.reset(true));
$('btn-shop').addEventListener('click', () => shop.open());
$('btn-shop-hud').addEventListener('click', () => shop.open());
$('btn-menu').addEventListener('click', backToMenu);
window.addEventListener('keydown', (e) => {
  if (e.code === 'Escape' && inGame) {
    if (!shop.close() && !defenders.cancel()) backToMenu();
  } else if (e.code.startsWith('Digit') && inGame && !gameOver) {
    const n = Number(e.code.slice(5));
    if (n >= 1 && n <= MAX_TEAM) defenders.toggleSlot(n - 1);
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
  updateBossBar();
  updateLabels();
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
frame();

window.__pirate = { scene, camera, renderer, map, rig, MAP, enemies };
renderMenuCoins();
addEventListener('pagehide', () => meta.save());
document.addEventListener('visibilitychange', () => { if (document.hidden) meta.save(); });

function updateBossBar() {
  const boss = inGame ? enemies.enemies.find((enemy) => enemy.def.boss && enemy.alive) : null;
  bossBox.hidden = !boss;
  if (!boss) return;
  bossName.textContent = `${boss.def.name}${boss.shield > 0 ? ' · 🛡 ESCUDO' : ''}${boss.enraged ? ' · 🔥 FÚRIA' : ''}`;
  bossFill.style.width = `${(boss.hp / boss.maxHp) * 100}%`;
}
