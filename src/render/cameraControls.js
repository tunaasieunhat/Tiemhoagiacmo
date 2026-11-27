// Điều khiển camera: kéo để di chuyển, cuộn chuột / chụm 2 ngón để zoom, chạm để chọn.
import * as THREE from 'three';
import { CAMERA } from '../../data/config.js';
import { CAM_OFFSET } from './stage.js';

const GROUND = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const TAP_MOVE_PX = 12; // ngón tay xê dịch dưới mức này vẫn tính là "chạm" (không phải kéo bản đồ)
// (0.29) chạm nhanh (dưới QUICK_TAP_MS) mà xê dịch chưa quá QUICK_TAP_PX vẫn tính là chạm ⇒ chạm nhạy hơn trên điện thoại
const QUICK_TAP_MS = 260, QUICK_TAP_PX = 22;
const FLING_DECAY = 5.5; // (0.29) vuốt nhanh rồi thả: bản đồ trôi thêm một chút rồi dừng (càng lớn dừng càng nhanh)

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
    this.vel = null; // chạm vào là dừng trôi
    if (this.pointers.size === 1) {
      this.gesture = { moved: false, startX: e.clientX, startY: e.clientY, multi: false, t0: performance.now(), maxD: 0 };
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
      let from = prev;
      if (g) g.maxD = Math.max(g.maxD, Math.hypot(e.clientX - g.startX, e.clientY - g.startY));
      if (g && !g.moved && g.maxD > TAP_MOVE_PX) { g.moved = true; from = { x: g.startX, y: g.startY }; } // (0.29) bản đồ bám đúng ngón tay, không bị hụt 12px đầu
      if (this.dragId === e.pointerId) {
        if (g?.moved) this.onDrag?.(e.clientX, e.clientY);
      } else if (g?.moved) {
        const a = this.groundPoint(from.x, from.y);
        const b = this.groundPoint(e.clientX, e.clientY);
        if (a && b) {
          const d = a.sub(b);
          this.target.add(d);
          // vận tốc kéo (để trôi tiếp khi thả tay)
          const now = performance.now(), dtm = Math.max(1, now - (this.lastMoveT || now - 16)) / 1000;
          this.lastMoveT = now;
          const v = { x: d.x / dtm, z: d.z / dtm };
          this.dragVel = this.dragVel ? { x: this.dragVel.x * 0.6 + v.x * 0.4, z: this.dragVel.z * 0.6 + v.z * 0.4 } : v;
        }
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
      const quick = g && !g.multi && g.maxD <= QUICK_TAP_PX && performance.now() - g.t0 < QUICK_TAP_MS;
      if (!cancelled && g && !g.multi && (!g.moved || quick)) this.onTap?.(e.clientX, e.clientY);
      else if (g?.moved && !g.multi && this.dragVel && performance.now() - (this.lastMoveT || 0) < 80) {
        const sp = Math.hypot(this.dragVel.x, this.dragVel.z), max = 40 / this.zoom;
        if (sp > 2) this.vel = sp > max ? { x: (this.dragVel.x / sp) * max, z: (this.dragVel.z / sp) * max } : this.dragVel;
      }
      this.dragVel = null; this.lastMoveT = 0;
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
    this.vel = null;
    this.focusAnim = { to: point.clone().setY(0), zoom };
  }

  /** Vùng camera được phép nhìn tới: các vòng tròn { x, z, r } (đảo chính + làng) */
  get regions() { return this._regions || (this._regions = [{ x: 0, z: 0, r: CAMERA.panLimit }]); }

  /**
   * Vùng là hình tròn { x, z, r } hoặc "hành lang" thuôn { x, z, r, x2, z2, r2 } nối 2 hình tròn (0.22).
   * Hành lang cho mép vùng trơn, không có khe hay góc lõm ⇒ kéo bản đồ giữa đảo chính và làng không còn bị khựng.
   */
  clamp() {
    const t = this.target;
    t.y = 0;
    let best = null, bd = Infinity;
    for (const c of this.regions) {
      let cx = c.x, cz = c.z, r = c.r;
      if (c.x2 != null) {
        const ax = c.x2 - c.x, az = c.z2 - c.z;
        const k = Math.max(0, Math.min(1, ((t.x - c.x) * ax + (t.z - c.z) * az) / (ax * ax + az * az || 1)));
        cx = c.x + ax * k; cz = c.z + az * k; r = c.r + (c.r2 - c.r) * k;
      }
      const dx = t.x - cx, dz = t.z - cz, len = Math.hypot(dx, dz);
      if (len <= r) return; // nằm trong 1 vùng là được
      if (len - r < bd) { bd = len - r; best = [cx + (dx / len) * r, cz + (dz / len) * r]; }
    }
    // ra ngoài: kéo về mép vùng gần nhất (trượt dọc theo mép)
    if (best) { t.x = best[0]; t.z = best[1]; }
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
    // (0.29) trôi tiếp sau khi vuốt
    if (this.vel && !this.locked) {
      this.target.x += this.vel.x * dt; this.target.z += this.vel.z * dt;
      const k = Math.exp(-FLING_DECAY * dt);
      this.vel.x *= k; this.vel.z *= k;
      if (Math.hypot(this.vel.x, this.vel.z) < 0.3) this.vel = null;
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
