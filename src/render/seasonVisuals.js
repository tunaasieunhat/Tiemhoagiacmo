// Đổi màu cỏ & lá cây trên đảo theo mùa (chuyển dần cho mượt).
import * as THREE from 'three';
import { mat } from '../models/materials.js';
import { SEASONS } from '../../data/seasons.js';

// màu gốc (mùa xuân) -> thuộc tính màu trong SEASONS
const TARGETS = [
  ['#b5e39a', 'grass'], ['#a5d98a', 'farm'], ['#9ccf82', 'farm'], ['#a9d98c', 'farm'], // (0.25.2) cả nền đất của dân làng cũng phủ tuyết
  ['#8fd18b', 'leaf'], ['#7cc27f', 'leaf'], ['#93d48d', 'leaf'], ['#a6dd94', 'leaf2'],
];

export class SeasonVisuals {
  constructor() {
    this.items = TARGETS.map(([base, key]) => ({ m: mat(base), base: new THREE.Color(base), key, to: new THREE.Color(base), cur: new THREE.Color(base) }));
    this.season = -1;
    this.wet = 0; this.snow = 0; // (GĐ24) đất ướt sẫm màu · tuyết phủ trắng
    this.white = new THREE.Color('#f4f8fb');
  }

  set(seasonIndex, instant = false) {
    if (seasonIndex === this.season) return;
    this.season = seasonIndex;
    const s = SEASONS[seasonIndex];
    const spring = SEASONS[0];
    for (const it of this.items) {
      // giữ độ đậm nhạt tương đối so với màu xuân
      const shift = new THREE.Color(s[it.key]).sub(new THREE.Color(spring[it.key]));
      it.to.copy(it.base).add(shift);
      it.to.r = THREE.MathUtils.clamp(it.to.r, 0, 1); it.to.g = THREE.MathUtils.clamp(it.to.g, 0, 1); it.to.b = THREE.MathUtils.clamp(it.to.b, 0, 1);
      if (instant) { it.cur.copy(it.to); it.m.color.copy(it.to); }
    }
  }

  /** (GĐ24) wet 0..1: cỏ sẫm lại khi mưa · snow 0..1: phủ trắng khi tuyết / sương giá */
  setOverlay(wet, snow) { this.wet = wet; this.snow = snow; }

  update(dt) {
    const k = 1 - Math.exp(-dt * 0.8);
    for (const it of this.items) {
      it.cur.lerp(it.to, k);
      it.m.color.copy(it.cur).multiplyScalar(1 - this.wet * 0.2).lerp(this.white, this.snow * (it.key === 'grass' || it.key === 'farm' ? 0.82 : 0.6));
    }
  }
}
