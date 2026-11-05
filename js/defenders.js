import * as THREE from 'three';
import { COLORS as C } from './config.js';
import { add } from './utils.js';

const G = {
  limb: new THREE.CylinderGeometry(0.1, 0.1, 0.5, 6),
  ball: new THREE.SphereGeometry(1, 8, 6),
  box: new THREE.BoxGeometry(1, 1, 1),
};

const BULLET = new THREE.SphereGeometry(0.09, 6, 5);
const BULLET_MAT = new THREE.MeshBasicMaterial({ color: 0xffe9a0 });
const SPARK = new THREE.SphereGeometry(1, 6, 5);

/* ------------------------------------------------------------------ */
/* Definições. Para criar outro defensor, adicione uma entrada aqui.   */
/* build(model) devolve { pose(swing) }  (swing: -1 = parado, 0..1)    */
/* ------------------------------------------------------------------ */
export const DEFENDER_TYPES = {
  sailor: {
    name: 'Marinheiro', desc: 'Combate corpo a corpo com sua espada.',
    cost: 100, damage: 12, range: 4.5, attackSpeed: 1.2, strikeAt: 0.5,
    levels: [
      { upgradeCost: 0, ability: 'Espada básica' },
      { upgradeCost: 80, ability: 'Golpe reforçado' },
      { upgradeCost: 140, ability: 'Alcance ampliado', visualTier: 2 },
      { upgradeCost: 220, ability: 'Ataque rápido' },
      { upgradeCost: 320, ability: 'Golpe do Corsário', visualTier: 2 },
    ],
    skills: [
      { id: 'corsairStrike', name: 'Golpe do Corsário', description: 'A cada 5 segundos, causa dano adicional.', unlockLevel: 5, cooldown: 5, bonusDamage: 24 },
    ],
    build: buildSailor,
  },
  musketeer: {
    name: 'Mosqueteiro', desc: 'Atira de longe com o mosquete. Dano alto, recarga lenta.',
    cost: 150, damage: 34, range: 9, attackSpeed: 0.55, strikeAt: 0.45, projectile: true,
    levels: [
      { upgradeCost: 0, ability: 'Mosquete básico' },
      { upgradeCost: 100, ability: 'Pólvora reforçada' },
      { upgradeCost: 180, ability: 'Mira aprimorada', visualTier: 2 },
      { upgradeCost: 260, ability: 'Recarga rápida' },
      { upgradeCost: 360, ability: 'Tiro certeiro', visualTier: 2 },
    ],
    build: buildMusketeer,
  },
  cannoneer: {
    name: 'Canhoneiro', desc: 'Dispara balas de canhão a longa distância. Recarga lenta.',
    cost: 190, damage: 48, range: 8, attackSpeed: 0.42, strikeAt: 0.48, projectile: true,
    levels: [
      { upgradeCost: 0, ability: 'Canhão básico' },
      { upgradeCost: 120, ability: 'Pólvora reforçada' },
      { upgradeCost: 200, ability: 'Boca dourada', visualTier: 2 },
      { upgradeCost: 290, ability: 'Recarga aprimorada' },
      { upgradeCost: 400, ability: 'Bala explosiva', visualTier: 2 },
    ],
    build: buildCannoneer,
  },
  parrot: {
    name: 'Papagaio', desc: 'Ave veloz que bica os inimigos próximos.',
    cost: 70, damage: 7, range: 5, attackSpeed: 1.8, strikeAt: 0.4,
    levels: [
      { upgradeCost: 0, ability: 'Bicada rápida' },
      { upgradeCost: 60, ability: 'Bico afiado' },
      { upgradeCost: 110, ability: 'Colar de ouro', visualTier: 2 },
      { upgradeCost: 170, ability: 'Voo ágil' },
      { upgradeCost: 250, ability: 'Rasante pirata', visualTier: 2 },
    ],
    build: buildParrot,
  },
  captain: {
    name: 'Capitão', desc: 'Líder pirata. Sabre afiado, dano alto e boa resistência no combate.',
    cost: 200, damage: 30, range: 5.5, attackSpeed: 1.0, strikeAt: 0.5,
    levels: [
      { upgradeCost: 0, ability: 'Sabre do capitão' },
      { upgradeCost: 120, ability: 'Voz de comando' },
      { upgradeCost: 200, ability: 'Dragonas de ouro', visualTier: 2 },
      { upgradeCost: 300, ability: 'Corte veloz' },
      { upgradeCost: 420, ability: 'Lâmina dourada', visualTier: 2 },
    ],
    build: buildCaptain,
  },
  markswoman: {
    name: 'Atiradora', desc: 'Franco-atiradora pirata. Alcance enorme e tiros de precisão.',
    cost: 220, damage: 48, range: 12, attackSpeed: 0.45, strikeAt: 0.5, projectile: true,
    levels: [
      { upgradeCost: 0, ability: 'Rifle de precisão' },
      { upgradeCost: 130, ability: 'Luneta calibrada' },
      { upgradeCost: 210, ability: 'Mira dourada', visualTier: 2 },
      { upgradeCost: 310, ability: 'Recarga ágil' },
      { upgradeCost: 430, ability: 'Tiro mortal', visualTier: 2 },
    ],
    build: buildMarkswoman,
  },
};

/** Atributos por nível de evolução (cópias gastas). Usado pelo jogo e pela coleção. */
export function statsFor(typeId, level = 1) {
  const d = DEFENDER_TYPES[typeId];
  const l = level - 1;
  return {
    damage: Math.round(d.damage * (1 + 0.12 * l)),
    range: d.range * (1 + 0.03 * l),
    attackSpeed: d.attackSpeed * (1 + 0.04 * l),
  };
}

