// 🌫️ Mũi Én (GĐ21): hòn đảo phía đông — hải đăng, bến thuyền, đồi bậc thang, bãi hũ hứng sương, sạp hoa khô.
// Màu đảo đổi dần từ xám tro sang xanh/tím theo điểm "Mây về" (sync). Nhà và dân đảo do hệ thống làng dựng (data/village.js).
import * as THREE from 'three';
import { rbox, sphere, cyl, cone, at, textSprite } from '../models/primitives.js';
import { EN, EN_PLOTS } from '../../data/muien.js';

const std = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.9, ...extra });
const WOOD = '#b8845f', WOOD_D = '#8a5f3c';
const lerpColor = (m, a, b, t) => m.color.set(a).lerp(new THREE.Color(b), t);

function glowSprite(color, size) {
  const c = document.createElement('canvas');
  c.width = c.height = 96;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(48, 48, 2, 48, 48, 46);
  g.addColorStop(0, 'rgba(255,255,255,.7)'); g.addColorStop(0.4, color + '77'); g.addColorStop(1, color + '00');
  x.fillStyle = g; x.fillRect(0, 0, 96, 96);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  s.scale.set(size, size, 1);
  return s;
}

function fogSprite() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(64, 64, 4, 64, 64, 62);
  g.addColorStop(0, 'rgba(240,244,246,.75)'); g.addColorStop(0.6, 'rgba(232,238,240,.3)'); g.addColorStop(1, 'rgba(232,238,240,0)');
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false }));
}

/** Thuyền buồm nhỏ (dùng ở cả hai bến) */
export function sailBoat() {
  const g = new THREE.Group();
  const h = rbox(2.6, 0.5, 1.0, WOOD, 0.22); h.position.y = 0.42; g.add(h);
  g.add(at(rbox(2.2, 0.12, 0.7, '#e8cba8', 0.04), 0, 0.62, 0));
  const bow = sphere(0.5, WOOD, 8); bow.scale.set(1.2, 0.55, 0.95); bow.position.set(1.35, 0.44, 0); g.add(bow);
  g.add(at(cyl(0.04, 0.05, 2.0, WOOD_D, 6), 0, 1.6, 0));
  g.add(at(rbox(0.04, 1.3, 1.1, '#ffffff', 0.02), 0.05, 1.75, 0));
  const hit = new THREE.Mesh(new THREE.BoxGeometry(3.4, 3.2, 2.0), new THREE.MeshBasicMaterial({ visible: false })); hit.position.y = 1.4; g.add(hit);
  g.userData.pick = { kind: 'sail' };
  return g;
}

