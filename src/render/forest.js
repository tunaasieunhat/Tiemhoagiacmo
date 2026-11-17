// 🌲 Rừng bao quanh đảo chính (GĐ24): cây mọc dọc bờ + 2 khu rừng (đông nam, tây nam). Vẽ bằng InstancedMesh cho nhẹ.
// Đổi màu theo mùa (xuân hoa anh đào, hạ xanh đậm, thu cam đỏ, đông trụi lá phủ tuyết), đung đưa khi gió, phủ tuyết theo thời tiết.
import * as THREE from 'three';
import { mat } from '../models/materials.js';
import { FOREST } from '../../data/island.js';

const rng = (seed) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

/**
 * spots: [[x, z, kind 0 = cây tán tròn | 1 = thông, scale]]
 */
export class ForestView {
  constructor(scene, spots) {
    this.root = new THREE.Group();
    scene.add(this.root);
    this.spots = spots;
    const round = spots.filter((s) => s[2] === 0), pine = spots.filter((s) => s[2] === 1);
    this.round = round; this.pine = pine;
    const toon = (c) => { const m = mat(c).clone(); return m; };
    // thân
    this.trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.16, 0.24, 1.4, 6), toon('#8a6446'), spots.length);
    // tán tròn (màu từng cây riêng)
    this.crowns = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), toon('#ffffff'), round.length);
    // thông: 2 tầng nón
    this.pines = new THREE.InstancedMesh(new THREE.ConeGeometry(1, 2.2, 7), toon('#ffffff'), pine.length * 2);
    // tuyết trên ngọn
    this.caps = new THREE.InstancedMesh(new THREE.ConeGeometry(1, 0.7, 7), toon('#f8fbff'), spots.length);
    for (const m of [this.trunks, this.crowns, this.pines, this.caps]) { m.castShadow = false; m.receiveShadow = false; m.frustumCulled = false; this.root.add(m); }
    const r = rng(909);
    this.var = spots.map(() => r()); // biến thiên màu / pha đung đưa
    this.dummy = new THREE.Object3D();
    this.colorsFrom = round.map(() => new THREE.Color('#7cc27f'));
    this.pineFrom = pine.map(() => new THREE.Color('#4f8f52'));
    this.colorsTo = round.map(() => new THREE.Color('#7cc27f'));
    this.pineTo = pine.map(() => new THREE.Color('#4f8f52'));
    this.blend = 1;
    this.season = -1;
    this.snow = 0; this.wind = 0; this.t = 0; this.leafScale = 1; this.leafScaleTo = 1;
    this.hidden = new Set();
    this.layout(0);
    this.applyColors(1);
  }

  /** Ẩn cây trùng chỗ đồ trang trí người chơi đã đặt từ trước (pts: [[x, z, r]]). Trả về số cây đã ẩn */
  hideNear(pts) {
    this.spots.forEach(([x, z], i) => { if (pts.some(([px, pz, r]) => Math.hypot(x - px, z - pz) < r)) this.hidden.add(i); });
    this.layout(this.t);
    return this.hidden.size;
  }

  /** Đặt vị trí + độ nghiêng gió cho mọi cây */
  layout(t) {
    const d = this.dummy;
    const S = (i, s) => (this.hidden.has(i) ? 0.0001 : s);
    this.spots.forEach(([x, z, , s0], i) => { const s = S(i, s0); d.position.set(x, 0.7 * s, z); d.rotation.set(0, 0, 0); d.scale.set(s, s, s); d.updateMatrix(); this.trunks.setMatrixAt(i, d.matrix); });
    const sway = (i) => (this.wind ? Math.sin(t * (1.6 + this.wind) + this.var[i] * 6) * 0.06 * this.wind : 0);
    let ri = 0, pi = 0;
    this.spots.forEach(([x, z, kind, s0], i) => {
      const s = S(i, s0);
      const a = sway(i);
      if (kind === 0) {
        const k = s * (1.05 + this.var[i] * 0.35) * this.leafScale;
        d.position.set(x + a * 2.2, 1.9 * s, z + a);
        d.rotation.set(a, this.var[i] * 6, -a);
        d.scale.set(k, k * 0.85, k);
        d.updateMatrix(); this.crowns.setMatrixAt(ri++, d.matrix);
        const sn = this.snow > 0.05 ? (0.55 + 0.45 * this.snow) * k * 0.6 : 0.0001; d.position.set(x + a * 2.2, 1.9 * s + k * 0.7, z + a); d.scale.set(sn * 1.1, sn, sn * 1.1); d.updateMatrix(); this.caps.setMatrixAt(i, d.matrix);
      } else {
        for (let L = 0; L < 2; L++) {
          const w = s * (L ? 0.72 : 1.0);
          d.position.set(x + a * (2 + L), (1.8 + L * 1.15) * s, z + a);
          d.rotation.set(a, 0, -a);
          d.scale.set(w, w, w);
          d.updateMatrix(); this.pines.setMatrixAt(pi++, d.matrix);
        }
        const w = this.snow > 0.05 ? s * 0.5 * (0.55 + 0.45 * this.snow) : 0.0001;
        d.position.set(x + a * 3, (1.8 + 1.15 + 0.6) * s, z + a); d.scale.set(w, w, w); d.updateMatrix(); this.caps.setMatrixAt(i, d.matrix);
      }
    });
    for (const m of [this.trunks, this.crowns, this.pines, this.caps]) m.instanceMatrix.needsUpdate = true;
  }

  applyColors(k) {
    const c = new THREE.Color();
    const snowC = new THREE.Color('#f4f8fb');
    this.round.forEach((_, i) => { c.copy(this.colorsFrom[i]).lerp(this.colorsTo[i], k).lerp(snowC, this.snow * 0.55); this.crowns.setColorAt(i, c); });
    this.pine.forEach((_, i) => { c.copy(this.pineFrom[i]).lerp(this.pineTo[i], k).lerp(snowC, this.snow * 0.35); this.pines.setColorAt(i * 2, c); this.pines.setColorAt(i * 2 + 1, c); });
    if (this.crowns.instanceColor) this.crowns.instanceColor.needsUpdate = true;
    if (this.pines.instanceColor) this.pines.instanceColor.needsUpdate = true;
  }

  /** Đổi mùa (0 xuân … 3 đông). instant = đổi ngay không chuyển dần */
  setSeason(si, instant = false) {
    if (si === this.season) return;
    this.season = si;
    const leaf = FOREST.leaf[si], pine = FOREST.pine[si];
    this.round.forEach((_, i) => {
      this.colorsFrom[i].copy(this.colorsTo[i]);
      const v = this.var[this.spots.indexOf(this.round[i])];
      // xuân: chỉ một phần cây là anh đào (2 màu hồng cuối)
      const pick = si === 0 ? (v < 0.72 ? Math.floor(v / 0.36) : 2 + Math.floor((v - 0.72) / 0.14)) : Math.floor(v * leaf.length);
      this.colorsTo[i].set(leaf[Math.min(leaf.length - 1, pick)]);
    });
    this.pine.forEach((_, i) => { this.pineFrom[i].copy(this.pineTo[i]); this.pineTo[i].set(pine); });
    this.leafScaleTo = si === 3 ? FOREST.winterLeafScale : 1;
    this.blend = instant ? 1 : 0;
    if (instant) this.leafScale = this.leafScaleTo;
    this.applyColors(this.blend);
    this.layout(this.t);
  }

  /** snow: 0..1 tuyết phủ · wind: 0..1 độ gió */
  update(dt, { snow = 0, wind = 0 } = {}) {
    this.t += dt;
    let dirty = false;
    if (this.blend < 1) { this.blend = Math.min(1, this.blend + dt * 0.25); dirty = true; }
    if (Math.abs(this.leafScale - this.leafScaleTo) > 0.001) { this.leafScale += (this.leafScaleTo - this.leafScale) * Math.min(1, dt * 0.5); dirty = true; }
    if (Math.abs(snow - this.snow) > 0.01) { this.snow = snow; dirty = true; }
    const windChanged = Math.abs(wind - this.wind) > 0.01;
    this.wind = wind;
    if (dirty) this.applyColors(this.blend);
    // đung đưa: cập nhật vị trí ~15 lần/giây khi có gió
    this.acc = (this.acc || 0) + dt;
    if ((this.wind > 0.05 && this.acc > 0.066) || dirty || windChanged) { this.acc = 0; this.layout(this.t); }
  }
}
