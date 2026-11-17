// 🎉🏪 (GĐ25) Đồ 3D của Sổ quản lý: đồ trang trí tiệc tại nơi tổ chức + quầy chi nhánh trên các đảo + thuyền buôn Thứ Tư.
// Vẽ lại bằng sync(state) khi thiết kế/chi nhánh thay đổi (khóa chuỗi để không dựng lại thừa).
import * as THREE from 'three';
import { rbox, sphere, cyl, cone, torus, at, textSprite } from '../models/primitives.js';
import { VENUES, PARTY_ITEMS } from '../../data/party.js';
import { BRANCHES } from '../../data/branch.js';
import { sailBoat } from './muien.js';

const WOOD = '#b8845f', WOOD_D = '#8a5f3c';

/** Một chùm hoa nhỏ: n bông màu petal quanh tâm, bán kính r */
function cluster(colors, n, r, y = 0, size = 0.13) {
  const g = new THREE.Group();
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + (i % 2) * 0.4;
    const rr = r * (0.45 + ((i * 37) % 10) / 18);
    const s = sphere(size, i % 3 === 0 ? colors.petalDark : colors.petal, 8);
    s.position.set(Math.cos(a) * rr, y + ((i * 13) % 7) * 0.025, Math.sin(a) * rr);
    s.scale.y = 0.75;
    g.add(s);
  }
  return g;
}

/** Mô hình 1 chỗ trang trí. colors = màu hoa (null = chỗ trống, hiện khung mờ) */
function itemModel(kind, colors) {
  const g = new THREE.Group();
  const leaf = colors?.leaf || '#6fae5c';
  const empty = !colors;
  const c = colors || { petal: '#ffffff', petalDark: '#e6e0da' };
  if (kind === 'arch') {
    const ring = torus(1.35, 0.09, empty ? '#e9dfd2' : leaf); ring.rotation.set(0, 0, 0); ring.scale.set(1, 1.15, 1); ring.position.y = 0.2; g.add(ring);
    if (!empty) for (let i = 0; i < 16; i++) {
      const a = Math.PI * (i / 15);
      const s = sphere(0.17, i % 3 ? c.petal : c.petalDark, 8);
      s.position.set(Math.cos(a) * 1.35, 0.2 + Math.sin(a) * 1.55, 0); g.add(s);
    }
    g.add(at(cyl(0.08, 0.1, 0.4, WOOD_D, 6), -1.35, 0.2, 0), at(cyl(0.08, 0.1, 0.4, WOOD_D, 6), 1.35, 0.2, 0));
  } else if (kind === 'stand') {
    g.add(at(cyl(0.05, 0.08, 1.0, WOOD_D, 6), 0, 0.5, 0));
    g.add(at(cone(0.38, 0.4, '#d9b48a', 10), 0, 1.15, 0).rotateX(Math.PI));
    if (!empty) { g.add(at(cluster(c, 9, 0.32, 0, 0.14), 0, 1.4, 0)); g.add(at(cluster(c, 5, 0.18, 0, 0.13), 0, 1.6, 0)); }
  } else if (kind === 'table') {
    g.add(at(rbox(1.6, 0.08, 0.9, '#fffaf2', 0.03), 0, 0.72, 0));
    for (const [x, z] of [[-0.7, -0.35], [0.7, -0.35], [-0.7, 0.35], [0.7, 0.35]]) g.add(at(cyl(0.04, 0.04, 0.7, WOOD, 6), x, 0.36, z));
    g.add(at(cyl(0.12, 0.09, 0.22, '#cfe6f2', 10), 0, 0.88, 0));
    if (!empty) g.add(at(cluster(c, 7, 0.22, 0, 0.11), 0, 1.04, 0));
  } else if (kind === 'garland') {
    g.add(at(cyl(0.05, 0.05, 1.8, WOOD_D, 6), -1.4, 0.9, 0), at(cyl(0.05, 0.05, 1.8, WOOD_D, 6), 1.4, 0.9, 0));
    for (let i = 0; i <= 12; i++) {
      const t = i / 12, x = -1.4 + 2.8 * t, y = 1.75 - Math.sin(t * Math.PI) * 0.45;
      const s = sphere(empty ? 0.04 : 0.12, empty ? '#e9dfd2' : i % 2 ? c.petal : c.petalDark, 8); s.position.set(x, y, 0); g.add(s);
    }
  } else if (kind === 'lantern') {
    g.add(at(cyl(0.04, 0.05, 1.7, WOOD_D, 6), 0, 0.85, 0));
    const lamp = sphere(0.26, empty ? '#f4ead8' : c.petal, 12); lamp.scale.y = 1.2; lamp.position.y = 1.85; g.add(lamp);
    lamp.material = lamp.material.clone(); lamp.material.emissive = new THREE.Color(empty ? '#000000' : c.petal); lamp.material.emissiveIntensity = empty ? 0 : 0.45;
    if (!empty) g.add(at(cluster(c, 6, 0.24, 0, 0.09), 0, 1.55, 0));
  } else if (kind === 'carpet') {
    const base = rbox(1.0, 0.03, 3.0, empty ? '#efe6da' : '#fff6ee', 0.02); base.position.y = 0.06; g.add(base);
    if (!empty) for (let i = 0; i < 26; i++) { const s = sphere(0.07, i % 2 ? c.petal : c.petalDark, 6); s.scale.y = 0.3; s.position.set(((i * 37) % 9) / 10 - 0.42, 0.09, ((i * 53) % 29) / 10 - 1.4); g.add(s); }
  }
  if (empty) g.traverse((o) => { if (o.material) { o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = 0.45; } });
  return g;
}