export class MuiEnView {
  constructor(scene) {
    this.root = new THREE.Group();
    scene.add(this.root);
    this.t = 0;
    this.key = '';
    const [cx, cz] = EN.center, R = EN.radius;
    // ----- đảo -----
    this.grassMat = std('#bcc0b0');
    this.hillMat = std('#b3b8a8');
    this.root.add(at(cyl(R, R - 1.2, 1.4, '#d9c7a8', 48, { cast: false, receive: true }), cx, -0.72, cz));
    this.root.add(at(cyl(R + 0.15, R + 0.15, 0.2, this.grassMat, 48, { cast: false, receive: true }), cx, -0.1, cz));
    // mỏm đá phía đông bắc (chỗ hải đăng)
    const [lx, lz] = EN.lighthouse;
    this.root.add(at(cyl(2.6, 3.4, 0.7, '#a8a39b', 10, { cast: false, receive: true }), lx, 0.3, lz));
    // ----- hải đăng -----
    const lh = new THREE.Group(); lh.position.set(lx, 0.65, lz);
    lh.add(at(cyl(0.95, 1.25, 5.2, '#f6f2ea', 14), 0, 2.6, 0));
    for (const y of [1.3, 3.5]) lh.add(at(cyl(1.07 - y * 0.055 + 0.03, 1.13 - y * 0.055 + 0.03, 0.7, '#d2584c', 14), 0, y, 0));
    lh.add(at(cyl(1.25, 1.25, 0.14, '#5b6677', 14), 0, 5.25, 0));
    lh.add(at(cyl(0.7, 0.7, 0.9, new THREE.MeshStandardMaterial({ color: '#cfeefe', transparent: true, opacity: 0.55 }), 10), 0, 5.75, 0));
    lh.add(at(cone(0.95, 0.75, '#d2584c', 12), 0, 6.55, 0));
    this.lampBulb = at(sphere(0.3, new THREE.MeshBasicMaterial({ color: '#fff3b8' }), 10), 0, 5.75, 0);
    lh.add(this.lampBulb);
    this.lampGlow = glowSprite('#ffe9a0', 5); this.lampGlow.position.y = 5.75; lh.add(this.lampGlow);
    // chùm sáng quay
    this.beam = new THREE.Group(); this.beam.position.y = 5.75;
    const bm = new THREE.MeshBasicMaterial({ color: '#fff3c4', transparent: true, opacity: 0.22, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
    for (const s of [1, -1]) { const b = new THREE.Mesh(new THREE.ConeGeometry(1.5, 13, 12, 1, true), bm); b.rotation.z = s * Math.PI / 2; b.position.x = s * 6.5; this.beam.add(b); }
    lh.add(this.beam);
    this.root.add(lh);
    // ----- bến thuyền + thuyền -----
    const [dx, dz] = EN.dock;
    for (let i = 0; i < 9; i++) this.root.add(at(rbox(0.46, 0.1, 1.5, i % 2 ? WOOD : '#c9966f', 0.03), dx + 1.6 - i * 0.5, 0.02, dz));
    for (const x of [dx - 2.3, dx - 0.4]) for (const z of [dz - 0.7, dz + 0.7]) this.root.add(at(cyl(0.08, 0.1, 1.5, WOOD_D, 6), x, -0.4, z));
    this.boat = sailBoat();
    this.boat.position.set(dx - 2.2, -1.0, dz + 1.9); this.boat.rotation.y = 0.3;
    this.root.add(this.boat);
    // ----- ba bậc thang: tường đá chắn + nền đất (lô chưa nhận) -----
    this.patches = {};
    const stone = '#b9b2a6';
    Object.entries(EN_PLOTS).forEach(([id, P], i) => {
      this.root.add(at(rbox(5.4, 0.5 + i * 0.12, 0.45, stone, 0.12), P.x, 0.2, P.z - 2.75));
      this.root.add(at(rbox(0.45, 0.4 + i * 0.1, 5.2, stone, 0.12), P.x + 2.75, 0.16, P.z));
      const patch = at(rbox(4.7, 0.06, 4.7, '#b7a48f', 0.03, { cast: false, receive: true }), P.x, 0.03, P.z);
      this.patches[id] = patch; this.root.add(patch);
    });
    // ----- bụi oải hương trên sườn đồi: xám → tím -----
    this.lavMat = std('#aaa6ad');
    this.lavLeaf = std('#a9ad9f');
    const spots = [];
    for (let i = 0; i < 60 && spots.length < 30; i++) {
      const a = i * 2.399 + 0.7, r = 3 + ((i * 53) % 90) / 10;
      const x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r;
      if (Math.hypot(x - cx, z - cz) > R - 1.3) continue;
      if (Object.values(EN_PLOTS).some((P) => Math.abs(x - P.x) < 3.3 && Math.abs(z - P.z) < 3.3)) continue;
      if (Math.hypot(x - lx, z - lz) < 3.6 || Math.hypot(x - dx, z - dz) < 3 || Math.hypot(x - EN.sapling[0], z - EN.sapling[1]) < 1.8) continue;
      if ([[65.2, -3.5], [57.5, 10.5], [67.5, 12], [60.4, 6.2], [56.6, 7.6], [65.2, 9.4], [60.2, 9.6], [62.6, -1.6], [56.8, 6.2], [63, 8.6]].some(([hx, hz]) => Math.hypot(x - hx, z - hz) < 2.4)) continue;
      spots.push([x, z]);
    }
    for (const [x, z] of spots) {
      const b = new THREE.Group(); b.position.set(x, 0, z); b.scale.setScalar(1.45);
      const base = sphere(0.34, this.lavLeaf, 8); base.scale.set(1.1, 0.6, 1.1); base.position.y = 0.18; b.add(base);
      for (let k = 0; k < 5; k++) { const sp = cone(0.07, 0.42, this.lavMat, 6); sp.position.set(Math.cos(k * 1.26) * 0.2, 0.52, Math.sin(k * 1.26) * 0.2); sp.castShadow = false; b.add(sp); }
      this.root.add(b);
    }
    // ----- bãi hũ hứng sương của Triều -----
    const jar = std('#c9b9a2');
    for (let i = 0; i < 20; i++) { const j = cyl(0.13, 0.11, 0.26 + (i % 3) * 0.05, jar, 8); j.position.set(64.2 + (i % 5) * 0.42, 0.14, 8.0 + Math.floor(i / 5) * 0.42 - (i % 2) * 0.08); this.root.add(j); }
    // ----- sạp hoa khô của Bà Sáo -----
    const stall = new THREE.Group(); stall.position.set(56.2, 0, 6.6); stall.rotation.y = 0.6;
    stall.add(at(rbox(1.9, 0.1, 0.8, WOOD, 0.03), 0, 0.8, 0));
    for (const x of [-0.85, 0.85]) { stall.add(at(cyl(0.05, 0.05, 0.8, WOOD_D, 5), x, 0.4, 0.3)); stall.add(at(cyl(0.05, 0.05, 2.0, WOOD_D, 5), x, 1.0, -0.3)); }
    stall.add(at(rbox(2.1, 0.08, 1.0, '#c9a8d8', 0.03), 0, 2.0, 0));
    ['#c9a27e', '#b99ab0', '#d8c08a', '#a8a0b8', '#c8a890'].forEach((c, i) => { const d = sphere(0.14, c, 6); d.scale.set(0.8, 1.3, 0.8); d.position.set(-0.7 + i * 0.35, 1.68, -0.25); stall.add(d); stall.add(at(sphere(0.12, c, 6), -0.7 + i * 0.35, 0.95, 0.05)); });
    this.root.add(stall);
    // ----- ghế gỗ giữa đảo -----
    const bench = new THREE.Group(); bench.position.set(60.2, 0, 10.2); bench.rotation.y = 0.35;
    bench.add(at(rbox(1.5, 0.1, 0.45, WOOD, 0.03), 0, 0.42, 0)); bench.add(at(rbox(1.5, 0.45, 0.08, WOOD, 0.03), 0, 0.72, -0.2));
    for (const x of [-0.6, 0.6]) bench.add(at(rbox(0.1, 0.42, 0.4, WOOD_D, 0.02), x, 0.21, 0));
    this.root.add(bench);
    // ----- lòng suối cạn (có nước sau cơn mưa) -----
    this.streamMat = std('#b8b0a2');
    [[66.6, -0.2], [65.2, 1.4], [64.6, 3.6], [65.4, 5.4], [67.2, 9.4], [69.4, 10.6], [71.4, 11.2]].forEach(([x, z], i, arr) => {
      if (!i) return;
      const [px, pz] = arr[i - 1], len = Math.hypot(x - px, z - pz);
      const s = rbox(len + 0.4, 0.05, 0.7, this.streamMat, 0.02, { cast: false, receive: true });
      s.position.set((x + px) / 2, 0.035, (z + pz) / 2); s.rotation.y = -Math.atan2(z - pz, x - px);
      this.root.add(s);
    });
    // ----- nhánh Cây Mộng -----
    this.sapling = new THREE.Group(); this.sapling.position.set(EN.sapling[0], 0, EN.sapling[1]);
    this.sapling.add(at(cyl(0.05, 0.08, 0.9, '#8d7566', 6), 0, 0.45, 0));
    this.sapLeafMat = std('#ffc4dd', { emissive: new THREE.Color('#ff9fc8'), emissiveIntensity: 0.25 });
    this.sapLeaves = new THREE.Group();
    [[0, 1.0, 0, 0.3], [0.22, 0.85, 0.1, 0.2], [-0.2, 0.9, -0.08, 0.22], [0.05, 1.25, -0.12, 0.2]].forEach(([x, y, z, r]) => { const s = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6), this.sapLeafMat); s.position.set(x, y, z); this.sapLeaves.add(s); });
    this.sapling.add(this.sapLeaves);
    this.sapGlow = glowSprite('#ffc4dd', 2.2); this.sapGlow.position.y = 1.0; this.sapling.add(this.sapGlow);
    this.sapling.visible = false;
    this.root.add(this.sapling);
    // ----- sương mù -----
    this.fogs = [];
    for (let i = 0; i < 9; i++) {
      const f = fogSprite(); const a = i * 0.7, r = 3 + (i % 4) * 2.4;
      f.userData = { x: cx + Math.cos(a) * r, z: cz + Math.sin(a) * r, ph: i * 1.3, y: 1.4 + (i % 3) * 0.9 };
      f.scale.set(9 + (i % 3) * 3, 4.5 + (i % 2) * 1.5, 1);
      this.fogs.push(f); this.root.add(f);
    }
    const label = textSprite('Mũi Én', { sub: 'Đảo ba mươi năm không mưa', scale: 0.9 });
    label.position.set(cx - 1, 6.5, cz - 6);
    this.label = label; this.root.add(label);
  }

