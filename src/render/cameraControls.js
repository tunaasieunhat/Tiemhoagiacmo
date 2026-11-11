// Điều khiển camera: kéo để di chuyển, cuộn chuột / chụm 2 ngón để zoom, chạm để chọn.
import * as THREE from 'three';
import { CAMERA } from '../../data/config.js';
import { CAM_OFFSET } from './stage.js';

const GROUND = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const TAP_MOVE_PX = 12; // ngón tay xê dịch dưới mức này vẫn tính là "chạm" (không phải kéo bản đồ)

export class CameraControls {
  /**
   * onDragStart(x, y) → true nếu game muốn tự xử lý cú kéo này (vd kéo đồ trang trí), khi đó không kéo bản đồ;
   * onDrag(x, y) / onDragEnd(x, y) được gọi trong lúc kéo.
   */
  constructor(camera, dom, { onTap, onHover, onDragStart, onDrag, onDragEnd } = {}) {
    this.camera = camera;
    this.dom = dom;
    this.onTap = onTap;
    this.onHover = onHover;
    this.onDragStart = onDragStart;
    this.onDrag = onDrag;
    this.onDragEnd = onDragEnd;
    this.dragId = null;
    this.target = new THREE.Vector3(0, 0, 0);
    this.zoom = camera.zoom;
    this.pointers = new Map();
    this.gesture = null; // { moved, startX, startY, multi }
    this.raycaster = new THREE.Raycaster();
    this.keys = new Set();
    this.focusAnim = null;
    this.bind();
    this.apply();
  }

