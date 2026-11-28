// 🌳 Thế giới của cốt truyện GĐ20B: Đồi Mộng + Cây Mộng + cây cầu, kệ Nụ Mộng cạnh hiên tiệm,
// Hoa Mộng đã trao đặt trước nhà chủ, con thuyền của Ông Ba, ngọn đèn Mơ, bà Diệp ngồi bên hiên.
// Tất cả vẽ theo trạng thái trong save.story (gọi sync mỗi khi truyện đổi).
import * as THREE from 'three';
import { rbox, sphere, cyl, at } from '../models/primitives.js';
import { buildCharacter } from '../models/character.js';
import { BUDS, CAST, STORY_RULES } from '../../data/story.js';
import { HOUSES, VILLAGE } from '../../data/village.js';
import { homeOf } from '../systems/village.js';

const WOOD = '#b8845f', WOOD_D = '#8a5f3c';
const std = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...extra });

function halo(color, size = 1.6) {
  const c = document.createElement('canvas');
  c.width = c.height = 96;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(48, 48, 2, 48, 48, 46);
  g.addColorStop(0, 'rgba(255,255,255,.55)'); g.addColorStop(0.4, color + '66'); g.addColorStop(1, color + '00');
  x.fillStyle = g; x.fillRect(0, 0, 96, 96);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  s.scale.set(size, size, 1);
  return s;
}

/** Chậu + nụ xám (bloom = false) hoặc Hoa Mộng phát sáng (bloom = true) */
export function dreamPot(def, bloom) {
  const g = new THREE.Group();
  g.add(at(cyl(0.2, 0.14, 0.24, '#d99f7e', 10), 0, 0.12, 0));
  g.add(at(cyl(0.21, 0.21, 0.04, '#c4835f', 10), 0, 0.24, 0));
  if (!bloom) {
    g.add(at(cyl(0.02, 0.025, 0.26, '#8f9a86', 5), 0, 0.38, 0));
    const b = sphere(0.09, '#a9a79f', 8); b.scale.set(0.8, 1.35, 0.8); b.position.y = 0.56; g.add(b);
    g.add(at(sphere(0.05, '#99a08f', 6), 0.07, 0.36, 0));
    return g;
  }
  const petal = std(def.color, { emissive: new THREE.Color(def.glow), emissiveIntensity: 0.45 });
  g.add(at(cyl(0.022, 0.028, 0.42, '#7fc277', 5), 0, 0.46, 0));
  g.add(at(sphere(0.06, '#8fd18b', 6), 0.09, 0.42, 0.02));
  const head = new THREE.Group(); head.position.y = 0.72;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const p = sphere(0.1, petal, 8); p.scale.set(1, 0.42, 0.62);
    p.position.set(Math.cos(a) * 0.12, 0, Math.sin(a) * 0.12); p.rotation.y = -a; p.rotation.z = 0.35;
    p.castShadow = false;
    head.add(p);
  }
  head.add(sphere(0.065, new THREE.MeshBasicMaterial({ color: '#fff7c8' }), 8));
  g.add(head);
  const h = halo(def.glow, 1.3); h.position.y = 0.72; g.add(h);
  g.userData.head = head; g.userData.halo = h;
  return g;
}