function buildSailor(model, level = 1) {
  const skin = 0xf2b98a;
  [-0.15, 0.15].forEach((z) => add(model, G.box, C.blue, { y: 0.22, z, sx: 0.24, sy: 0.45, sz: 0.22 }));
  add(model, new THREE.CylinderGeometry(0.33, 0.36, 0.6, 8), C.white, { y: 0.75 });
  [0.6, 0.8].forEach((y) => add(model, new THREE.CylinderGeometry(0.345, 0.345, 0.08, 8), C.blue, { y }));
  add(model, G.ball, skin, { y: 1.35, sx: 0.28, sy: 0.28, sz: 0.28 });
  [-0.1, 0.1].forEach((z) => add(model, G.ball, C.black, { x: 0.25, y: 1.38, z, sx: 0.035, sy: 0.035, sz: 0.035 }));

  // Chapéu pirata
  add(model, new THREE.CylinderGeometry(0.42, 0.42, 0.07, 10), C.black, { y: 1.56 });
  add(model, new THREE.CylinderGeometry(0.25, 0.3, 0.24, 10), C.black, { y: 1.7 });
  add(model, new THREE.CylinderGeometry(0.31, 0.31, 0.06, 10), C.gold, { y: 1.62 });
  add(model, G.ball, C.white, { x: 0.28, y: 1.7, sx: 0.07, sy: 0.07, sz: 0.04 });

  // Braço livre
  add(model, G.limb, C.white, { y: 0.95, z: -0.42, rx: 0.15 });

  // Braço da espada (pivô no ombro)
  const arm = new THREE.Group();
  arm.position.set(0, 1.02, 0.42);
  model.add(arm);
  add(arm, G.limb, C.white, { y: -0.25 });
  add(arm, G.ball, skin, { y: -0.5, sx: 0.1, sy: 0.1, sz: 0.1 });
  const sword = new THREE.Group();
  sword.position.y = -0.5;
  sword.rotation.z = -Math.PI / 2; // lâmina aponta para +x (frente)
  arm.add(sword);
  add(sword, new THREE.CylinderGeometry(0.04, 0.04, 0.22, 5), C.woodDark, { y: 0.05 });
  add(sword, G.box, C.gold, { y: 0.17, sx: 0.07, sy: 0.05, sz: 0.3 });
  const blade = add(sword, G.box, 0xdfe6ee, { y: 0.6, sx: 0.04, sy: 0.8, sz: 0.11, matOpts: { metalness: 0.4, roughness: 0.4 } });
  blade.material = blade.material.clone();
  const sash = new THREE.Group();
  model.add(sash);
  add(sash, new THREE.BoxGeometry(0.52, 0.16, 0.62), C.red, { x: -0.08, y: 0.92, z: 0, rz: -0.16 });
  add(sash, new THREE.BoxGeometry(0.2, 0.2, 0.08), C.gold, { x: -0.13, y: 0.83, z: 0.32 });
  sash.visible = level >= 3;

  const lerp = THREE.MathUtils.lerp;
  return {
    setLevel(nextLevel) {
      const upgraded = nextLevel >= 3;
      blade.scale.y = upgraded ? 1 : 0.8;
      blade.material.color.set(upgraded ? 0xffc83d : 0xdfe6ee);
      sash.visible = upgraded;
    },
    pose(swing) {
      if (swing < 0) arm.rotation.z = 0.25;
      else if (swing < 0.35) arm.rotation.z = lerp(0.25, -1.0, swing / 0.35); // prepara
      else if (swing < 0.6) arm.rotation.z = lerp(-1.0, 1.6, (swing - 0.35) / 0.25); // golpe
      else arm.rotation.z = lerp(1.6, 0.25, (swing - 0.6) / 0.4); // volta
    },
  };
}

function buildMusketeer(model) {
  const skin = 0xe2a878;
  // Pernas e casaca vermelha com galões dourados
  [-0.15, 0.15].forEach((z) => add(model, G.box, C.black, { y: 0.22, z, sx: 0.24, sy: 0.45, sz: 0.22 }));
  add(model, new THREE.CylinderGeometry(0.34, 0.4, 0.62, 8), C.redDark, { y: 0.76 });
  add(model, new THREE.CylinderGeometry(0.4, 0.4, 0.07, 8), C.gold, { y: 0.5 });
  add(model, new THREE.BoxGeometry(0.06, 0.55, 0.3), C.gold, { x: 0.33, y: 0.8 });
  add(model, G.ball, skin, { y: 1.36, sx: 0.28, sy: 0.28, sz: 0.28 });
  [-0.1, 0.1].forEach((z) => add(model, G.ball, C.black, { x: 0.25, y: 1.39, z, sx: 0.035, sy: 0.035, sz: 0.035 }));
  // Bigode
  add(model, G.box, C.woodDark, { x: 0.27, y: 1.3, sx: 0.04, sy: 0.04, sz: 0.2 });

  // Chapéu tricórnio com pluma
  add(model, new THREE.CylinderGeometry(0.5, 0.5, 0.06, 3), C.black, { y: 1.57, ry: Math.PI / 2 });
  add(model, new THREE.CylinderGeometry(0.22, 0.3, 0.22, 8), C.black, { y: 1.7 });
  add(model, new THREE.CylinderGeometry(0.31, 0.31, 0.05, 8), C.gold, { y: 1.63 });
  add(model, G.ball, C.white, { x: -0.1, y: 1.88, z: 0.22, sx: 0.09, sy: 0.18, sz: 0.06 });

  add(model, G.limb, C.redDark, { y: 0.95, z: -0.42, rx: 0.15 });

  // Braço que segura o mosquete (pivô no ombro; em z = +90° aponta para +x)
  const arm = new THREE.Group();
  arm.position.set(0, 1.02, 0.42);
  model.add(arm);
  add(arm, G.limb, C.redDark, { y: -0.25 });
  add(arm, G.ball, skin, { y: -0.5, sx: 0.1, sy: 0.1, sz: 0.1 });
  add(arm, new THREE.BoxGeometry(0.16, 0.7, 0.2), C.wood, { y: -0.22, x: 0.03 }); // coronha
  add(arm, new THREE.CylinderGeometry(0.05, 0.06, 1.5, 6), 0x8d96a3, { y: -1.15, matOpts: { metalness: 0.5, roughness: 0.4 } }); // cano
  add(arm, new THREE.CylinderGeometry(0.075, 0.075, 0.06, 6), C.gold, { y: -0.75 });
  const flash = add(arm, G.ball, C.yellow, {
    y: -1.95, sx: 0.28, sy: 0.28, sz: 0.28, cast: false,
    matOpts: { emissive: C.orange, emissiveIntensity: 1.5 },
  });
  flash.visible = false;

  const lerp = THREE.MathUtils.lerp;
  return {
    pose(swing) {
      flash.visible = swing >= 0.45 && swing < 0.6;
      if (swing < 0) arm.rotation.z = 1.2;
      else if (swing < 0.45) arm.rotation.z = lerp(1.2, 1.4, swing / 0.45); // mira
      else if (swing < 0.6) arm.rotation.z = lerp(1.4, 0.95, (swing - 0.45) / 0.15); // coice
      else arm.rotation.z = lerp(0.95, 1.2, (swing - 0.6) / 0.4);
    },
  };
}

