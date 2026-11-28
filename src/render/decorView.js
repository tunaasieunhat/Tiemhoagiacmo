// Hiển thị đồ trang trí đặt TỰ DO (GĐ10).
// - Đồ đã đặt: mỗi món 1 nhóm, chạm được khi đang ở chế độ trang trí (pick { kind: 'decor', u })
// - Món đang chọn/dời: vẽ riêng ("bóng") kèm vòng dưới chân: xanh = đặt được, đỏ = vướng
import * as THREE from 'three';
import { buildDecor } from '../models/decor.js';
import { sizeOf } from '../systems/decor.js';

const RING_OK = new THREE.MeshBasicMaterial({ color: '#7be08f', transparent: true, opacity: 0.55, depthWrite: false });
const RING_BAD = new THREE.MeshBasicMaterial({ color: '#ff6b7d', transparent: true, opacity: 0.55, depthWrite: false });
const MARK = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.35, depthWrite: false });

function ring(r, material) {
  const m = new THREE.Mesh(new THREE.RingGeometry(r * 0.82, r, 36), material);
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.06;
  m.renderOrder = 4;
  return m;
}

export class DecorView {
  constructor(scene) {
    this.root = new THREE.Group();
    scene.add(this.root);
    this.items = new Map(); // u -> { id, obj, key }
    this.editing = false;
    this.ghost = null;      // { u, id, obj, ring, ok }
    this.t = 0;
  }

  /** placed: [{u, id, x, z, r}] — hideUid: món đang được dời (vẽ ở dạng bóng) */
  sync(placed = [], hideUid = null) {
    const seen = new Set();
    for (const p of placed) {
      seen.add(p.u);
      let it = this.items.get(p.u);
      if (!it || it.id !== p.id) {
        if (it) this.root.remove(it.obj);
        const obj = buildDecor(p.id);
        obj.userData.pick = this.editing ? { kind: 'decor', u: p.u } : null;
        // vùng chạm vô hình để dễ chạm trúng món nhỏ
        const hit = new THREE.Mesh(new THREE.CylinderGeometry(Math.max(0.45, sizeOf(p.id)), Math.max(0.45, sizeOf(p.id)), 1.6, 10), new THREE.MeshBasicMaterial({ visible: false }));
        hit.position.y = 0.8;
        obj.add(hit);
        const mark = ring(sizeOf(p.id) + 0.05, MARK);
        mark.visible = this.editing;
        obj.add(mark);
        obj.userData.mark = mark;
        this.root.add(obj);
        it = { id: p.id, obj };
        this.items.set(p.u, it);
      }
      it.obj.position.set(p.x, 0, p.z);
      it.obj.rotation.y = THREE.MathUtils.degToRad(p.r || 0);
      it.obj.visible = p.u !== hideUid;
    }
    for (const [u, it] of this.items) if (!seen.has(u)) { this.root.remove(it.obj); this.items.delete(u); }
  }

  setEditing(on) {
    this.editing = on;
    for (const [u, it] of this.items) {
      it.obj.userData.pick = on ? { kind: 'decor', u } : null;
      if (it.obj.userData.mark) it.obj.userData.mark.visible = on;
    }
    if (!on) this.clearGhost();
  }

  /** Vẽ món đang chọn ở vị trí (x, z), góc r độ; ok = đặt được không */
  showGhost(id, x, z, r, ok) {
    if (!this.ghost || this.ghost.id !== id) {
      this.clearGhost();
      const obj = buildDecor(id);
      obj.userData.pick = { kind: 'decorGhost' };
      const hit = new THREE.Mesh(new THREE.CylinderGeometry(Math.max(0.6, sizeOf(id) + 0.2), Math.max(0.6, sizeOf(id) + 0.2), 2, 10), new THREE.MeshBasicMaterial({ visible: false }));
      hit.position.y = 1;
      obj.add(hit);
      const rg = ring(sizeOf(id) + 0.08, RING_OK);
      obj.add(rg);
      this.root.add(obj);
      this.ghost = { id, obj, ring: rg };
    }
    this.ghost.obj.position.set(x, 0, z);
    this.ghost.obj.rotation.y = THREE.MathUtils.degToRad(r || 0);
    this.ghost.ring.material = ok ? RING_OK : RING_BAD;
  }

  clearGhost() {
    if (this.ghost) { this.root.remove(this.ghost.obj); this.ghost = null; }
  }

  update(dt) {
    this.t += dt;
    const t = this.t;
    const each = (obj) => {
      const u = obj.userData;
      if (u.spin) u.spin.rotation.z += dt * 1.2;
      if (u.bob) u.bob.position.y += Math.sin(t * 2) * 0.002;
      if (u.float) u.float.position.y = 1.15 + Math.sin(t * 1.6) * 0.12;
      if (u.orbit) {
        u.orbit.rotation.y += dt * 1.4;
        u.orbit.userData.bats?.forEach((b, i) => { const f = Math.sin(t * 14 + i * 2) * 0.45; if (b.userData.wl) b.userData.wl.rotation.z = -0.35 - f; if (b.userData.wr) b.userData.wr.rotation.z = 0.35 + f; });
      }
      if (u.dangle) u.dangle.position.y = 1.1 + Math.sin(t * 1.2) * 0.12;
      if (u.flicker) u.flicker.forEach((f, i) => { const k = 1 + Math.sin(t * 13 + i * 2.1) * 0.12 + Math.sin(t * 7.3 + i) * 0.08; f.scale.set(k, 1.7 * k, k); });
      if (u.spinY) u.spinY.rotation.y += dt * 0.9;
      if (u.hover) u.hover.position.y = u.hoverBase + Math.sin(t * 1.8) * 0.07;
      if (u.wave) u.wave.rotation.z = 0.35 + Math.sin(t * 4) * 0.45;
      if (u.bubbles) u.bubbles.forEach((b) => { const k = ((t * 0.8 + b.userData.phase) % 1); b.position.y = 0.98 + k * 0.35; b.scale.setScalar(1 - k * 0.7); });
    };
    for (const it of this.items.values()) if (it.obj.visible) each(it.obj);
    if (this.ghost) {
      each(this.ghost.obj);
      this.ghost.obj.position.y = 0.12 + Math.abs(Math.sin(t * 4)) * 0.08; // nhấc lên nhún nhẹ khi đang dời
      this.ghost.ring.position.y = 0.06 - this.ghost.obj.position.y;
    }
  }
}