/** Quầy chi nhánh nhỏ có mái che + giỏ hoa */
function kiosk(def, lvl, stock) {
  const g = new THREE.Group();
  g.add(at(rbox(2.2, 0.9, 1.0, '#fff3e3', 0.08), 0, 0.45, 0));
  g.add(at(rbox(2.3, 0.1, 1.1, WOOD, 0.03), 0, 0.92, 0));
  for (const x of [-1.05, 1.05]) g.add(at(cyl(0.05, 0.05, 1.7, WOOD_D, 6), x, 1.7, -0.4));
  const roof = rbox(2.6, 0.12, 1.5, ['#f6a6b9', '#8fc9e8', '#ffd36e'][lvl - 1] || '#f6a6b9', 0.05); roof.position.set(0, 2.55, 0); roof.rotation.x = -0.18; g.add(roof);
  // giỏ hoa trên quầy (nhiều hàng = nhiều giỏ)
  const baskets = Math.min(4, Math.ceil(stock / 8));
  const cols = ['#f47a93', '#ffd84d', '#c79cf2', '#ffffff'];
  for (let i = 0; i < baskets; i++) {
    const x = -0.75 + i * 0.5;
    g.add(at(cyl(0.18, 0.14, 0.18, '#d9b48a', 8), x, 1.06, 0.05));
    g.add(at(cluster({ petal: cols[i], petalDark: cols[(i + 1) % 4] }, 5, 0.12, 0, 0.08), x, 1.2, 0.05));
  }
  const sign = textSprite(`${def.icon} ${def.name.replace('Chi nhánh ', '')}`, { scale: 0.55 });
  sign.position.set(0, 3.25, 0); g.add(sign);
  const hit = new THREE.Mesh(new THREE.BoxGeometry(2.8, 3.4, 1.8), new THREE.MeshBasicMaterial({ visible: false })); hit.position.y = 1.5; g.add(hit);
  return g;
}

/** Biển "Đất trống — mở chi nhánh" khi chưa mở */
function plotSign(def) {
  const g = new THREE.Group();
  g.add(at(cyl(0.05, 0.05, 1.1, WOOD_D, 6), 0, 0.55, 0));
  g.add(at(rbox(0.9, 0.5, 0.06, '#fff3e3', 0.04), 0, 1.15, 0));
  const s = textSprite(`🏪 ${def.name.replace('Chi nhánh ', '')}`, { scale: 0.45, sub: 'Chỗ mở chi nhánh' }); s.position.set(0, 1.9, 0); g.add(s);
  const hit = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.4, 1.2), new THREE.MeshBasicMaterial({ visible: false })); hit.position.y = 1.1; g.add(hit);
  return g;
}