function buildCannoneer(model, level = 1) {
  const skin = 0xe2a878;
  // Artilheiro com uniforme, bandana e faixa dourada.
  [-0.15, 0.15].forEach((z) => add(model, G.box, C.black, { y: 0.22, z, sx: 0.24, sy: 0.45, sz: 0.22 }));
  add(model, new THREE.CylinderGeometry(0.35, 0.4, 0.62, 8), C.blue, { y: 0.76 });
  add(model, new THREE.CylinderGeometry(0.4, 0.4, 0.07, 8), C.gold, { y: 0.5 });
  add(model, G.ball, skin, { y: 1.36, sx: 0.28, sy: 0.28, sz: 0.28 });
  [-0.1, 0.1].forEach((z) => add(model, G.ball, C.black, { x: 0.25, y: 1.39, z, sx: 0.035, sy: 0.035, sz: 0.035 }));
  add(model, new THREE.CylinderGeometry(0.3, 0.3, 0.1, 8), C.red, { y: 1.55 });
  add(model, G.box, C.red, { x: -0.3, y: 1.54, sx: 0.24, sy: 0.08, sz: 0.1, rz: -0.25 });
  add(model, new THREE.BoxGeometry(0.06, 0.55, 0.3), C.gold, { x: 0.33, y: 0.8 });

  // Carruagem e rodas de madeira.
  add(model, new THREE.BoxGeometry(0.78, 0.18, 0.6), C.woodDark, { x: -0.18, y: 0.29 });
  [-1, 1].forEach((s) => add(model, new THREE.CylinderGeometry(0.24, 0.24, 0.12, 10), C.wood, { x: -0.18, y: 0.3, z: 0.34 * s, rx: Math.PI / 2 }));

  // Cano voltado para +x, com pivô para o recuo do disparo.
  const cannon = new THREE.Group();
  cannon.position.set(0.12, 0.56, 0);
  model.add(cannon);
  add(cannon, new THREE.CylinderGeometry(0.24, 0.18, 0.7, 8), C.black, { x: 0.12, rz: -Math.PI / 2, matOpts: { metalness: 0.55, roughness: 0.4 } });
  const muzzle = add(cannon, new THREE.CylinderGeometry(0.3, 0.3, 0.12, 8), level >= 3 ? C.gold : C.woodDark, { x: 0.36, rz: -Math.PI / 2 });
  add(cannon, new THREE.CylinderGeometry(0.19, 0.19, 0.1, 8), C.wood, { x: -0.2, rz: -Math.PI / 2 });
  const flash = add(cannon, G.ball, C.yellow, { x: 0.58, sx: 0.42, sy: 0.34, sz: 0.34, cast: false, matOpts: { emissive: C.orange, emissiveIntensity: 1.5 } });
  flash.visible = false;
  const lerp = THREE.MathUtils.lerp;
  return {
    setLevel(l) { muzzle.material.color.set(l >= 3 ? C.gold : C.woodDark); },
    pose(swing) {
      flash.visible = swing >= 0.45 && swing < 0.58;
      if (swing < 0) cannon.position.x = 0.12;
      else if (swing < 0.48) cannon.position.x = lerp(0.12, 0.2, swing / 0.48);
      else if (swing < 0.62) cannon.position.x = lerp(0.2, -0.12, (swing - 0.48) / 0.14);
      else cannon.position.x = lerp(-0.12, 0.12, (swing - 0.62) / 0.38);
    },
  };
}

function buildParrot(model, level = 1) {
  // Poleiro de madeira
  add(model, new THREE.CylinderGeometry(0.3, 0.34, 0.1, 8), C.wood, { y: 0.05 });
  add(model, new THREE.CylinderGeometry(0.08, 0.1, 0.9, 6), C.woodDark, { y: 0.5 });
  add(model, new THREE.CylinderGeometry(0.05, 0.05, 0.9, 6), C.woodLight, { y: 0.98, rx: Math.PI / 2 });

  const bird = new THREE.Group();
  bird.position.y = 1.0;
  model.add(bird);
  const ball = G.ball;

  // Corpo, barriga e cauda
  add(bird, ball, C.red, { y: 0.32, sx: 0.3, sy: 0.42, sz: 0.3 });
  add(bird, ball, C.yellow, { x: 0.1, y: 0.26, sx: 0.2, sy: 0.3, sz: 0.2 });
  add(bird, G.box, C.red, { x: -0.22, y: -0.02, sx: 0.1, sy: 0.7, sz: 0.14, rz: 0.4 });
  add(bird, G.box, C.blue, { x: -0.3, y: -0.3, sx: 0.1, sy: 0.3, sz: 0.2, rz: 0.4 });
  [-0.07, 0.07].forEach((z) => add(bird, G.box, C.yellow, { x: -0.27, y: -0.2, z, sx: 0.07, sy: 0.4, sz: 0.06, rz: 0.4 }));

  // Cabeça, face branca, olhos, tapa-olho e bico
  add(bird, ball, C.red, { x: 0.08, y: 0.8, sx: 0.23, sy: 0.23, sz: 0.23 });
  add(bird, ball, C.white, { x: 0.2, y: 0.78, sx: 0.1, sy: 0.13, sz: 0.17 });
  [-0.13, 0.13].forEach((z) => add(bird, ball, C.black, { x: 0.22, y: 0.84, z, sx: 0.04, sy: 0.04, sz: 0.04 }));
  add(bird, G.box, C.black, { x: 0.21, y: 0.84, z: -0.14, sx: 0.08, sy: 0.08, sz: 0.04 });
  add(bird, new THREE.ConeGeometry(0.11, 0.3, 6), C.yellow, { x: 0.36, y: 0.78, rz: -Math.PI / 2 });
  add(bird, new THREE.ConeGeometry(0.07, 0.18, 6), C.orange, { x: 0.3, y: 0.7, rz: -Math.PI / 2 });

  // Chapéu pirata em miniatura
  add(bird, new THREE.CylinderGeometry(0.27, 0.27, 0.04, 3), C.black, { x: 0.06, y: 1.0, ry: Math.PI / 2 });
  add(bird, new THREE.CylinderGeometry(0.12, 0.16, 0.14, 8), C.black, { x: 0.06, y: 1.09 });
  add(bird, new THREE.CylinderGeometry(0.165, 0.165, 0.03, 8), C.gold, { x: 0.06, y: 1.04 });

  // Colar dourado (nível 3+)
  const necklace = add(bird, new THREE.TorusGeometry(0.2, 0.03, 5, 12), C.gold, {
    x: 0.04, y: 0.6, rx: Math.PI / 2, matOpts: { emissive: C.gold, emissiveIntensity: 0.4 },
  });
  necklace.visible = level >= 3;

  // Asas (pivô no ombro)
  const wings = [-1, 1].map((s) => {
    const w = new THREE.Group();
    w.position.set(0, 0.5, 0.26 * s);
    bird.add(w);
    add(w, G.box, C.red, { y: -0.2, sx: 0.32, sy: 0.5, sz: 0.06 });
    add(w, G.box, C.blue, { y: -0.38, z: 0.03 * s, sx: 0.3, sy: 0.34, sz: 0.05 });
    add(w, G.box, C.yellow, { x: -0.1, y: -0.3, z: 0.05 * s, sx: 0.08, sy: 0.4, sz: 0.04 });
    return { w, s };
  });

  return {
    setLevel(l) { necklace.visible = l >= 3; },
    pose(swing) {
      const t = performance.now() / 1000;
      const flap = swing < 0 ? 0.12 + Math.sin(t * 3) * 0.08 : 0.9 + Math.sin(swing * 40) * 0.5;
      wings.forEach(({ w, s }) => (w.rotation.x = -flap * s));
      bird.scale.y = 1 + Math.sin(t * 2.2) * 0.02; // respiração
      bird.rotation.z = swing < 0 ? 0 : -0.55 * Math.sin(Math.min(1, swing) * Math.PI); // bicada
    },
  };
}

