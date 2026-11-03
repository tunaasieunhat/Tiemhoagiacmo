// Hiệu ứng hạt đơn giản: nước, đất, lấp lánh, lá.
import * as THREE from 'three';
import { mat } from '../models/materials.js';

const GEO = new THREE.SphereGeometry(1, 6, 5);
const PRESETS = {
  water: { color: '#6fc3ee', n: 14, size: 0.06, speed: 1.6, up: 1.2, gravity: 7, life: 0.7 },
  dirt: { color: '#8d6248', n: 12, size: 0.07, speed: 2.0, up: 2.4, gravity: 9, life: 0.6 },
  sparkle: { color: '#ffe17a', n: 16, size: 0.06, speed: 1.2, up: 2.6, gravity: -0.5, life: 1.0 },
  leaf: { color: '#8fd18b', n: 10, size: 0.07, speed: 1.4, up: 1.8, gravity: 4, life: 0.8 },
  fert: { color: '#e8d3a6', n: 12, size: 0.05, speed: 1.2, up: 1.6, gravity: 6, life: 0.7 },
  seed: { color: '#f3e1b5', n: 6, size: 0.05, speed: 0.8, up: 1.4, gravity: 8, life: 0.5 },
  spray: { color: '#b8f0c8', n: 14, size: 0.06, speed: 1.0, up: 1.0, gravity: 1.5, life: 0.9 },
};

export class Particles {
  constructor(scene) {
    this.group = new THREE.Group();
    scene.add(this.group);
    this.live = [];
    this.pool = [];
  }

  spawn(kind, pos) {
    const p = PRESETS[kind];
    if (!p) return;
    for (let i = 0; i < p.n; i++) {
      let m = this.pool.pop();
      if (!m) { m = new THREE.Mesh(GEO, mat(p.color)); this.group.add(m); }
      m.material = mat(p.color);
      m.visible = true;
      m.position.copy(pos);
      m.position.y += 0.3;
      const a = Math.random() * Math.PI * 2;
      const s = p.speed * (0.4 + Math.random() * 0.6);
      m.userData = {
        v: new THREE.Vector3(Math.cos(a) * s, p.up * (0.6 + Math.random() * 0.6), Math.sin(a) * s),
        g: p.gravity, life: p.life * (0.7 + Math.random() * 0.5), age: 0, size: p.size * (0.7 + Math.random() * 0.6),
      };
      m.scale.setScalar(m.userData.size);
      this.live.push(m);
    }
  }

  update(dt) {
    for (let i = this.live.length - 1; i >= 0; i--) {
      const m = this.live[i];
      const d = m.userData;
      d.age += dt;
      if (d.age >= d.life || m.position.y < -0.2) {
        m.visible = false;
        this.live.splice(i, 1);
        this.pool.push(m);
        continue;
      }
      d.v.y -= d.g * dt;
      m.position.addScaledVector(d.v, dt);
      m.scale.setScalar(d.size * (1 - (d.age / d.life) * 0.6));
    }
  }
}

/** Đom đóm bay quanh ao & nông trại vào ban đêm */
export class Fireflies {
  constructor(scene, anchors) {
    const n = 40;
    const geo = new THREE.BufferGeometry();
    this.base = [];
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const a = anchors[i % anchors.length];
      const b = new THREE.Vector3(a.x + (Math.random() - 0.5) * 7, 0.5 + Math.random() * 1.8, a.z + (Math.random() - 0.5) * 7);
      this.base.push({ p: b, ph: Math.random() * 10 });
      pos.set([b.x, b.y, b.z], i * 3);
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.mat = new THREE.PointsMaterial({ color: '#fff3a0', size: 0.18, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
    this.points = new THREE.Points(geo, this.mat);
    this.points.frustumCulled = false;
    scene.add(this.points);
  }

  update(t, nightAmount) {
    this.mat.opacity = nightAmount * 0.95;
    this.points.visible = nightAmount > 0.05;
    if (!this.points.visible) return;
    const arr = this.points.geometry.attributes.position.array;
    this.base.forEach((b, i) => {
      arr[i * 3] = b.p.x + Math.sin(t * 0.6 + b.ph) * 0.6;
      arr[i * 3 + 1] = b.p.y + Math.sin(t * 1.3 + b.ph * 2) * 0.3;
      arr[i * 3 + 2] = b.p.z + Math.cos(t * 0.5 + b.ph) * 0.6;
    });
    this.points.geometry.attributes.position.needsUpdate = true;
  }
}
