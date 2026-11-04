import * as THREE from 'three';
import { COLORS as C } from './config.js';

/** Céu, neblina leve, luz ambiente e sol com sombras. */
export function setupLighting(scene) {
  scene.background = new THREE.Color(C.sky);
  scene.fog = new THREE.Fog(C.sky, 110, 240);

  const hemi = new THREE.HemisphereLight(0xcfeeff, 0x7fae5a, 1.6);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xfff1d0, 2.6);
  sun.position.set(-26, 42, 24);
  sun.target.position.set(0, 0, 0);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -50;
  sun.shadow.camera.right = 50;
  sun.shadow.camera.top = 42;
  sun.shadow.camera.bottom = -42;
  sun.shadow.camera.near = 5;
  sun.shadow.camera.far = 140;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.05;
  scene.add(sun, sun.target);

  return { hemi, sun };
}