function buildCaptain(model, level = 1) {
  const skin = 0xf2b98a;
  const torso = new THREE.Group();
  model.add(torso);

  // Calças brancas e botas pretas
  [-0.15, 0.15].forEach((z) => {
    add(model, G.box, C.white, { y: 0.26, z, sx: 0.26, sy: 0.44, sz: 0.24 });
    add(model, G.box, C.black, { x: 0.03, y: 0.1, z, sx: 0.34, sy: 0.2, sz: 0.28 });
  });

  // Casaca azul, abas, cinto, botões e lenço
  add(torso, new THREE.CylinderGeometry(0.36, 0.46, 0.78, 8), C.blue, { y: 0.82 });
  add(torso, G.box, C.blue, { x: -0.36, y: 0.5, sx: 0.12, sy: 0.5, sz: 0.5 });
  add(torso, new THREE.CylinderGeometry(0.44, 0.44, 0.08, 8), C.black, { y: 0.56 });
  add(torso, G.box, C.gold, { x: 0.44, y: 0.56, sx: 0.06, sy: 0.14, sz: 0.2 });
  [0.7, 0.88, 1.04].forEach((y) =>
    add(torso, G.ball, C.gold, { x: 0.4 - (y - 0.7) * 0.2, y, sx: 0.05, sy: 0.05, sz: 0.05 })
  );
  add(torso, G.box, C.red, { x: 0.3, y: 0.84, sx: 0.05, sy: 0.6, sz: 0.2, rz: 0.1 });
  add(torso, G.ball, C.white, { x: 0.27, y: 1.16, sx: 0.12, sy: 0.1, sz: 0.2 });

  // Cabeça, olhos, barba e bigode
  add(model, G.ball, skin, { y: 1.42, sx: 0.31, sy: 0.3, sz: 0.31 });
  [-0.1, 0.1].forEach((z) => add(model, G.ball, C.black, { x: 0.28, y: 1.45, z, sx: 0.035, sy: 0.035, sz: 0.035 }));
  add(model, G.ball, C.woodDark, { x: 0.15, y: 1.26, sx: 0.2, sy: 0.16, sz: 0.22 });
  add(model, G.box, C.woodDark, { x: 0.28, y: 1.35, sx: 0.04, sy: 0.04, sz: 0.22 });

  // Chapéu bicórnio com bordas douradas e pluma
  add(model, G.box, C.black, { y: 1.64, sx: 0.5, sy: 0.1, sz: 1.1 });
  [-1, 1].forEach((s) => add(model, G.box, C.black, { y: 1.72, z: 0.52 * s, sx: 0.5, sy: 0.2, sz: 0.1 }));
  add(model, G.box, C.gold, { x: 0.26, y: 1.66, sx: 0.04, sy: 0.07, sz: 1.1 });
  add(model, new THREE.CylinderGeometry(0.25, 0.3, 0.26, 8), C.black, { y: 1.76 });
  add(model, new THREE.CylinderGeometry(0.31, 0.31, 0.05, 8), C.gold, { y: 1.68 });
  add(model, G.ball, C.white, { x: -0.12, y: 1.98, z: 0.08, sx: 0.08, sy: 0.3, sz: 0.06 });
  add(model, G.ball, C.red, { x: -0.1, y: 1.9, z: -0.05, sx: 0.07, sy: 0.22, sz: 0.05 });

  // Capa vermelha com barra dourada (balança)
  const cape = new THREE.Group();
  cape.position.set(-0.36, 1.1, 0);
  model.add(cape);
  add(cape, G.box, C.red, { x: -0.04, y: -0.5, sx: 0.06, sy: 1.0, sz: 0.85 });
  add(cape, G.box, C.gold, { x: -0.06, y: -1.0, sx: 0.07, sy: 0.08, sz: 0.88 });

  // Dragonas (nível 3+)
  const gold = new THREE.Group();
  model.add(gold);
  [-1, 1].forEach((s) => {
    add(gold, G.box, C.gold, { y: 1.12, z: 0.44 * s, sx: 0.22, sy: 0.07, sz: 0.24, matOpts: { emissive: C.gold, emissiveIntensity: 0.5 } });
    [-0.08, 0, 0.08].forEach((x) => add(gold, G.box, C.gold, { x, y: 1.02, z: 0.44 * s, sx: 0.03, sy: 0.14, sz: 0.03 }));
  });
  gold.visible = level >= 3;

  // Braço livre com punho dourado
  add(model, G.limb, C.blue, { y: 0.95, z: -0.42, rx: 0.15 });
  add(model, new THREE.CylinderGeometry(0.12, 0.12, 0.08, 6), C.gold, { y: 0.72, z: -0.46, rx: 0.15 });
  add(model, G.ball, skin, { y: 0.66, z: -0.47, sx: 0.1, sy: 0.1, sz: 0.1 });

  // Braço do sabre (pivô no ombro)
  const arm = new THREE.Group();
  arm.position.set(0, 1.02, 0.42);
  model.add(arm);
  add(arm, G.limb, C.blue, { y: -0.25 });
  add(arm, new THREE.CylinderGeometry(0.12, 0.12, 0.08, 6), C.gold, { y: -0.45 });
  add(arm, G.ball, skin, { y: -0.52, sx: 0.1, sy: 0.1, sz: 0.1 });
  const sword = new THREE.Group();
  sword.position.y = -0.52;
  sword.rotation.z = -Math.PI / 2;
  arm.add(sword);
  add(sword, new THREE.CylinderGeometry(0.04, 0.04, 0.22, 5), C.woodDark, { y: 0.05 });
  add(sword, G.ball, C.gold, { y: 0.19, sx: 0.12, sy: 0.07, sz: 0.2 });
  add(sword, G.box, C.gold, { y: 0.17, sx: 0.07, sy: 0.05, sz: 0.34 });
  const blade = add(sword, G.box, 0xdfe6ee, { y: 0.66, sx: 0.04, sy: 0.9, sz: 0.12, matOpts: { metalness: 0.4, roughness: 0.4 } });
  blade.material = blade.material.clone();
  const setBlade = (l) => {
    blade.material.color.set(l >= 5 ? 0xffc83d : 0xdfe6ee);
    blade.material.emissive.set(l >= 5 ? 0xb87a00 : 0x000000);
  };
  setBlade(level);

  const lerp = THREE.MathUtils.lerp;
  return {
    setLevel(l) { gold.visible = l >= 3; setBlade(l); },
    pose(swing) {
      const t = performance.now() / 1000;
      torso.scale.y = 1 + Math.sin(t * 2.2) * 0.015;
      cape.rotation.z = 0.08 + Math.sin(t * 2.5) * 0.05 + (swing >= 0 ? 0.2 : 0);
      if (swing < 0) arm.rotation.z = 0.25;
      else if (swing < 0.35) arm.rotation.z = lerp(0.25, -1.0, swing / 0.35);
      else if (swing < 0.6) arm.rotation.z = lerp(-1.0, 1.6, (swing - 0.35) / 0.25);
      else arm.rotation.z = lerp(1.6, 0.25, (swing - 0.6) / 0.4);
    },
  };
}

