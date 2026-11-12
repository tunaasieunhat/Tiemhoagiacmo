// 🐾 Thú cưng 3D (GĐ26): thú đang chọn đi theo người chơi; thú khác chơi quanh nhà; trứng đang ấp nằm trong ổ trước nhà.
import * as THREE from 'three';
import { buildPet, buildEgg, buildNest } from '../models/pets.js';
import { at, textSprite } from '../models/primitives.js';

export class PetView {
  /** home = [x, z] sân nhà người chơi */
  constructor(scene, home) {
    this.scene = scene;
    this.home = home;
    this.root = new THREE.Group();
    scene.add(this.root);
    this.pets = new Map(); // id → { m, sp, lvl, follow, x, z, tx, tz, t, phase }
    this.nests = new THREE.Group();
    this.root.add(this.nests);
    this.key = '';
    this.t = 0;
  }

  /** st = { list: [{ id, sp, lvl, name }], active, eggs: [{ id, kind, inc }], incubators, visible } */
  sync(st) {
    const key = JSON.stringify([st.list.map((p) => [p.id, p.sp, p.lvl]), st.active, st.eggs.map((e) => [e.id, e.kind, e.inc != null]), st.incubators]);
    this.root.visible = st.visible !== false;
    if (key === this.key) return;
    this.key = key;
    const [hx, hz] = this.home;
    const keep = new Set(st.list.map((p) => p.id));
    for (const [id, v] of this.pets) if (!keep.has(id)) { this.root.remove(v.m.root); this.pets.delete(id); }
    st.list.forEach((p, i) => {
      let v = this.pets.get(p.id);
      if (v && (v.sp !== p.sp || v.lvl !== p.lvl)) { this.root.remove(v.m.root); v = null; }
      if (!v) {
        const m = buildPet(p.sp);
        const a = (i / Math.max(1, st.list.length)) * Math.PI * 2;
        v = { m, sp: p.sp, lvl: p.lvl, x: hx + Math.cos(a) * 2, z: hz + 2.5 + Math.sin(a) * 1.2, tx: 0, tz: 0, t: Math.random() * 5, wait: 0 };
        v.tx = v.x; v.tz = v.z;
        m.root.scale.setScalar(1.3 + p.lvl * 0.04); // to hơn để dễ thấy trên điện thoại
        m.root.userData.pick = { kind: 'pet', id: p.id };
        // vùng chạm to hơn mô hình (thú nhỏ khó chạm trên điện thoại)
        const hit = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 6), new THREE.MeshBasicMaterial({ visible: false }));
        hit.position.y = 0.35; m.root.add(hit);
        m.root.position.set(v.x, 0, v.z);
        this.root.add(m.root);
        this.pets.set(p.id, v);
      }
      v.follow = p.id === st.active;
    });
    // ổ ấp + trứng
    this.nests.clear();
    const inc = st.eggs.filter((e) => e.inc != null);
    for (let i = 0; i < st.incubators; i++) {
      const n = buildNest();
      n.position.set(hx + 3.2 + i * 0.8, 0, hz + 1.2);
      n.userData.pick = { kind: 'nest' };
      const hit = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), new THREE.MeshBasicMaterial({ visible: false })); hit.position.y = 0.3; n.add(hit);
      if (inc[i]) { const e = buildEgg(inc[i].kind); e.userData.wobble = true; n.add(e); }
      this.nests.add(n);
    }
    if (st.list.length + st.eggs.length > 0) {
      const sign = textSprite('🪺 Ổ ấp trứng', { scale: 0.42 });
      sign.position.set(hx + 3.2 + (st.incubators - 1) * 0.4, 1.3, hz + 1.2);
      this.nests.add(sign);
    }
  }

  /** player: vị trí người chơi (THREE.Vector3) · moving: người chơi đang đi */
  update(dt, player, moving) {
    this.t += dt;
    const [hx, hz] = this.home;
    for (const [, v] of this.pets) {
      v.t += dt;
      const r = v.m.root;
      if (v.follow && player) {
        // đi sau lưng người chơi một chút
        const dx = player.x - v.x, dz = player.z - v.z, d = Math.hypot(dx, dz);
        if (d > 1.1) { v.tx = player.x - (dx / d) * 0.9 + 0.35; v.tz = player.z - (dz / d) * 0.9 + 0.35; }
        else if (!moving && v.wait <= 0) { const a = Math.random() * 6.28; v.tx = player.x + Math.cos(a) * 1.1; v.tz = player.z + Math.sin(a) * 1.1; v.wait = 2 + Math.random() * 3; }
        if (d > 25) { v.x = player.x + 0.8; v.z = player.z + 0.8; } // đi xa quá (lên thuyền...) ⇒ có mặt ngay
      } else if (v.wait <= 0) {
        const a = Math.random() * 6.28; v.tx = hx + Math.cos(a) * 2.6; v.tz = hz + 2.4 + Math.sin(a) * 1.4; v.wait = 3 + Math.random() * 4;
      }
      v.wait -= dt;
      const ddx = v.tx - v.x, ddz = v.tz - v.z, dd = Math.hypot(ddx, ddz);
      const walking = dd > 0.05;
      if (walking) {
        const sp = Math.min(dd, (v.follow && dd > 2 ? 4.2 : 1.6) * dt);
        v.x += (ddx / dd) * sp; v.z += (ddz / dd) * sp;
        r.rotation.y = Math.atan2(ddx, ddz);
      }
      r.position.set(v.x, walking ? Math.abs(Math.sin(v.t * 12)) * 0.06 : 0, v.z);
      v.m.legs.forEach((l, i) => { l.rotation.x = walking ? Math.sin(v.t * 14 + (i % 2) * Math.PI) * 0.6 : 0; });
      if (v.m.tail) v.m.tail.rotation.y = Math.sin(v.t * (walking ? 10 : 3)) * 0.5;
      v.m.head.rotation.z = walking ? 0 : Math.sin(v.t * 1.3) * 0.12;
    }
    for (const n of this.nests.children) for (const c of n.children) if (c.userData?.wobble) c.rotation.z = Math.sin(this.t * 3 + n.position.x) * 0.12;
  }

  /** Vị trí 1 thú (để hiện hiệu ứng) */
  posOf(id) { const v = this.pets.get(id); return v ? new THREE.Vector3(v.x, 0.8, v.z) : null; }
  /** Thú đang đi theo có ở gần điểm (x, z) không */
  near(id, x, z, r) { const v = this.pets.get(id); return v && Math.hypot(v.x - x, v.z - z) < r; }
}
