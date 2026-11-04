import * as THREE from 'three';
import { OrbitControls } from '../vendor/OrbitControls.js';
import { CAMERA, MAP } from './config.js';

const HANDLED_KEYS = new Set([
  'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyQ', 'KeyE',
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
]);

const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

/**
 * Câmera estilo Tower Defense:
 *  - botão esquerdo: girar | botão direito: mover | roda: zoom
 *  - WASD / setas: mover | Q / E: girar
 *  - toque: um dedo gira, dois dedos zoom e mover
 */
export class CameraRig {
  constructor(camera, domElement) {
    this.camera = camera;
    this.keys = new Set();
    this.tween = null;
    this.keyboardEnabled = false;

    const c = new OrbitControls(camera, domElement);
    this.controls = c;
    c.enableDamping = true;
    c.dampingFactor = 0.09;
    c.minDistance = CAMERA.minDistance;
    c.maxDistance = CAMERA.maxDistance;
    c.minPolarAngle = 0.35;
    c.maxPolarAngle = 1.35; // nunca desce abaixo do horizonte
    c.screenSpacePanning = false; // mover sempre sobre o plano do chão
    c.rotateSpeed = 0.7;
    c.zoomSpeed = 0.9;
    c.panSpeed = 0.9;
    c.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.PAN,
    };
    c.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };

    this.reset(false);

    window.addEventListener('keydown', (e) => {
      if (!this.keyboardEnabled || !HANDLED_KEYS.has(e.code)) return;
      e.preventDefault();
      this.keys.add(e.code);
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => this.keys.clear());
  }

  /** Modo menu: a câmera gira sozinha e o jogador não controla. */
  setMenuMode(on) {
    this.controls.enabled = !on;
    this.controls.autoRotate = on;
    this.controls.autoRotateSpeed = 0.7;
    this.keyboardEnabled = !on;
    this.keys.clear();
  }

  reset(animate = true) {
    const toPos = new THREE.Vector3(CAMERA.start.x, CAMERA.start.y, CAMERA.start.z);
    const toTarget = new THREE.Vector3(CAMERA.target.x, CAMERA.target.y, CAMERA.target.z);
    if (!animate) {
      this.camera.position.copy(toPos);
      this.controls.target.copy(toTarget);
      this.controls.update();
      return;
    }
    this.tween = {
      t: 0,
      dur: 0.8,
      fromPos: this.camera.position.clone(),
      fromTarget: this.controls.target.clone(),
      toPos,
      toTarget,
    };
  }

  update(dt) {
    const { camera, controls } = this;

    if (this.tween) {
      const tw = this.tween;
      tw.t = Math.min(1, tw.t + dt / tw.dur);
      const k = easeInOut(tw.t);
      camera.position.lerpVectors(tw.fromPos, tw.toPos, k);
      controls.target.lerpVectors(tw.fromTarget, tw.toTarget, k);
      if (tw.t >= 1) this.tween = null;
    } else if (this.keyboardEnabled) {
      this._applyKeyboard(dt);
    }

    controls.update();
    this._clampTarget();
  }

  _applyKeyboard(dt) {
    const k = this.keys;
    if (!k.size) return;
    const { camera, controls } = this;

    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    if (forward.lengthSq() < 1e-6) return;
    forward.normalize();
    const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize();

    const move = new THREE.Vector3();
    if (k.has('KeyW') || k.has('ArrowUp')) move.add(forward);
    if (k.has('KeyS') || k.has('ArrowDown')) move.sub(forward);
    if (k.has('KeyD') || k.has('ArrowRight')) move.add(right);
    if (k.has('KeyA') || k.has('ArrowLeft')) move.sub(right);
    if (move.lengthSq() > 0) {
      const dist = camera.position.distanceTo(controls.target);
      move.normalize().multiplyScalar(dist * 0.9 * dt);
      camera.position.add(move);
      controls.target.add(move);
    }

    let turn = 0;
    if (k.has('KeyQ')) turn += 1;
    if (k.has('KeyE')) turn -= 1;
    if (turn !== 0) {
      const offset = camera.position.clone().sub(controls.target);
      offset.applyAxisAngle(camera.up, turn * 1.6 * dt);
      camera.position.copy(controls.target).add(offset);
    }
  }

  /** Mantém o alvo da câmera dentro da ilha. */
  _clampTarget() {
    const { camera, controls } = this;
    const t = controls.target;
    const cx = THREE.MathUtils.clamp(t.x, -MAP.panLimit.x, MAP.panLimit.x);
    const cz = THREE.MathUtils.clamp(t.z, -MAP.panLimit.z, MAP.panLimit.z);
    const dx = cx - t.x;
    const dz = cz - t.z;
    if (dx !== 0 || dz !== 0) {
      t.x += dx;
      t.z += dz;
      camera.position.x += dx;
      camera.position.z += dz;
    }
    t.y = 0;
  }
}