function buildMarkswoman(model, level = 1) {
  const skin = 0xf4c29b;
  const hair = 0x7a3b1c;
  const torso = new THREE.Group();
  model.add(torso);

  // Pernas esguias, calça escura e botas de cano alto
  [-0.14, 0.14].forEach((z) => {
    add(model, G.box, C.woodDark, { y: 0.3, z, sx: 0.2, sy: 0.4, sz: 0.2 });
    add(model, G.box, C.black, { x: 0.02, y: 0.12, z, sx: 0.26, sy: 0.3, sz: 0.24 });
  });

  // Colete verde-musgo sobre camisa branca, cinto com fivela e saia curta
  add(torso, new THREE.CylinderGeometry(0.3, 0.33, 0.62, 8), C.white, { y: 0.78 });
  add(torso, new THREE.CylinderGeometry(0.32, 0.35, 0.5, 8, 1, false, 0, Math.PI * 1.4), 0x2f7a4a, { y: 0.8, ry: -0.3 });
  add(torso, new THREE.CylinderGeometry(0.36, 0.42, 0.18, 8), C.redDark, { y: 0.5 });
  add(torso, new THREE.CylinderGeometry(0.35, 0.35, 0.07, 8), C.black, { y: 0.58 });
  add(torso, G.box, C.gold, { x: 0.35, y: 0.58, sx: 0.05, sy: 0.12, sz: 0.16 });

  // Cartucheira cruzada e lenço
  add(torso, G.box, C.woodDark, { x: 0.05, y: 0.8, sx: 0.08, sy: 0.85, sz: 0.08, rx: -0.85, rz: 0.1 });
  [-0.25, -0.05, 0.15, 0.3].forEach((k) =>
    add(torso, G.box, C.gold, { x: 0.3, y: 0.8 + k * 0.5, z: -k * 0.45, sx: 0.04, sy: 0.1, sz: 0.04 })
  );
  add(torso, new THREE.CylinderGeometry(0.25, 0.28, 0.1, 8), C.red, { y: 1.1 });
  add(torso, G.box, C.red, { x: -0.2, y: 0.98, sx: 0.06, sy: 0.3, sz: 0.1, rz: -0.15 });

  // Cabeça com cabelo, olhos grandes, cílios e batom
  add(model, G.ball, skin, { y: 1.42, sx: 0.31, sy: 0.3, sz: 0.3 });
  add(model, G.ball, hair, { x: -0.1, y: 1.5, sx: 0.31, sy: 0.27, sz: 0.33 });
  [-0.1, 0.1].forEach((z) => {
    add(model, G.ball, C.white, { x: 0.26, y: 1.45, z, sx: 0.06, sy: 0.07, sz: 0.05 });
    add(model, G.ball, 0x2a8fd8, { x: 0.31, y: 1.45, z, sx: 0.035, sy: 0.04, sz: 0.03 });
    add(model, G.box, C.black, { x: 0.28, y: 1.53, z, sx: 0.03, sy: 0.02, sz: 0.1 });
  });
  add(model, G.box, C.red, { x: 0.3, y: 1.33, sx: 0.03, sy: 0.03, sz: 0.1 });

  // Tranças longas
  [-1, 1].forEach((s) => {
    add(model, G.limb, hair, { x: -0.2, y: 1.12, z: 0.26 * s, sx: 1.4, sz: 1.4 });
    add(model, G.ball, C.red, { x: -0.2, y: 0.86, z: 0.26 * s, sx: 0.07, sy: 0.07, sz: 0.07 });
  });

  // Chapéu tricórnio inclinado com pluma verde
  const hat = new THREE.Group();
  hat.position.set(0, 1.62, 0);
  hat.rotation.x = 0.12;
  model.add(hat);
  add(hat, new THREE.CylinderGeometry(0.46, 0.46, 0.06, 3), C.black, { ry: Math.PI / 2 });
  add(hat, new THREE.CylinderGeometry(0.22, 0.28, 0.22, 8), C.black, { y: 0.13 });
  add(hat, new THREE.CylinderGeometry(0.29, 0.29, 0.05, 8), C.gold, { y: 0.06 });
  add(hat, G.ball, 0x3fd06a, { x: -0.1, y: 0.32, z: 0.2, sx: 0.07, sy: 0.24, sz: 0.05, rz: -0.3 });

  // Monóculo da mira (olho livre)
  add(model, new THREE.TorusGeometry(0.07, 0.015, 5, 10), C.gold, { x: 0.32, y: 1.45, z: -0.1, ry: Math.PI / 2 });

  // Braço livre apoiando o rifle
  add(model, G.limb, C.white, { y: 0.95, z: -0.36, rx: 0.15, sx: 0.8, sz: 0.8 });

  // Braço do rifle
  const arm = new THREE.Group();
  arm.position.set(0, 1.0, 0.36);
  model.add(arm);
  add(arm, G.limb, C.white, { y: -0.25, sx: 0.8, sz: 0.8 });
  add(arm, G.ball, skin, { y: -0.5, sx: 0.09, sy: 0.09, sz: 0.09 });
  add(arm, new THREE.BoxGeometry(0.14, 0.7, 0.18), C.wood, { y: -0.2, x: 0.03 });
  add(arm, new THREE.CylinderGeometry(0.04, 0.05, 2.0, 6), 0x8d96a3, { y: -1.4, matOpts: { metalness: 0.6, roughness: 0.35 } });
  add(arm, new THREE.CylinderGeometry(0.075, 0.075, 0.06, 6), C.gold, { y: -0.75 });

  // Luneta
  const scope = new THREE.Group();
  scope.position.set(0.12, -0.95, 0);
  arm.add(scope);
  add(scope, new THREE.CylinderGeometry(0.06, 0.06, 0.5, 8), C.black, { matOpts: { metalness: 0.5, roughness: 0.4 } });
  const lens = add(scope, new THREE.CylinderGeometry(0.065, 0.065, 0.03, 8), 0x5fd8ff, { y: 0.26, matOpts: { emissive: 0x2a9fd8, emissiveIntensity: 0.8 } });
  const trim = new THREE.Group();
  scope.add(trim);
  [-0.2, 0.2].forEach((y) => add(trim, new THREE.TorusGeometry(0.07, 0.02, 5, 8), C.gold, { y, rx: Math.PI / 2, matOpts: { emissive: C.gold, emissiveIntensity: 0.5 } }));
  trim.visible = level >= 3;

  const flash = add(arm, G.ball, C.yellow, {
    y: -2.5, sx: 0.22, sy: 0.22, sz: 0.22, cast: false,
    matOpts: { emissive: C.orange, emissiveIntensity: 1.5 },
  });
  flash.visible = false;

  const lerp = THREE.MathUtils.lerp;
  return {
    setLevel(l) {
      trim.visible = l >= 3;
      lens.material.emissiveIntensity = l >= 5 ? 1.6 : 0.8;
    },
    pose(swing) {
      const t = performance.now() / 1000;
      torso.scale.y = 1 + Math.sin(t * 2.2) * 0.015;
      lens.material.opacity = 1;
      flash.visible = swing >= 0.5 && swing < 0.65;
      if (swing < 0) arm.rotation.z = 1.25 + Math.sin(t * 1.5) * 0.02;
      else if (swing < 0.5) arm.rotation.z = lerp(1.25, 1.4, swing / 0.5);
      else if (swing < 0.65) arm.rotation.z = lerp(1.4, 1.0, (swing - 0.5) / 0.15);
      else arm.rotation.z = lerp(1.0, 1.25, (swing - 0.65) / 0.35);
    },
  };
}

