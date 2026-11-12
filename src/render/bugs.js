// 🐛 Sâu bò trên luống hoa (GĐ16): mô hình nhỏ + vùng chạm to cho dễ bắt; bọ rùa vàng lấp lánh.
import * as THREE from 'three';
import { sphere, at } from '../models/primitives.js';
import { basic } from '../models/materials.js';

const HIT = new THREE.SphereGeometry(0.5, 8, 6);
const HIT_MAT = new THREE.MeshBasicMaterial({ visible: false });
const GOLD_GLOW = basic('#fff2a8');

function caterpillar() {
  const g = new THREE.Group();
  const segs = [];
  for (let i = 0; i < 5; i++) {
    const s = sphere(i === 4 ? 0.085 : 0.07, i % 2 ? '#8cc63f' : '#a5d65a', 10);
    s.position.set(-0.22 + i * 0.1, 0.07, 0);
    g.add(s); segs.push(s);
  }
  const head = segs[4];
  head.add(at(sphere(0.018, '#2b1d16', 6), 0.05, 0.03, 0.04));
  head.add(at(sphere(0.018, '#2b1d16', 6), 0.05, 0.03, -0.04));
  for (const z of [0.03, -0.03]) { const a = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.09, 4), basic('#2b1d16')); a.position.set(0.03, 0.1, z); a.rotation.z = -0.4; head.add(a); }
  g.userData.segs = segs;
  return g;
}

function ladybug() {
  const g = new THREE.Group();
  const shell = sphere(0.13, '#f7c531', 14);
  shell.scale.set(1.15, 0.65, 1);
  shell.position.y = 0.07;
  g.add(shell);
  [[0.04, 0.05], [-0.05, 0.06], [0.02, -0.06], [-0.06, -0.04]].forEach(([x, z]) => g.add(at(sphere(0.026, '#3b2a22', 6), x, 0.135, z)));
  g.add(at(sphere(0.06, '#3b2a22', 8), 0.15, 0.06, 0));
  const glow = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), GOLD_GLOW);
  glow.material = GOLD_GLOW.clone(); glow.material.transparent = true; glow.material.opacity = 0.25; glow.material.depthWrite = false;
  glow.position.y = 0.08;
  g.add(glow);
  g.userData.glow = glow;
  return g;
}

export class BugView {
  constructor(scene) {
    this.root = new THREE.Group();
    scene.add(this.root);
    this.items = new Map();
    this.t = 0;
  }

  add(id, pos, golden) {
    const g = new THREE.Group();
    const body = golden ? ladybug() : caterpillar();
    g.add(body);
    const hit = new THREE.Mesh(HIT, HIT_MAT);
    hit.position.y = 0.25;
    g.add(hit);
    g.position.copy(pos);
    g.rotation.y = Math.random() * Math.PI * 2;
    g.userData.pick = { kind: 'bug', id };
    g.userData.body = body;
    g.userData.phase = Math.random() * 6;
    g.userData.home = pos.clone();
    g.scale.setScalar(0.01);
    this.root.add(g);
    this.items.set(id, g);
  }

  remove(id) {
    const g = this.items.get(id);
    if (!g) return;
    this.root.remove(g);
    this.items.delete(id);
  }

  clear() { for (const id of [...this.items.keys()]) this.remove(id); }

  update(dt) {
    this.t += dt;
    for (const g of this.items.values()) {
      const u = g.userData, t = this.t + u.phase;
      g.scale.setScalar(Math.min(1.7, g.scale.x + dt * 4)); // hiện ra từ từ, to gấp 1,7 cho dễ thấy trên điện thoại
      // bò vòng quanh gốc cây
      const r = 0.32, a = t * 0.6;
      g.position.set(u.home.x + Math.cos(a) * r, u.home.y, u.home.z + Math.sin(a) * r);
      g.rotation.y = -(a + Math.PI / 2); // thân sâu hướng theo chiều bò
      const segs = u.body.userData.segs;
      if (segs) segs.forEach((s, i) => { s.position.y = 0.07 + Math.max(0, Math.sin(t * 7 - i * 0.9)) * 0.05; });
      const glow = u.body.userData.glow;
      if (glow) glow.material.opacity = 0.18 + Math.sin(t * 5) * 0.12;
    }
  }
}