  bind() {
    const d = this.dom;
    d.addEventListener('pointerdown', (e) => this.down(e));
    d.addEventListener('pointermove', (e) => this.move(e));
    d.addEventListener('pointerup', (e) => this.up(e));
    d.addEventListener('pointercancel', (e) => this.up(e, true));
    d.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') this.onHover?.(null); });
    d.addEventListener('wheel', (e) => {
      e.preventDefault();
      const factor = Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015));
      this.zoomAt(factor, e.clientX, e.clientY);
    }, { passive: false });
    d.addEventListener('contextmenu', (e) => e.preventDefault());
    addEventListener('keydown', (e) => { if (!isTyping(e)) this.keys.add(e.key.toLowerCase()); });
    addEventListener('keyup', (e) => this.keys.delete(e.key.toLowerCase()));
    addEventListener('blur', () => this.keys.clear());
  }

  ndc(x, y) {
    const r = this.dom.getBoundingClientRect();
    return new THREE.Vector2(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1);
  }

  groundPoint(x, y) {
    this.raycaster.setFromCamera(this.ndc(x, y), this.camera);
    const p = new THREE.Vector3();
    return this.raycaster.ray.intersectPlane(GROUND, p) ? p : null;
  }

  down(e) {
    this.dom.setPointerCapture?.(e.pointerId);
    this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    this.focusAnim = null;
    if (this.pointers.size === 1) {
      this.gesture = { moved: false, startX: e.clientX, startY: e.clientY, multi: false };
      if (this.onDragStart?.(e.clientX, e.clientY)) this.dragId = e.pointerId;
    } else if (this.gesture) {
      this.gesture.multi = true;
      if (this.dragId != null) { this.onDragEnd?.(e.clientX, e.clientY); this.dragId = null; }
    }
  }

  move(e) {
    const prev = this.pointers.get(e.pointerId);
    if (!prev) {
      if (e.pointerType === 'mouse') this.onHover?.(e.clientX, e.clientY);
      return;
    }
    if (this.pointers.size === 1) {
      const g = this.gesture;
      if (g && !g.moved && Math.hypot(e.clientX - g.startX, e.clientY - g.startY) > TAP_MOVE_PX) g.moved = true;
      if (this.dragId === e.pointerId) {
        if (g?.moved) this.onDrag?.(e.clientX, e.clientY);
      } else if (g?.moved) {
        const a = this.groundPoint(prev.x, prev.y);
        const b = this.groundPoint(e.clientX, e.clientY);
        if (a && b) this.target.add(a.sub(b));
        this.clamp();
        this.apply();
      }
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    } else if (this.pointers.size === 2) {
      const [idA, idB] = [...this.pointers.keys()];
      const pA = this.pointers.get(idA), pB = this.pointers.get(idB);
      const oldDist = Math.hypot(pA.x - pB.x, pA.y - pB.y);
      const oldMid = { x: (pA.x + pB.x) / 2, y: (pA.y + pB.y) / 2 };
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const nA = this.pointers.get(idA), nB = this.pointers.get(idB);
      const newDist = Math.hypot(nA.x - nB.x, nA.y - nB.y);
      const newMid = { x: (nA.x + nB.x) / 2, y: (nA.y + nB.y) / 2 };
      // kéo bằng trung điểm
      const a = this.groundPoint(oldMid.x, oldMid.y);
      const b = this.groundPoint(newMid.x, newMid.y);
      if (a && b) this.target.add(a.sub(b));
      this.apply();
      if (oldDist > 10) this.zoomAt(newDist / oldDist, newMid.x, newMid.y);
      if (this.gesture) this.gesture.moved = true;
    }
  }

  up(e, cancelled = false) {
    const had = this.pointers.has(e.pointerId);
    this.pointers.delete(e.pointerId);
    if (!had) return;
    const g = this.gesture;
    if (this.dragId === e.pointerId) {
      this.dragId = null;
      this.onDragEnd?.(e.clientX, e.clientY);
      if (g?.moved) { if (this.pointers.size === 0) this.gesture = null; return; }
    }
    if (this.pointers.size === 0) {
      if (!cancelled && g && !g.moved && !g.multi) this.onTap?.(e.clientX, e.clientY);
      this.gesture = null;
    }
  }

  /** Zoom giữ nguyên điểm dưới con trỏ */
  zoomAt(factor, x, y) {
    const before = this.groundPoint(x, y);
    this.zoom = THREE.MathUtils.clamp(this.zoom * factor, CAMERA.zoomMin, CAMERA.zoomMax);
    this.apply();
    const after = this.groundPoint(x, y);
    if (before && after) this.target.add(before.sub(after));
    this.clamp();
    this.apply();
  }

  zoomBy(factor) {
    const r = this.dom.getBoundingClientRect();
    this.zoomAt(factor, r.left + r.width / 2, r.top + r.height / 2);
  }

  focusOn(point, zoom = null) {
    this.focusAnim = { to: point.clone().setY(0), zoom };
  }

  /** Vùng camera được phép nhìn tới: các vòng tròn { x, z, r } (đảo chính + làng) */
  get regions() { return this._regions || (this._regions = [{ x: 0, z: 0, r: CAMERA.panLimit }]); }

  clamp() {
    const t = this.target;
    t.y = 0;
    if (this.regions.some((c) => Math.hypot(t.x - c.x, t.z - c.z) <= c.r)) return;
    // ra ngoài: kéo về mép vùng gần nhất
    let best = null, bd = Infinity;
    for (const c of this.regions) {
      const dx = t.x - c.x, dz = t.z - c.z, len = Math.hypot(dx, dz) || 1;
      const px = c.x + (dx / len) * c.r, pz = c.z + (dz / len) * c.r;
      const d = Math.hypot(t.x - px, t.z - pz);
      if (d < bd) { bd = d; best = [px, pz]; }
    }
    t.x = best[0]; t.z = best[1];
  }

  apply() {
    this.camera.zoom = this.zoom;
    this.camera.position.copy(this.target).add(CAM_OFFSET);
    this.camera.lookAt(this.target);
    this.camera.updateProjectionMatrix();
  }

  update(dt) {
    // phím mũi tên / WASD trên máy tính
    const k = this.locked ? new Set() : this.keys; // đang xem cảnh truyện: không cho phím di chuyển camera
    let dx = 0, dz = 0;
    if (k.has('arrowup') || k.has('w')) { dx -= 1; dz -= 1; }
    if (k.has('arrowdown') || k.has('s')) { dx += 1; dz += 1; }
    if (k.has('arrowleft') || k.has('a')) { dx -= 1; dz += 1; }
    if (k.has('arrowright') || k.has('d')) { dx += 1; dz -= 1; }
    if (k.has('+') || k.has('=')) this.zoomBy(1 + dt * 1.5);
    if (k.has('-')) this.zoomBy(1 - dt * 1.5);
    if (dx || dz) {
      const sp = (12 / this.zoom) * dt;
      const l = Math.hypot(dx, dz);
      this.target.x += (dx / l) * sp;
      this.target.z += (dz / l) * sp;
      this.focusAnim = null;
      this.clamp();
      this.apply();
    }
    if (this.focusAnim) {
      const f = this.focusAnim;
      const t = 1 - Math.exp(-dt * 5);
      this.target.lerp(f.to, t);
      if (f.zoom) this.zoom += (f.zoom - this.zoom) * t;
      if (this.target.distanceTo(f.to) < 0.02 && (!f.zoom || Math.abs(f.zoom - this.zoom) < 0.01)) this.focusAnim = null;
      this.apply();
    }
  }
}

function isTyping(e) {
  const t = e.target;
  return t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
}