/* ------------------------------------------------------------------ */
/* Defensor                                                            */
/* ------------------------------------------------------------------ */
const RING = new THREE.RingGeometry(0.96, 1, 64).rotateX(-Math.PI / 2);

function makeRing(range, color, opacity = 0.9) {
  const m = new THREE.Mesh(
    RING,
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false })
  );
  m.scale.set(range, 1, range);
  m.position.y = 0.06;
  m.renderOrder = 5;
  return m;
}

export class Defender {
  constructor(typeId, position, level = 1) {
    const def = DEFENDER_TYPES[typeId];
    const st = statsFor(typeId, level);
    this.type = typeId;
    this.def = def;
    this.name = def.name;
    this.level = level;
    this.damage = st.damage;
    this.range = st.range;
    this.attackSpeed = st.attackSpeed;
    this.upgradeInvestment = 0;
    this.skillCooldowns = new Map();
    this.kills = 0;

    this.root = new THREE.Group();
    this.root.position.copy(position);
    this.root.userData.defender = this;
    this.model = new THREE.Group();
    this.root.add(this.model);
    this.rig = def.build(this.model, level);
    this.rig.pose(-1);

    this.ring = makeRing(this.range, 0xffffff, 0.8);
    this.ring.visible = false;
    this.root.add(this.ring);

    this.cooldown = 0;
    this.swing = -1;
    this.swingDur = Math.min(0.5, 0.7 / this.attackSpeed);
    this.hitDone = true;
    this.target = null;
    this.seed = Math.random() * 6;
  }

  setSelected(on) {
    this.ring.visible = on;
  }

  _applyLevelStats() {
    const stats = statsFor(this.type, this.level);
    this.damage = stats.damage;
    this.range = stats.range;
    this.attackSpeed = stats.attackSpeed;
    this.swingDur = Math.min(0.5, 0.7 / this.attackSpeed);
    this.ring?.scale.set(this.range, 1, this.range);
  }

  get nextUpgrade() {
    return this.def.levels[this.level] || null;
  }

  upgrade() {
    const next = this.nextUpgrade;
    if (!next) return false;
    this.level++;
    this.upgradeInvestment += next.upgradeCost;
    this._applyLevelStats();
    this.rig.setLevel?.(this.level);
    this.rig.pose(this.swing);
    return true;
  }

  /** Resolve the reusable ability attached to this defender type. */
  resolveAttack() {
    let damage = this.damage;
    let ability = null;
    for (const skill of this.def.skills || []) {
      if (this.level < skill.unlockLevel || (this.skillCooldowns.get(skill.id) || 0) > 0) continue;
      damage += skill.bonusDamage;
      this.skillCooldowns.set(skill.id, skill.cooldown);
      ability = skill;
    }
    return { damage, ability };
  }

  /** Inimigo vivo mais adiantado no caminho dentro do alcance. */
  findTarget(enemies) {
    const p = this.root.position;
    let best = null;
    let bestDist = -1;
    for (const e of enemies) {
      if (!e.alive) continue;
      const d = Math.hypot(e.position.x - p.x, e.position.z - p.z);
      if (d <= this.range && e.distance > bestDist) {
        best = e;
        bestDist = e.distance;
      }
    }
    return best;
  }

  update(dt, time, enemies, onHit) {
    this.cooldown -= dt;
    for (const [id, remaining] of this.skillCooldowns) this.skillCooldowns.set(id, Math.max(0, remaining - dt));
    if (this.swing < 0) this.target = this.findTarget(enemies);

    const tg = this.target;
    if (tg && tg.alive) {
      const want = Math.atan2(-(tg.position.z - this.root.position.z), tg.position.x - this.root.position.x);
      let diff = want - this.model.rotation.y;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      this.model.rotation.y += diff * Math.min(1, dt * 14);

      if (this.swing < 0 && this.cooldown <= 0) {
        this.swing = 0;
        this.hitDone = false;
        this.cooldown = 1 / this.attackSpeed;
      }
    }

    if (this.swing >= 0) {
      this.swing += dt / this.swingDur;
      if (!this.hitDone && this.swing >= this.def.strikeAt) {
        this.hitDone = true;
        if (tg && tg.alive) onHit(tg, this);
      }
      if (this.swing >= 1) this.swing = -1;
    }
    this.rig.pose(this.swing);
    this.model.position.y = this.swing < 0 ? Math.sin(time * 2 + this.seed) * 0.02 : 0;
  }
}

/* ------------------------------------------------------------------ */
/* Gerenciador: posicionamento, seleção, ataque e painel               */
/* ------------------------------------------------------------------ */
const MIN_GAP = 1.7;

export class DefenderManager {
  constructor({ scene, camera, dom, map, enemies, getMoney, pay, refund }) {
    this.camera = camera;
    this.dom = dom;
    this.map = map;
    this.enemies = enemies;
    this.getMoney = getMoney;
    this.pay = pay;
    this.refund = refund;
    this.enabled = false;
    this.group = new THREE.Group();
    this.group.name = 'defenders';
    scene.add(this.group);
    this.list = [];
    this.team = [{ id: 'sailor', level: 1 }];
    this.bullets = [];
    this.fx = [];
    this.damageMult = 1;
    this.selected = null;
    this.placingType = null;
    this.ghost = null;
    this.ghostValid = false;

    this.ray = new THREE.Raycaster();
    this.ndc = new THREE.Vector2();
    this.plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -map.basePosition.y);
    this.hit = new THREE.Vector3();
    this.down = null;