export class ManageView {
  constructor(scene) {
    this.root = new THREE.Group();
    scene.add(this.root);
    this.partyRoot = new THREE.Group();
    this.branchRoot = new THREE.Group();
    this.traderRoot = new THREE.Group();
    this.root.add(this.partyRoot, this.branchRoot, this.traderRoot);
    this.keyP = this.keyB = this.keyT = '';
    this.marker = null;
    this.t = 0;
  }

  /**
   * st = { party: { venue, design: [vkey|null], editing } | null, colorsOf(vk), branches: [{ id, open, lvl, stock, show }], trader: bool, pier: [x,z] }
   */
  sync(st) {
    const kp = JSON.stringify(st.party || null);
    if (kp !== this.keyP) {
      this.keyP = kp;
      this.clear(this.partyRoot);
      this.marker = null;
      if (st.party) {
        const V = VENUES[st.party.venue];
        V.slots.forEach(([kind, x, z, rot], i) => {
          const vk = st.party.design[i];
          if (!vk && !st.party.editing) return;
          const m = itemModel(kind, vk ? st.colorsOf(vk) : null);
          m.position.set(x, 0.05, z);
          m.rotation.y = (rot * Math.PI) / 180;
          m.userData.pick = { kind: 'party', slot: i };
          this.partyRoot.add(m);
        });
        if (st.party.editing) {
          // điểm đánh dấu nơi tổ chức
          const mk = textSprite(`🎉 ${V.name}`, { scale: 0.6, sub: 'Chạm để trang trí' });
          mk.position.set(V.center[0], 3.4, V.center[1]);
          mk.userData.pick = { kind: 'party', slot: -1 };
          this.partyRoot.add(mk);
          this.marker = mk;
        }
      }
    }
    const kb = JSON.stringify(st.branches || []);
    if (kb !== this.keyB) {
      this.keyB = kb;
      this.clear(this.branchRoot);
      for (const b of st.branches || []) {
        if (!b.show) continue;
        const def = BRANCHES[b.id];
        const m = b.open ? kiosk(def, b.lvl, b.stock) : plotSign(def);
        m.position.set(def.at[0], 0.05, def.at[1]);
        m.rotation.y = def.rot ?? 0;
        m.userData.pick = { kind: 'branch', id: b.id };
        this.branchRoot.add(m);
      }
    }
    const kt = String(!!st.trader);
    if (kt !== this.keyT) {
      this.keyT = kt;
      this.clear(this.traderRoot);
      if (st.trader) {
        const boat = sailBoat();
        boat.scale.setScalar(1.25);
        boat.position.set(st.pier[0] + 1.4, -0.35, st.pier[1] + 2.4);
        boat.rotation.y = Math.PI / 2;
        boat.userData.pick = { kind: 'trader' };
        this.traderRoot.add(boat);
        const s = textSprite('🚢 Thuyền buôn', { scale: 0.55, sub: 'Hạt giống màu hiếm' }); s.position.set(st.pier[0] + 1.4, 3.6, st.pier[1] + 2.4); this.traderRoot.add(s);
        this.boat = boat;
      } else this.boat = null;
    }
  }

  clear(g) {
    for (const c of [...g.children]) {
      g.remove(c);
      c.traverse((o) => { if (o.isSprite) { o.material.map?.dispose(); o.material.dispose(); } }); // khối hình dùng chung bộ nhớ đệm ⇒ không hủy hình học
    }
  }

  update(dt) {
    this.t += dt;
    if (this.marker) this.marker.position.y = 3.4 + Math.sin(this.t * 2.4) * 0.15;
    if (this.boat) { this.boat.position.y = -0.35 + Math.sin(this.t * 1.3) * 0.06; this.boat.rotation.z = Math.sin(this.t * 0.9) * 0.03; }
  }
}
