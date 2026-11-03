// Hiển thị đồ trang trí ở các vị trí; chế độ trang trí hiện ô trống (+) để chạm vào đặt đồ.
import * as THREE from 'three';
import { DECOR_SLOTS } from '../../data/decor.js';
import { buildDecor } from '../models/decor.js';

function plusMaterial() {
  const c = document.createElement('canvas');
  c.width = c.height = 96;
  const x = c.getContext('2d');
  x.fillStyle = 'rgba(255,250,243,.92)'; x.strokeStyle = '#f6a6b9'; x.lineWidth = 6;
  x.beginPath(); x.arc(48, 48, 40, 0, Math.PI * 2); x.fill(); x.stroke();
  x.strokeStyle = '#ea7f99'; x.lineWidth = 9; x.lineCap = 'round';
  x.beginPath(); x.moveTo(48, 28); x.lineTo(48, 68); x.moveTo(28, 48); x.lineTo(68, 48); x.stroke();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return new THREE.SpriteMaterial({ map: t, depthTest: false, transparent: true });
}

export class DecorView {
  constructor(scene) {
    this.root = new THREE.Group();
    scene.add(this.root);
    this.items = {}; // slotId -> { id, obj }
    this.markers = {};
    this.editing = false;
    this.t = 0;
    const pm = plusMaterial();
    for (const s of DECOR_SLOTS) {
      const holder = new THREE.Group();
      holder.position.set(s.x, 0, s.z);
      holder.userData.pick = { kind: 'decorSlot', slot: s.id };
      // vùng chạm vô hình để dễ bấm vào ô trống
      const hit = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 1.6, 10), new THREE.MeshBasicMaterial({ visible: false }));
      hit.position.y = 0.8;
      holder.add(hit);
      const m = new THREE.Sprite(pm);
      m.scale.set(0.9, 0.9, 1);
      m.position.y = 0.7;
      m.visible = false;
      m.renderOrder = 7;
      holder.add(m);
      this.root.add(holder);
      this.markers[s.id] = { holder, sprite: m, hit };
    }
  }

  /** slots: { slotId: decorId } */
  sync(slots = {}) {
    for (const s of DECOR_SLOTS) {
      const want = slots[s.id] || null;
      const cur = this.items[s.id];
      if ((cur?.id || null) === want) continue;
      if (cur) this.markers[s.id].holder.remove(cur.obj);
      delete this.items[s.id];
      if (want) {
        const obj = buildDecor(want);
        obj.rotation.y = Math.atan2(-s.x, -s.z) * 0 + (s.zone === 'shop' ? 0.3 : 0.6);
        this.markers[s.id].holder.add(obj);
        this.items[s.id] = { id: want, obj };
      }
    }
    this.setEditing(this.editing);
  }

  setEditing(on) {
    this.editing = on;
    for (const s of DECOR_SLOTS) {
      const m = this.markers[s.id];
      m.sprite.visible = on;
      m.sprite.position.y = this.items[s.id] ? 2.4 : 0.7;
      m.holder.userData.pick = on ? { kind: 'decorSlot', slot: s.id } : null;
      m.hit.visible = false;
    }
  }

  /** Các nhóm có thể chạm (chỉ khi đang trang trí) */
  pickRoot() { return this.editing ? this.root : null; }

  update(dt) {
    this.t += dt;
    for (const it of Object.values(this.items)) {
      if (it.obj.userData.spin) it.obj.userData.spin.rotation.z += dt * 1.2;
      if (it.obj.userData.bob) it.obj.userData.bob.position.y += Math.sin(this.t * 2) * 0.002;
    }
    if (this.editing) for (const m of Object.values(this.markers)) m.sprite.material.opacity = 0.75 + Math.sin(this.t * 4) * 0.25;
  }
}