    this._buildUi();
    dom.addEventListener('pointerdown', (e) => {
      if (e.button === 0) this.down = { x: e.clientX, y: e.clientY };
    });
    dom.addEventListener('pointermove', (e) => {
      if (this.placingType) this._moveGhost(e);
    });
    dom.addEventListener('pointerup', (e) => {
      const d = this.down;
      this.down = null;
      if (!this.enabled || e.button !== 0 || !d) return;
      if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 6) return; // foi arrasto da câmera
      this._click(e);
    });
  }

  /* ---------- API usada pelo main ---------- */
  setEnabled(on) {
    this.enabled = on;
    this.bar.hidden = !on;
    if (!on) this.cancel();
  }

  /** Cancela posicionamento/seleção. Retorna true se havia algo para cancelar. */
  cancel() {
    const had = !!this.placingType || !!this.selected;
    this._stopPlacing();
    this.select(null);
    return had;
  }

  setTeam(team) {
    this.team = Array.isArray(team)
      ? team.filter((entry) => entry && DEFENDER_TYPES[entry.id]).map(({ id, level = 1 }) => ({ id, level }))
      : [];
    this.cancel();
    this._renderBar();
  }

  levelOf(id) { return this.team.find((entry) => entry.id === id)?.level ?? 1; }

  toggleSlot(i) {
    const entry = this.team[i];
    if (entry) this.togglePlacing(entry.id);
  }

  startPlacing(typeId) {
    if (!this.enabled || !DEFENDER_TYPES[typeId] || !this.team.some((entry) => entry.id === typeId)) return;
    this._stopPlacing();
    this.select(null);
    this.placingType = typeId;
    const def = DEFENDER_TYPES[typeId];
    this.ghost = new THREE.Group();
    const m = new THREE.Group();
    this.ghost.add(m);
    def.build(m, this.levelOf(typeId));
    this.ghostRing = makeRing(statsFor(typeId, this.levelOf(typeId)).range, 0x4cd964, 0.9);
    this.ghost.add(this.ghostRing);
    this.ghost.visible = false;
    this.group.add(this.ghost);
    this._setActive(typeId);
    this.hint.hidden = false;
  }

  togglePlacing(typeId) {
    if (this.placingType === typeId) this._stopPlacing();
    else this.startPlacing(typeId);
  }

  select(d) {
    if (this.selected) this.selected.setSelected(false);
    this.selected = d;
    if (d) d.setSelected(true);
    this._renderInfo();
  }

  refreshInfo() {
    if (this.selected) this._renderInfo();
  }

  clear() {
    this.cancel();
    this.list.forEach((d) => this.group.remove(d.root));
    this.list.length = 0;
    this.bullets.forEach(({ mesh }) => this.group.remove(mesh));
    this.bullets.length = 0;
    this.fx.forEach((f) => { this.group.remove(f.mesh); f.mat.dispose(); });
    this.fx.length = 0;
  }

  update(dt, time) {
    for (const d of this.list) d.update(dt, time, this.enemies.enemies, this._onHit);
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      bullet.t += dt / 0.12;
      bullet.mesh.position.lerpVectors(bullet.from, bullet.to, Math.min(1, bullet.t));
      if (bullet.t >= 1) {
        this.group.remove(bullet.mesh);
        this.bullets.splice(i, 1);
      }
    }
    this._updateFx(dt);
  }

  /* ---------- internos ---------- */
  _onHit = (enemy, defender) => {
    const wasAlive = enemy.alive;
    const attack = defender.resolveAttack();
    if (defender.def.projectile) {
      const mesh = new THREE.Mesh(BULLET, BULLET_MAT);
      const dir = new THREE.Vector3(
        enemy.position.x - defender.root.position.x,
        0,
        enemy.position.z - defender.root.position.z
      ).normalize();
      const from = defender.root.position.clone()
        .add(new THREE.Vector3(0, 1.1, 0))
        .addScaledVector(dir, 1.1);
      const to = enemy.position.clone().add(new THREE.Vector3(0, 0.5, 0));
      mesh.position.copy(from);
      this.group.add(mesh);
      this.bullets.push({ mesh, from, to, t: 0 });
    }
    this._fx(enemy.position.clone().setY(0.7), defender.def.projectile ? 0xffb347 : 0xffffff, defender.def.projectile ? 0.4 : 0.7);
    this._applyDamage(enemy, defender, Math.round(attack.damage * this.damageMult), wasAlive);
  };

  _fx(pos, color, size = 0.5) {
    if (this.fx.length > 60) return;
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, depthWrite: false });
    const mesh = new THREE.Mesh(SPARK, mat); mesh.position.copy(pos); mesh.scale.setScalar(0.1); this.group.add(mesh);
    this.fx.push({ mesh, mat, t: 0, size });
  }

  _updateFx(dt) {
    for (let i = this.fx.length - 1; i >= 0; i--) {
      const f = this.fx[i]; f.t += dt / 0.28; f.mesh.scale.setScalar(f.size * (0.3 + f.t)); f.mat.opacity = 0.9 * Math.max(0, 1 - f.t);
      if (f.t >= 1) { this.group.remove(f.mesh); f.mat.dispose(); this.fx.splice(i, 1); }
    }
  }

  _applyDamage(enemy, defender, damage, wasAlive = enemy.alive) {
    this.enemies.damage(enemy, damage);
    if (wasAlive && !enemy.alive) {
      this._fx(enemy.position.clone().setY(0.6), enemy.def.boss ? 0x5cffd9 : 0xff4b3e, enemy.def.boss ? 3 : 1.1);
      defender.kills++;
      if (this.selected === defender) this._renderInfo();
    }
  }

  _stopPlacing() {
    if (this.ghost) this.group.remove(this.ghost);
    this.ghost = null;
    this.placingType = null;
    this._setActive(null);
    this.hint.hidden = true;
  }

  _pointer(e) {
    const r = this.dom.getBoundingClientRect();
    this.ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    this.ray.setFromCamera(this.ndc, this.camera);
  }

  _groundPoint(e) {
    this._pointer(e);
    return this.ray.ray.intersectPlane(this.plane, this.hit) ? this.hit : null;
  }

  _isValid(p) {
    if (!this.map.canBuild(p.x, p.z)) return false;
    return !this.list.some((d) => Math.hypot(d.root.position.x - p.x, d.root.position.z - p.z) < MIN_GAP);
  }

  _moveGhost(e) {
    const p = this._groundPoint(e);
    if (!p) return;
    this.ghost.visible = true;
    this.ghost.position.copy(p);
    this.ghostValid = this._isValid(p);
    this.ghostRing.material.color.set(this.ghostValid ? 0x4cd964 : 0xff4b3e);
  }

  _click(e) {
    if (this.placingType) {
      this._moveGhost(e);
      if (!this.ghostValid) return;
      const type = DEFENDER_TYPES[this.placingType];
      if (!this.pay(type.cost)) return;
      const d = new Defender(this.placingType, this.ghost.position, this.levelOf(this.placingType));
      d.purchaseCost = type.cost;
      this.group.add(d.root);
      this.list.push(d);
      this._stopPlacing();
      this.select(d);
      return;
    }
    this._pointer(e);
    const hits = this.ray.intersectObjects(this.group.children, true);
    let found = null;
    if (hits.length) {
      let o = hits[0].object;
      while (o && !o.userData.defender) o = o.parent;
      found = o ? o.userData.defender : null;
    }
    this.select(found);
  }

  _buildUi() {
    const st = document.createElement('style');
    st.textContent = `
      .dm-bar{position:fixed;left:16px;bottom:max(14px,env(safe-area-inset-bottom));display:flex;flex-direction:column;gap:8px;align-items:flex-start}
      .dm-bar .btn.active{background:var(--coral);border-color:#fff}
      .dm-slots{display:flex;flex-direction:column;gap:8px;align-items:flex-start}
      .dm-hint{margin:0;padding:6px 12px;font-size:13px;background:rgba(15,42,67,.88);border-radius:10px;color:#dcecf7}
      .dm-info{position:fixed;right:16px;top:50%;transform:translateY(-50%);min-width:210px;padding:14px 16px;
        background:rgba(15,42,67,.92);border:3px solid var(--gold);border-radius:14px;box-shadow:0 5px 0 rgba(0,0,0,.22)}
      .dm-info h3{margin:0 0 4px;font-size:20px;color:var(--gold)}
      .dm-info p{margin:0 0 8px;font-size:13px;color:#cfe3f2;font-family:"Segoe UI",system-ui,sans-serif}
      .dm-info dl{margin:0;display:grid;grid-template-columns:1fr auto;gap:4px 14px;font-size:15px}
      .dm-info dd{margin:0;text-align:right;color:#fff}
      .dm-info dt{color:#cfe3f2}
      .dm-info .dm-ability{margin:10px 0 0;padding:8px;background:rgba(255,200,61,.12);border-radius:8px;color:#ffe39a}
      .dm-actions{display:grid;gap:8px;margin-top:12px}
      .dm-actions button{width:100%}
      .dm-actions button:disabled{opacity:.5;cursor:not-allowed;filter:grayscale(.5)}
      @media (max-width:640px){.dm-info{top:auto;bottom:70px;transform:none}}`;
    document.head.appendChild(st);

    this.bar = document.createElement('div');
    this.bar.className = 'dm-bar';
    this.bar.hidden = true;
    this.hint = document.createElement('p');
    this.hint.className = 'dm-hint';
    this.hint.hidden = true;
    this.hint.textContent = 'Clique em um local verde para posicionar. Esc cancela.';
    this.slots = document.createElement('div');
    this.slots.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap';
    this.bar.append(this.hint, this.slots);
    document.body.appendChild(this.bar);
    this._renderBar();

    this.info = document.createElement('div');
    this.info.className = 'dm-info';
    this.info.hidden = true;
    this.info.addEventListener('click', (e) => {
      if (e.target.closest('[data-upgrade]')) this._upgradeSelected();
      if (e.target.closest('[data-sell]')) this._sellSelected();
    });
    document.body.appendChild(this.info);
  }

  _renderBar() {
    if (!this.slots) return;
    this.slots.innerHTML = '';
    this.btns = {};
    this.team.forEach((entry, i) => {
      const def = DEFENDER_TYPES[entry.id];
      if (!def) return;
      const button = document.createElement('button');
      button.className = 'btn btn-small';
      button.type = 'button';
      button.textContent = `${def.name} Nv${entry.level} [${i + 1}]`;
      button.addEventListener('click', () => this.togglePlacing(entry.id));
      this.slots.appendChild(button);
      this.btns[entry.id] = button;
    });
  }

  _setActive(id) {
    for (const key in this.btns) this.btns[key].classList.toggle('active', key === id);
  }

  _renderInfo() {
    const d = this.selected;
    this.info.hidden = !d;
    if (!d) return;
    const next = d.nextUpgrade;
    const unlocked = (d.def.skills || []).filter((skill) => d.level >= skill.unlockLevel);
    const nextSkill = (d.def.skills || []).find((skill) => skill.unlockLevel === d.level + 1);
    const abilityText = unlocked.length
      ? unlocked.map((skill) => `${skill.name}: ${skill.description}`).join('<br>')
      : nextSkill ? `Desbloqueia no nível ${nextSkill.unlockLevel}: ${nextSkill.name}` : d.def.levels[d.level - 1]?.ability || 'Nível máximo';
    const upgradeCost = next?.upgradeCost;
    this.info.innerHTML =
      `<h3>${d.name}</h3><p>${d.def.desc}</p><p><strong>Nível ${d.level} / ${d.def.levels.length}</strong></p><dl>` +
      `<dt>Dano</dt><dd>${d.damage}</dd>` +
      `<dt>Alcance</dt><dd>${d.range.toFixed(1)}</dd>` +
      `<dt>Vel. de ataque</dt><dd>${d.attackSpeed.toFixed(1)}/s</dd>` +
      `<dt>Nível</dt><dd>${d.level}</dd>` +
      `<dt>Inimigos abatidos</dt><dd>${d.kills}</dd></dl>` +
      `<p class="dm-ability"><strong>Habilidade:</strong> ${abilityText}</p>` +
      `<div class="dm-actions">` +
      `<button class="btn btn-small" type="button" data-upgrade ${!next || this.getMoney() < upgradeCost ? 'disabled' : ''}>${next ? `Melhorar · ${upgradeCost} moedas` : 'Nível máximo'}</button>` +
      `<button class="btn btn-small btn-ghost" type="button" data-sell>Vender · ${this._sellValue(d)} moedas</button></div>`;
  }

  _upgradeSelected() {
    const d = this.selected;
    const next = d?.nextUpgrade;
    if (!next || !this.pay(next.upgradeCost)) return;
    d.upgrade();
    this._fx(d.root.position.clone().setY(1), 0xffc83d, 1.8);
    this._renderInfo();
  }

  _sellValue(d) {
    return Math.floor((d.purchaseCost + d.upgradeInvestment) * 0.6);
  }

  _sellSelected() {
    const d = this.selected;
    if (!d) return;
    this.refund(this._sellValue(d));
    this.group.remove(d.root);
    this.list.splice(this.list.indexOf(d), 1);
    this.select(null);
  }
}
