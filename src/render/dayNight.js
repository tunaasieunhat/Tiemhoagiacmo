// Ánh sáng thay đổi theo giờ trong ngày.
import * as THREE from 'three';
import { glow } from '../models/environment.js';

// Các mốc giờ: màu trời, màu/độ sáng mặt trời, độ sáng môi trường, độ sáng đèn
const KEYS = [
  { h: 0,    sky: '#2a3166', sun: '#9fb2ff', sunI: 0.55, hemiSky: '#8d9be0', hemiGround: '#46507a', hemiI: 1.15, lamp: 1 },
  { h: 4.5,  sky: '#323a72', sun: '#9fb2ff', sunI: 0.55, hemiSky: '#8d9be0', hemiGround: '#46507a', hemiI: 1.15, lamp: 1 },
  { h: 6,    sky: '#ffc9b5', sun: '#ffc39a', sunI: 1.4,  hemiSky: '#ffe2d4', hemiGround: '#b9c99e', hemiI: 1.35, lamp: 0.3 },
  { h: 8,    sky: '#c2e9ff', sun: '#fff3df', sunI: 1.9,  hemiSky: '#ffffff', hemiGround: '#c7e6b0', hemiI: 1.2, lamp: 0 },
  { h: 12,   sky: '#b3e2ff', sun: '#ffffff', sunI: 2.0,  hemiSky: '#ffffff', hemiGround: '#b9dca0', hemiI: 1.2, lamp: 0 },
  { h: 16,   sky: '#c9e6ff', sun: '#fff0d6', sunI: 1.9,  hemiSky: '#fff8ee', hemiGround: '#c2dca2', hemiI: 1.2, lamp: 0 },
  { h: 18,   sky: '#ffc4a8', sun: '#ffaf7d', sunI: 1.6,  hemiSky: '#ffd9c7', hemiGround: '#c9b79a', hemiI: 1.35, lamp: 0.35 },
  { h: 19.5, sky: '#b892cf', sun: '#d9a0d6', sunI: 0.9,  hemiSky: '#d8b8ea', hemiGround: '#6f6a8d', hemiI: 1.2,  lamp: 0.85 },
  { h: 21,   sky: '#2f3670', sun: '#9fb2ff', sunI: 0.55, hemiSky: '#8d9be0', hemiGround: '#46507a', hemiI: 1.15, lamp: 1 },
  { h: 24,   sky: '#2a3166', sun: '#9fb2ff', sunI: 0.55, hemiSky: '#8d9be0', hemiGround: '#46507a', hemiI: 1.15, lamp: 1 },
];
const KEYS_C = KEYS.map((k) => ({ ...k, sky: new THREE.Color(k.sky), sun: new THREE.Color(k.sun), hemiSky: new THREE.Color(k.hemiSky), hemiGround: new THREE.Color(k.hemiGround) }));

export class DayNight {
  constructor(stage, lampLights = []) {
    this.stage = stage;
    this.lampLights = lampLights;
    this.tmp = new THREE.Color();
    this.night = 0;
    this.wx = { sun: 1, hemi: 1, sky: new THREE.Color('#ffffff'), skyAmt: 0 };
    this.wxTarget = { sun: 1, hemi: 1, sky: new THREE.Color('#ffffff'), skyAmt: 0 };
  }

  /** Thời tiết làm trời tối / sáng hơn */
  setWeather(type) {
    const T = {
      rain: [0.55, 0.88, '#9aa7b8', 0.45], storm: [0.35, 0.75, '#6f7a8c', 0.6],
      snow: [0.85, 1, '#e6eef5', 0.35], frost: [0.9, 1, '#dfe9f5', 0.3], heat: [1.12, 1.05, '#ffd9a0', 0.25],
    }[type] || [1, 1, '#ffffff', 0];
    Object.assign(this.wxTarget, { sun: T[0], hemi: T[1], skyAmt: T[3] });
    this.wxTarget.sky.set(T[2]);
  }

  update(hourFloat, focus, dt = 0.016) {
    const k = 1 - Math.exp(-dt * 1.5);
    const W = this.wx, WT = this.wxTarget;
    W.sun += (WT.sun - W.sun) * k; W.hemi += (WT.hemi - W.hemi) * k; W.skyAmt += (WT.skyAmt - W.skyAmt) * k;
    W.sky.lerp(WT.sky, k);
    const { scene, sun, hemi } = this.stage;
    let i = 0;
    while (i < KEYS_C.length - 2 && KEYS_C[i + 1].h <= hourFloat) i++;
    const a = KEYS_C[i], b = KEYS_C[i + 1];
    const t = THREE.MathUtils.smoothstep(hourFloat, a.h, b.h);

    scene.background.copy(a.sky).lerp(b.sky, t);
    sun.color.copy(a.sun).lerp(b.sun, t);
    sun.intensity = THREE.MathUtils.lerp(a.sunI, b.sunI, t);
    hemi.color.copy(a.hemiSky).lerp(b.hemiSky, t);
    hemi.groundColor.copy(a.hemiGround).lerp(b.hemiGround, t);
    hemi.intensity = THREE.MathUtils.lerp(a.hemiI, b.hemiI, t);
    sun.intensity *= W.sun;
    hemi.intensity *= W.hemi;
    scene.background.lerp(W.sky, W.skyAmt * (1 - this.night * 0.7));
    const lamp = THREE.MathUtils.lerp(a.lamp, b.lamp, t);
    this.night = lamp;
    glow.bulb.emissiveIntensity = lamp * 1.6;
    glow.window.emissiveIntensity = lamp * 1.1;
    this.lampLights.forEach((l) => { l.intensity = lamp * 6; l.visible = lamp > 0.05; });

    // hướng mặt trời: mọc 6h, lặn 18h; ban đêm là "mặt trăng"
    const day = hourFloat >= 6 && hourFloat <= 18;
    const p = day ? (hourFloat - 6) / 12 : ((hourFloat + 6) % 24) / 12;
    const az = Math.PI * (0.15 + p * 0.7);
    const elev = 0.45 + Math.sin(p * Math.PI) * 0.6;
    const dir = new THREE.Vector3(Math.cos(az) * -1, elev, Math.sin(az) * 0.6 + 0.4).normalize();
    sun.position.copy(focus).addScaledVector(dir, 40);
    sun.target.position.copy(focus);
  }
}