  /** st: { p: 0..1 độ xanh, rain, lamp, sapling, owned: { en1: true… }, boat } */
  sync(st) {
    const key = JSON.stringify(st);
    if (key === this.key) return;
    this.key = key;
    const p = Math.max(0, Math.min(1, st.p));
    lerpColor(this.grassMat, '#bcc0b0', '#a9dba0', p);
    lerpColor(this.lavMat, '#aaa6ad', '#a48be6', p);
    lerpColor(this.lavLeaf, '#a9ad9f', '#8fc79a', p);
    lerpColor(this.streamMat, '#b8b0a2', '#8fd0ea', st.rain ? 1 : 0);
    for (const [id, m] of Object.entries(this.patches)) m.visible = !st.owned[id];
    this.sapling.visible = !!st.sapling;
    const k = st.rain ? 1.9 : 1 + p * 0.5;
    this.sapling.scale.setScalar(k);
    this.fogAmt = st.rain ? 0.12 : 0.55 * (1 - p * 0.7);
    this.lampOn = st.lamp;
    this.boat.visible = !!st.boat;
    this.label.visible = !!st.boat;
  }

  update(dt, { night = 0 } = {}) {
    this.t += dt;
    const t = this.t;
    this.beam.rotation.y = t * 0.5;
    this.beam.visible = this.lampOn && night > 0.25;
    this.lampBulb.visible = this.lampOn;
    this.lampGlow.visible = this.lampOn;
    this.lampGlow.material.opacity = 0.35 + 0.6 * night;
    for (const f of this.fogs) {
      f.position.set(f.userData.x + Math.sin(t * 0.12 + f.userData.ph) * 2.2, f.userData.y, f.userData.z + Math.cos(t * 0.1 + f.userData.ph) * 1.6);
      f.material.opacity = (this.fogAmt ?? 0.5) * (0.75 + 0.25 * Math.sin(t * 0.3 + f.userData.ph));
    }
    if (this.sapling.visible) { this.sapLeaves.rotation.y = Math.sin(t * 0.8) * 0.15; this.sapGlow.material.opacity = 0.3 + 0.5 * night; }
    if (this.boat.visible) { this.boat.position.y = -1.0 + Math.sin(t * 1.4) * 0.05; this.boat.rotation.z = Math.sin(t * 1.1) * 0.04; }
  }
}
