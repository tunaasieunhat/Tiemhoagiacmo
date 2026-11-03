// Mô hình 3D đồ trang trí & máy móc (khối hình đơn giản, màu pastel)
import * as THREE from 'three';
import { rbox, sphere, cyl, cone, at, torus } from './primitives.js';
import { bush } from './environment.js';

const WOOD = '#c9926a', WOOD2 = '#e2b98f';

const BUILDERS = {
  bench() {
    const g = new THREE.Group();
    g.add(at(rbox(1.4, 0.12, 0.5, WOOD2, 0.05), 0, 0.45, 0));
    g.add(at(rbox(1.4, 0.4, 0.1, WOOD2, 0.05), 0, 0.75, -0.22));
    for (const x of [-0.6, 0.6]) for (const z of [-0.18, 0.18]) g.add(at(rbox(0.1, 0.45, 0.1, WOOD, 0.03), x, 0.22, z));
    return g;
  },
  pot() {
    const g = new THREE.Group();
    g.add(at(cyl(0.38, 0.28, 0.5, '#e0a383', 12), 0, 0.25, 0));
    const b = bush('#8fd18b', '#f47a93', 0.75); b.position.y = 0.35;
    g.add(b);
    return g;
  },
  lantern() {
    const g = new THREE.Group();
    g.add(at(cyl(0.05, 0.06, 1.6, '#7c6a8f', 8), 0, 0.8, 0));
    g.add(at(rbox(0.6, 0.06, 0.06, '#7c6a8f', 0.02), 0.25, 1.6, 0));
    const l = sphere(0.22, '#f47a6a', 12); l.scale.set(1, 1.25, 1); l.position.set(0.5, 1.3, 0);
    g.add(l);
    g.add(at(cyl(0.12, 0.12, 0.05, '#f6d67a', 10), 0.5, 1.58, 0));
    g.add(at(cyl(0.1, 0.1, 0.05, '#f6d67a', 10), 0.5, 1.02, 0));
    return g;
  },
  mailbox() {
    const g = new THREE.Group();
    g.add(at(cyl(0.05, 0.05, 0.9, WOOD, 8), 0, 0.45, 0));
    g.add(at(rbox(0.5, 0.36, 0.34, '#f78fa7', 0.12), 0, 1.05, 0));
    g.add(at(rbox(0.04, 0.22, 0.12, '#ffd34e', 0.02), 0.27, 1.2, 0));
    return g;
  },
  birdhouse() {
    const g = new THREE.Group();
    g.add(at(cyl(0.06, 0.06, 1.4, WOOD, 8), 0, 0.7, 0));
    g.add(at(rbox(0.5, 0.45, 0.45, '#9fd6f0', 0.06), 0, 1.6, 0));
    const roof = cone(0.45, 0.35, '#f6a6b9', 4); roof.rotation.y = Math.PI / 4; roof.position.y = 2.0;
    g.add(roof);
    g.add(at(sphere(0.08, '#3b2a22', 8), 0, 1.62, 0.23));
    g.add(at(sphere(0.12, '#ffd34e', 8), 0.12, 2.25, 0));
    return g;
  },
  swing() {
    const g = new THREE.Group();
    for (const x of [-0.8, 0.8]) { const p = cyl(0.07, 0.08, 2.0, WOOD, 8); p.position.set(x, 1, 0); g.add(p); }
    const top = cyl(0.06, 0.06, 1.8, WOOD, 8);
    top.position.y = 2.0;
    top.rotation.z = Math.PI / 2;
    g.add(top);
    for (const x of [-0.3, 0.3]) g.add(at(cyl(0.015, 0.015, 1.4, '#ffffff', 4), x, 1.3, 0));
    g.add(at(rbox(0.8, 0.08, 0.36, '#f78fa7', 0.04), 0, 0.6, 0));
    return g;
  },
  bunny() {
    const g = new THREE.Group();
    g.add(at(rbox(0.7, 0.2, 0.7, '#e6e0d8', 0.06), 0, 0.1, 0));
    const body = sphere(0.32, '#ffffff', 14); body.scale.set(1, 1.1, 0.9); body.position.y = 0.48; g.add(body);
    g.add(at(sphere(0.24, '#ffffff', 14), 0, 0.92, 0.04));
    for (const x of [-0.1, 0.1]) { const e = sphere(0.07, '#ffffff', 8); e.scale.set(0.8, 2.6, 0.6); e.position.set(x, 1.25, 0); g.add(e); const i = sphere(0.035, '#ffc4d6', 6); i.scale.set(0.8, 3, 0.4); i.position.set(x, 1.25, 0.05); g.add(i); }
    for (const x of [-0.09, 0.09]) g.add(at(sphere(0.03, '#3b2a22', 6), x, 0.95, 0.24));
    g.add(at(sphere(0.04, '#ffab9c', 6), 0, 0.88, 0.27));
    return g;
  },
  teaset() {
    const g = new THREE.Group();
    g.add(at(cyl(0.55, 0.55, 0.08, WOOD2, 18), 0, 0.6, 0));
    g.add(at(cyl(0.08, 0.12, 0.6, WOOD, 8), 0, 0.3, 0));
    g.add(at(sphere(0.14, '#9fe0c4', 10), 0, 0.76, 0));
    for (let i = 0; i < 3; i++) { const a = i * 2.1; g.add(at(cyl(0.06, 0.05, 0.08, '#ffffff', 8), Math.cos(a) * 0.32, 0.68, Math.sin(a) * 0.32)); }
    for (const a of [0.8, 3.9]) { const st = cyl(0.2, 0.2, 0.36, WOOD2, 10); st.position.set(Math.cos(a) * 0.95, 0.18, Math.sin(a) * 0.95); g.add(st); }
    return g;
  },
  windmill() {
    const g = new THREE.Group();
    g.add(at(cyl(0.35, 0.55, 2.2, '#fff3e6', 8), 0, 1.1, 0));
    g.add(at(cone(0.5, 0.6, '#f6a6b9', 8), 0, 2.5, 0));
    g.add(at(rbox(0.3, 0.5, 0.06, '#a87458', 0.04), 0, 0.3, 0.5));
    const blades = new THREE.Group(); blades.position.set(0, 2.0, 0.45);
    for (let i = 0; i < 4; i++) { const b = rbox(0.18, 1.1, 0.04, '#ffffff', 0.03); b.position.y = 0.55; const h = new THREE.Group(); h.rotation.z = (i * Math.PI) / 2; h.add(b); blades.add(h); }
    blades.add(sphere(0.1, '#ffd34e', 8));
    g.add(blades);
    g.userData.spin = blades;
    return g;
  },
  fountain() {
    const g = new THREE.Group();
    g.add(at(cyl(1.0, 1.1, 0.35, '#d8d2cb', 20), 0, 0.17, 0));
    const w = cyl(0.88, 0.88, 0.05, '#9fdcf0', 20); w.position.y = 0.33; g.add(w);
    g.add(at(cyl(0.15, 0.2, 0.9, '#e6e0d8', 10), 0, 0.6, 0));
    g.add(at(cyl(0.45, 0.3, 0.14, '#d8d2cb', 14), 0, 1.05, 0));
    const jet = sphere(0.16, '#cfeefe', 10); jet.position.y = 1.3; g.add(jet);
    g.userData.bob = jet;
    return g;
  },
  arch() {
    const g = new THREE.Group();
    const a = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.09, 8, 24, Math.PI), torus(1, 0.09, '#f3dcc0').material); a.position.y = 1.4; g.add(a);
    for (const x of [-1, 1]) g.add(at(cyl(0.09, 0.09, 1.4, '#f3dcc0', 8), x, 0.7, 0));
    for (let i = 0; i < 12; i++) { const t = (i / 11) * Math.PI; g.add(at(sphere(0.12, i % 2 ? '#f47a93' : '#8fd18b', 8), Math.cos(t) * 1.0, 1.4 + Math.sin(t) * 1.0, 0.05)); }
    return g;
  },
  balloon() {
    const g = new THREE.Group();
    const b = sphere(0.9, '#f78fa7', 18); b.scale.set(1, 1.15, 1); b.position.y = 3.0; g.add(b);
    for (let i = 0; i < 6; i++) { const s = sphere(0.905, i % 2 ? '#ffd34e' : '#9fd6f0', 18); s.scale.set(0.25, 1.16, 1.01); s.rotation.y = (i * Math.PI) / 3; s.position.y = 3.0; g.add(s); }
    g.add(at(rbox(0.6, 0.4, 0.6, WOOD, 0.08), 0, 1.4, 0));
    for (const [x, z] of [[-0.25, -0.25], [0.25, -0.25], [-0.25, 0.25], [0.25, 0.25]]) g.add(at(cyl(0.015, 0.015, 1.0, '#7c6a5e', 4), x, 1.95, z));
    g.add(at(cyl(0.05, 0.05, 1.4, '#7c6a5e', 6), 0, 0.7, 0));
    g.userData.bob = b;
    return g;
  },
};