export class DreamWorld {
  /** shop: nhóm 3D của tiệm (kệ nụ, đèn, bà Diệp gắn theo tọa độ tiệm) */
  constructor(scene, shop) {
    this.root = new THREE.Group();
    scene.add(this.root);
    this.shop = shop;
    this.t = 0;
    this.key = '';
    this.pots = {};
    this.buildHill();
    this.buildBridge();
    this.buildBoat();
    this.buildShelf();
    this.given = new THREE.Group(); this.root.add(this.given);
    // ngọn đèn Mơ (kết "Cả làng cùng mơ")
    this.lamp = new THREE.Group();
    this.lamp.add(at(cyl(0.03, 0.04, 1.3, WOOD_D, 6), 0, 0.65, 0));
    this.lamp.add(at(rbox(0.3, 0.05, 0.3, WOOD_D, 0.02), 0, 1.3, 0));
    this.lamp.add(at(sphere(0.13, new THREE.MeshBasicMaterial({ color: '#d9fff2' }), 10), 0, 1.12, 0));
    this.lampHalo = halo('#bff5e6', 1.7); this.lampHalo.position.y = 1.12; this.lamp.add(this.lampHalo);
    this.lamp.position.set(3.75, 0.25, 3.1);
    this.lamp.visible = false;
    shop.add(this.lamp);
    // bà Diệp ngồi bên hiên (sau khi tỉnh)
    const d = buildCharacter(CAST.diep.look);
    d.root.scale.setScalar(0.94);
    this.diep = new THREE.Group();
    this.diep.add(at(rbox(0.5, 0.36, 0.5, WOOD, 0.06), 0, 0.18, 0));
    d.root.position.y = 0.16; d.body.position.y = -0.1; d.legL.rotation.x = d.legR.rotation.x = -1.3;
    this.diep.add(d.root);
    const hit = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 1.8, 8), new THREE.MeshBasicMaterial({ visible: false })); hit.position.y = 0.9; this.diep.add(hit);
    this.diep.position.set(3.0, 0.25, 3.7); // ngồi ghế nhỏ bên phải hiên, cạnh ngọn đèn
    this.diep.rotation.y = -0.25;
    this.diep.userData.pick = { kind: 'diep' };
    this.diep.visible = false;
    this.diepCh = d;
    shop.add(this.diep);
  }

  buildHill() {
    const [hx, hz] = STORY_RULES.hill;
    const g = new THREE.Group(); g.position.set(hx, 0, hz);
    g.add(at(cyl(7, 5.8, 1.4, '#e3c39d', 40, { cast: false, receive: true }), 0, -0.72, 0));
    g.add(at(cyl(7.15, 7.15, 0.2, '#a9d6a0', 40, { cast: false, receive: true }), 0, -0.1, 0));
    g.add(at(cyl(4.2, 5.2, 0.5, '#9ccf96', 28, { cast: false, receive: true }), 0, 0.2, -0.6));
    // thân + rễ
    const bark = std('#8d7566');
    g.add(at(cyl(0.95, 1.5, 4.4, bark, 12), 0, 2.5, -0.6));
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2 + 0.3;
      const r = cyl(0.22, 0.42, 2.6, bark, 7);
      r.position.set(Math.cos(a) * 1.7, 0.55, -0.6 + Math.sin(a) * 1.7);
      r.rotation.z = Math.cos(a) * 1.15; r.rotation.x = -Math.sin(a) * 1.15;
      g.add(r);
    }
    for (const [x, y, z, rz, rx] of [[1.3, 5.0, -0.3, -0.9, 0.2], [-1.4, 5.2, -0.8, 0.9, -0.1], [0.2, 5.4, -1.8, 0.1, -0.9], [0.1, 5.3, 0.7, -0.1, 0.8]]) {
      const b = cyl(0.25, 0.42, 2.6, bark, 7); b.position.set(x, y, z); b.rotation.z = rz; b.rotation.x = rx; g.add(b);
    }
    // tán lá: xám tro khi héo → hồng phấn khi nở
    this.leafMat = std('#b9b4ad', { emissive: new THREE.Color('#ff9fc8'), emissiveIntensity: 0 });
    this.canopy = new THREE.Group();
    const blobs = [[0, 7.2, -0.6, 2.4], [2.3, 6.5, -0.2, 1.8], [-2.4, 6.6, -0.9, 1.9], [0.3, 6.6, -2.6, 1.8], [0.2, 6.4, 1.4, 1.7], [1.7, 7.6, -1.6, 1.5], [-1.5, 7.7, 0.3, 1.5], [3.4, 5.8, -1.3, 1.2], [-3.3, 5.9, 0.1, 1.2]];
    blobs.forEach(([x, y, z, r], i) => { const s = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 9), this.leafMat); s.position.set(x, y, z); s.castShadow = true; s.userData.base = r; s.userData.i = i; this.canopy.add(s); });
    g.add(this.canopy);
    // hoa sáng trên tán (chỉ hiện khi cây nở)
    this.blossoms = new THREE.Group();
    const bm = new THREE.MeshBasicMaterial({ color: '#fff3c4' });
    for (let i = 0; i < 46; i++) {
      const a = i * 2.399, rr = 1.2 + (i % 7) * 0.45, y = 5.6 + ((i * 37) % 30) / 10;
      const s = new THREE.Mesh(new THREE.SphereGeometry(0.11, 6, 5), bm); s.position.set(Math.cos(a) * rr, y, -0.6 + Math.sin(a) * rr * 0.9); this.blossoms.add(s);
    }
    this.treeHalo = halo('#ffc4dd', 13); this.treeHalo.position.set(0, 6.8, -0.6); this.blossoms.add(this.treeHalo);
    this.blossoms.visible = false;
    g.add(this.blossoms);
    // chiếc lá xanh đầu tiên (sau chương 6)
    this.leaf = at(sphere(0.22, new THREE.MeshBasicMaterial({ color: '#7fdc7a' }), 8), 1.9, 5.1, 0.9);
    this.leaf.scale.set(1, 0.5, 0.7); this.leaf.visible = false; g.add(this.leaf);
    // bà Diệp ngủ giữa vòng rễ
    const d = buildCharacter(CAST.diep.look);
    d.root.scale.setScalar(0.94);
    d.root.rotation.x = -Math.PI / 2 + 0.25; d.root.rotation.z = 0.5;
    d.root.position.set(0.9, 0.62, 1.45);
    this.sleeper = d.root; this.sleeper.visible = false;
    g.add(this.sleeper);
    this.hill = g;
    this.root.add(g);
  }

  buildBridge() {
    const g = new THREE.Group();
    const z0 = -24.5, z1 = -30.3, n = 13;
    this.planks = [];
    for (let i = 0; i < n; i++) {
      const p = rbox(1.5, 0.1, 0.38, i % 2 ? WOOD : '#c9966f', 0.03);
      p.position.set(3, 0.02, z0 + ((z1 - z0) * i) / (n - 1));
      p.userData.mid = i >= 3 && i <= 9;
      p.userData.i = i;
      this.planks.push(p); g.add(p);
    }
    for (const z of [z0, z1]) for (const x of [2.2, 3.8]) g.add(at(cyl(0.08, 0.1, 1.1, WOOD_D, 6), x, 0.4, z));
    this.ropes = [2.2, 3.8].map((x) => { const r = cyl(0.025, 0.025, Math.abs(z1 - z0), '#d9c9a8', 4); r.rotation.x = Math.PI / 2; r.position.set(x, 0.85, (z0 + z1) / 2); g.add(r); return r; });
    this.bridge = g;
    this.root.add(g);
  }

  buildBoat() {
    const g = new THREE.Group();
    const hull = new THREE.Group();
    const h = rbox(2.6, 0.5, 1.0, WOOD, 0.22); h.position.y = 0.42; hull.add(h);
    hull.add(at(rbox(2.2, 0.12, 0.7, '#e8cba8', 0.04), 0, 0.62, 0));
    const bow = sphere(0.5, WOOD, 8); bow.scale.set(1.2, 0.55, 0.95); bow.position.set(1.35, 0.44, 0); hull.add(bow);
    for (const x of [-0.6, 0.5]) hull.add(at(rbox(0.12, 0.3, 1.02, WOOD_D, 0.03), x, 0.2, 0));
    this.mast = new THREE.Group();
    this.mast.add(at(cyl(0.04, 0.05, 2.0, WOOD_D, 6), 0, 1.6, 0));
    const sail = rbox(0.04, 1.3, 1.1, '#ffffff', 0.02); sail.position.set(0.05, 1.75, 0); this.mast.add(sail);
    hull.add(this.mast);
    g.add(hull);
    this.tarp = sphere(1, '#b7b3a8', 10); this.tarp.scale.set(1.65, 0.62, 0.8); this.tarp.position.y = 0.45; g.add(this.tarp);
    g.position.set(9.3, 0, 21.9); g.rotation.y = 0.5;
    this.boat = g; this.hull = hull;
    this.root.add(g);
  }

  buildShelf() {
    const [sx, sz] = STORY_RULES.shelf;
    const g = new THREE.Group(); g.position.set(sx, 0.25, sz); g.rotation.y = 0.5;
    g.add(at(rbox(1.9, 0.08, 0.5, WOOD, 0.03), 0, 0.5, 0.18));
    g.add(at(rbox(1.3, 0.08, 0.45, WOOD, 0.03), 0, 0.95, -0.12));
    for (const x of [-0.88, 0.88]) g.add(at(rbox(0.09, 0.95, 0.75, WOOD_D, 0.03), x, 0.47, 0.02));
    const hit = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.0, 1.1), new THREE.MeshBasicMaterial({ visible: false })); hit.position.y = 0.9; g.add(hit);
    g.userData.pick = { kind: 'buds' };
    this.slots = { ba: [-0.6, 0.54, 0.18], tu: [0, 0.54, 0.18], duy: [0.6, 0.54, 0.18], ngan: [-0.32, 0.99, -0.12], su: [0.32, 0.99, -0.12] };
    this.potRoot = new THREE.Group(); g.add(this.potRoot);
    g.visible = false;
    this.shelf = g;
    this.shop.add(g);
  }

  /**
   * st: { buds: { id: trạng thái }, bridge, sleeping, bloom, leaf, ending, gaveBa }
   */
  sync(st) {
    const key = JSON.stringify(st);
    if (key === this.key) return;
    this.key = key;
    // kệ nụ
    const have = Object.values(st.buds).some(Boolean);
    this.shelf.visible = have;
    while (this.potRoot.children.length) this.potRoot.remove(this.potRoot.children[0]);
    while (this.given.children.length) this.given.remove(this.given.children[0]);
    this.pots = {};
    for (const [id, s] of Object.entries(st.buds)) {
      const def = BUDS[id];
      if (!s || !def) continue;
      if (s === 'given') {
        // đặt trước nhà chủ, chếch về phía quảng trường
        const h = HOUSES[homeOf(def.owner)];
        if (!h) continue;
        const dx = VILLAGE.center.x - h.x, dz = VILLAGE.center.z - h.z, len = Math.hypot(dx, dz) || 1;
        const p = dreamPot(def, true);
        p.scale.setScalar(1.5);
        p.position.set(h.x + (dx / len) * 2.9 + (dz / len) * 1.1, 0.02, h.z + (dz / len) * 2.9 - (dx / len) * 1.1);
        this.given.add(p); this.pots[id] = p;
        continue;
      }
      const p = dreamPot(def, s !== 'bud');
      p.position.set(...this.slots[id]);
      this.potRoot.add(p); this.pots[id] = p;
    }
    // cầu: gãy thì mất các tấm ván giữa, dây chùng
    for (const p of this.planks) { p.visible = st.bridge || !p.userData.mid; p.rotation.z = st.bridge ? 0 : (p.userData.i === 2 || p.userData.i === 10 ? 0.35 : 0); }
    for (const r of this.ropes) r.visible = !!st.bridge;
    // cây: xám → hồng dần theo số hoa đã nở; nở rộ sau đêm sao băng
    this.alive = st.bloom ? 1 : 0;
    this.leafMat.color.set(st.bloom ? '#ffc4dd' : '#b9b4ad');
    this.blossoms.visible = !!st.bloom;
    this.leaf.visible = !!st.leaf && !st.bloom;
    this.sleeper.visible = !!st.sleeping;
    // thuyền của ông Ba
    this.tarp.visible = !st.gaveBa;
    this.hull.visible = !!st.gaveBa;
    // thuyền xuống nước: kết "Cả làng cùng mơ" hoặc đã sắm buồm đi Mũi Én (GĐ21) — khi đó chạm thuyền để ra khơi
    const afloat = st.ending === 'all' || !!st.boat;
    this.mast.visible = afloat;
    if (afloat) { this.tarp.visible = false; this.hull.visible = true; }
    this.boat.userData.pick = st.boat ? { kind: 'sail' } : null;
    if (afloat) { this.boat.position.set(2.6, -1.0, 50.2); this.boat.rotation.y = -0.4; } else { this.boat.position.set(9.3, 0, 21.9); this.boat.rotation.y = 0.5; }
    this.lamp.visible = st.ending === 'all';
    this.awake = st.ending === 'wake' || st.ending === 'all';
  }

  /** Vị trí kệ nụ trên bản đồ (để lia máy quay) */
  shelfPos() { return this.shelf.getWorldPosition(new THREE.Vector3()).setY(0); }

  update(dt, { night = 0, hour = 12, flash = false } = {}) {
    this.t += dt;
    const t = this.t;
    for (const p of Object.values(this.pots)) {
      if (!p.userData.head) continue;
      p.userData.head.rotation.y = t * 0.5;
      const k = 1.25 + Math.sin(t * 2.2) * 0.12;
      p.userData.halo.scale.set(k, k, 1);
      p.userData.halo.material.opacity = 0.35 + 0.6 * night;
    }
    if (this.blossoms.visible) {
      this.leafMat.emissiveIntensity = 0.12 + 0.3 * night + Math.sin(t * 1.3) * 0.04;
      this.treeHalo.material.opacity = 0.25 + 0.6 * night;
      this.canopy.children.forEach((s) => { const k = 1 + Math.sin(t * 0.9 + s.userData.i) * 0.025; s.scale.setScalar(k); });
    } else this.leafMat.emissiveIntensity = 0;
    if (this.lamp.visible) { const k = 1.6 + Math.sin(t * 2.4) * 0.15; this.lampHalo.scale.set(k, k, 1); }
    if (this.mast.visible) { this.boat.position.y = -1.0 + Math.sin(t * 1.4) * 0.05; this.boat.rotation.z = Math.sin(t * 1.1) * 0.04; }
    // bà Diệp ngồi bên hiên ban ngày
    this.diep.visible = !!this.awake && !flash && hour >= 7 && hour < 19;
    if (this.diep.visible) { this.diepCh.head.rotation.y = Math.sin(t * 0.5) * 0.3; this.diepCh.armR.rotation.x = -0.7 + Math.sin(t * 1.2) * 0.1; }
  }
}
