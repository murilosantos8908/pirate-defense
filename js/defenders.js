import * as THREE from 'three';
import { COLORS as C } from './config.js';
import { add } from './utils.js';

const G = {
  limb: new THREE.CylinderGeometry(0.1, 0.1, 0.5, 6),
  ball: new THREE.SphereGeometry(1, 8, 6),
  box: new THREE.BoxGeometry(1, 1, 1),
};

/* ------------------------------------------------------------------ */
/* Definições. Para criar outro defensor, adicione uma entrada aqui.   */
/* build(model) devolve { pose(swing) }  (swing: -1 = parado, 0..1)    */
/* ------------------------------------------------------------------ */
export const DEFENDER_TYPES = {
  sailor: {
    name: 'Marinheiro',
    desc: 'Combate corpo a corpo com sua espada.',
    damage: 12,
    range: 4.5,
    attackSpeed: 1.2, // ataques por segundo
    strikeAt: 0.5, // ponto da animação em que o golpe acerta
    build: buildSailor,
  },
};

function buildSailor(model) {
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
  add(sword, G.box, 0xdfe6ee, { y: 0.6, sx: 0.04, sy: 0.8, sz: 0.11, matOpts: { metalness: 0.4, roughness: 0.4 } });

  const lerp = THREE.MathUtils.lerp;
  return {
    pose(swing) {
      if (swing < 0) arm.rotation.z = 0.25;
      else if (swing < 0.35) arm.rotation.z = lerp(0.25, -1.0, swing / 0.35); // prepara
      else if (swing < 0.6) arm.rotation.z = lerp(-1.0, 1.6, (swing - 0.35) / 0.25); // golpe
      else arm.rotation.z = lerp(1.6, 0.25, (swing - 0.6) / 0.4); // volta
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
  constructor(typeId, position) {
    const def = DEFENDER_TYPES[typeId];
    this.type = typeId;
    this.def = def;
    this.name = def.name;
    this.damage = def.damage;
    this.range = def.range;
    this.attackSpeed = def.attackSpeed;
    this.kills = 0;

    this.root = new THREE.Group();
    this.root.position.copy(position);
    this.root.userData.defender = this;
    this.model = new THREE.Group();
    this.root.add(this.model);
    this.rig = def.build(this.model);
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
  constructor({ scene, camera, dom, map, enemies }) {
    this.camera = camera;
    this.dom = dom;
    this.map = map;
    this.enemies = enemies;
    this.enabled = false;
    this.group = new THREE.Group();
    this.group.name = 'defenders';
    scene.add(this.group);
    this.list = [];
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

  startPlacing(typeId) {
    if (!this.enabled || !DEFENDER_TYPES[typeId]) return;
    this._stopPlacing();
    this.select(null);
    this.placingType = typeId;
    const def = DEFENDER_TYPES[typeId];
    this.ghost = new THREE.Group();
    const m = new THREE.Group();
    this.ghost.add(m);
    def.build(m);
    this.ghostRing = makeRing(def.range, 0x4cd964, 0.9);
    this.ghost.add(this.ghostRing);
    this.ghost.visible = false;
    this.group.add(this.ghost);
    this.btn.classList.add('active');
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

  clear() {
    this.cancel();
    this.list.forEach((d) => this.group.remove(d.root));
    this.list.length = 0;
  }

  update(dt, time) {
    for (const d of this.list) d.update(dt, time, this.enemies.enemies, this._onHit);
  }

  /* ---------- internos ---------- */
  _onHit = (enemy, defender) => {
    const wasAlive = enemy.alive;
    this.enemies.damage(enemy, defender.damage);
    if (wasAlive && !enemy.alive) {
      defender.kills++;
      if (this.selected === defender) this._renderInfo();
    }
  };

  _stopPlacing() {
    if (this.ghost) this.group.remove(this.ghost);
    this.ghost = null;
    this.placingType = null;
    this.btn.classList.remove('active');
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
      const d = new Defender(this.placingType, this.ghost.position);
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
      .dm-hint{margin:0;padding:6px 12px;font-size:13px;background:rgba(15,42,67,.88);border-radius:10px;color:#dcecf7}
      .dm-info{position:fixed;right:16px;top:50%;transform:translateY(-50%);min-width:210px;padding:14px 16px;
        background:rgba(15,42,67,.92);border:3px solid var(--gold);border-radius:14px;box-shadow:0 5px 0 rgba(0,0,0,.22)}
      .dm-info h3{margin:0 0 4px;font-size:20px;color:var(--gold)}
      .dm-info p{margin:0 0 8px;font-size:13px;color:#cfe3f2;font-family:"Segoe UI",system-ui,sans-serif}
      .dm-info dl{margin:0;display:grid;grid-template-columns:1fr auto;gap:4px 14px;font-size:15px}
      .dm-info dd{margin:0;text-align:right;color:#fff}
      .dm-info dt{color:#cfe3f2}
      @media (max-width:640px){.dm-info{top:auto;bottom:70px;transform:none}}`;
    document.head.appendChild(st);

    this.bar = document.createElement('div');
    this.bar.className = 'dm-bar';
    this.bar.hidden = true;
    this.hint = document.createElement('p');
    this.hint.className = 'dm-hint';
    this.hint.hidden = true;
    this.hint.textContent = 'Clique em um local verde para posicionar. Esc cancela.';
    this.btn = document.createElement('button');
    this.btn.className = 'btn btn-small';
    this.btn.type = 'button';
    this.btn.textContent = '⚓ Marinheiro [1]';
    this.btn.addEventListener('click', () => this.togglePlacing('sailor'));
    this.bar.append(this.hint, this.btn);
    document.body.appendChild(this.bar);

    this.info = document.createElement('div');
    this.info.className = 'dm-info';
    this.info.hidden = true;
    document.body.appendChild(this.info);
  }

  _renderInfo() {
    const d = this.selected;
    this.info.hidden = !d;
    if (!d) return;
    this.info.innerHTML =
      `<h3>${d.name}</h3><p>${d.def.desc}</p><dl>` +
      `<dt>Dano</dt><dd>${d.damage}</dd>` +
      `<dt>Alcance</dt><dd>${d.range.toFixed(1)}</dd>` +
      `<dt>Vel. de ataque</dt><dd>${d.attackSpeed.toFixed(1)}/s</dd>` +
      `<dt>Inimigos abatidos</dt><dd>${d.kills}</dd></dl>`;
  }
}
