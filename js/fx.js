import * as THREE from 'three';
export function createFx(world, { color, count = 40, size = 0.2, rise = 0.4, opacity = 0.8, area = [50, 12, 34] }) {
  const [ax, ay, az] = area, p = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) { p[i*3] = (Math.random()*2-1)*ax; p[i*3+1] = Math.random()*ay; p[i*3+2] = (Math.random()*2-1)*az; }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  const pts = new THREE.Points(g, new THREE.PointsMaterial({ color, size, transparent: true, opacity, depthWrite: false }));
  pts.frustumCulled = false;
  world.add(pts);
  return (t, dt) => {
    for (let i = 0; i < count; i++) { const k = i*3; p[k] += Math.sin(t*0.7+i)*dt*0.4; p[k+1] += rise*dt; if (p[k+1] > ay) p[k+1] = 0; }
    g.attributes.position.needsUpdate = true;
  };
}