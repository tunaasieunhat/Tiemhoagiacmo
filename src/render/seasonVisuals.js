// Đổi màu cỏ & lá cây trên đảo theo mùa (chuyển dần cho mượt).
import * as THREE from 'three';
import { mat } from '../models/materials.js';
import { SEASONS } from '../../data/seasons.js';

// màu gốc (mùa xuân) -> thuộc tính màu trong SEASONS
const TARGETS = [
  ['#b5e39a', 'grass'], ['#a5d98a', 'farm'], ['#9ccf82', 'farm'],
  ['#8fd18b', 'leaf'], ['#7cc27f', 'leaf'], ['#93d48d', 'leaf'], ['#a6dd94', 'leaf2'],
];

export class SeasonVisuals {
  constructor() {
    this.items = TARGETS.map(([base, key]) => ({ m: mat(base), base: new THREE.Color(base), key, to: new THREE.Color(base) }));
    this.season = -1;
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
      if (instant) it.m.color.copy(it.to);
    }
  }

  update(dt) {
    const k = 1 - Math.exp(-dt * 0.8);
    for (const it of this.items) it.m.color.lerp(it.to, k);
  }
}