export function buildDecor(id) {
  const g = (BUILDERS[id] || BUILDERS.pot)();
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}

/** Vòi tưới tự động (đặt ở góc lô) */
export function buildSprinkler() {
  const g = new THREE.Group();
  g.add(at(cyl(0.05, 0.05, 0.9, '#aeb7c2', 8), 0, 0.45, 0));
  const head = new THREE.Group(); head.position.y = 0.95;
  head.add(sphere(0.1, '#6fbbe8', 10));
  for (let i = 0; i < 3; i++) { const n = cyl(0.025, 0.025, 0.3, '#6fbbe8', 6); n.rotation.z = Math.PI / 2; n.position.x = 0.15; const h = new THREE.Group(); h.rotation.y = (i * Math.PI * 2) / 3; h.add(n); head.add(h); }
  g.add(head);
  g.userData.spin = head;
  return g;
}

/** Máy bón phân nhỏ */
export function buildFeeder() {
  const g = new THREE.Group();
  g.add(at(rbox(0.45, 0.4, 0.45, '#f6d67a', 0.08), 0, 0.2, 0));
  g.add(at(cone(0.25, 0.3, '#c9a27e', 10), 0, 0.55, 0));
  g.add(at(sphere(0.06, '#7cc27f', 8), 0.15, 0.32, 0.23));
  return g;
}
