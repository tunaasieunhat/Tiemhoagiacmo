// Hiệu ứng thời tiết: mưa, tuyết, bão, cánh hoa bay mùa xuân.
import * as THREE from 'three';

const N = 900;
const AREA = 26;
const TOP = 16;

export class WeatherFx {
  constructor(scene) {
    // mưa: các vệt ngắn
    const rg = new THREE.BufferGeometry();
    rg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 6), 3));
    this.rain = new THREE.LineSegments(rg, new THREE.LineBasicMaterial({ color: '#cfe8ff', transparent: true, opacity: 0.55, depthWrite: false }));
    this.rain.frustumCulled = false;
    // tuyết / cánh hoa: các chấm
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
    this.flakes = new THREE.Points(sg, new THREE.PointsMaterial({ color: '#ffffff', size: 0.16, transparent: true, opacity: 0.9, depthWrite: false }));
    this.flakes.frustumCulled = false;
    scene.add(this.rain, this.flakes);
    this.drops = Array.from({ length: N }, () => ({ x: (Math.random() - 0.5) * AREA, y: Math.random() * TOP, z: (Math.random() - 0.5) * AREA, s: 0.7 + Math.random() * 0.6, ph: Math.random() * 6 }));
    this.mode = 'none';
    this.t = 0;
  }

  /** type: thời tiết hôm nay; season: chỉ số mùa */
  set(type, seasonIndex) {
    if (type === 'rain' || type === 'storm') this.mode = type;
    else if (type === 'snow' || type === 'frost') this.mode = 'snow';
    else if (seasonIndex === 0) this.mode = 'petals';
    else if (seasonIndex === 2) this.mode = 'leaves';
    else this.mode = 'none';
    this.rain.visible = this.mode === 'rain' || this.mode === 'storm';
    this.flakes.visible = ['snow', 'petals', 'leaves'].includes(this.mode);
    const pm = this.flakes.material;
    if (this.mode === 'petals') { pm.color.set('#ffc4d6'); pm.size = 0.2; }
    else if (this.mode === 'leaves') { pm.color.set('#f0a85a'); pm.size = 0.22; }
    else { pm.color.set('#ffffff'); pm.size = 0.16; }
  }

  update(dt, center) {
    this.t += dt;
    if (this.mode === 'none') return;
    const storm = this.mode === 'storm';
    const isRain = this.rain.visible;
    // mưa dày, tuyết vừa, cánh hoa thưa
    const count = isRain ? (storm ? N : 600) : this.mode === 'snow' ? 500 : 70;
    const fall = isRain ? (storm ? 22 : 16) : this.mode === 'snow' ? 1.6 : 1.1;
    const wind = storm ? 6 : isRain ? 1.2 : 0.8;
    const arr = (isRain ? this.rain : this.flakes).geometry.attributes.position.array;
    for (let i = 0; i < N; i++) {
      const d = this.drops[i];
      if (i >= count) { if (isRain) arr.fill(0, i * 6, i * 6 + 6); else arr.fill(-50, i * 3, i * 3 + 3); continue; }
      d.y -= fall * d.s * dt;
      d.x += wind * dt + (isRain ? 0 : Math.sin(this.t * 1.5 + d.ph) * 0.4 * dt);
      if (d.y < 0) { d.y = TOP; d.x = (Math.random() - 0.5) * AREA; d.z = (Math.random() - 0.5) * AREA; }
      if (d.x > AREA / 2) d.x -= AREA;
      const X = center.x + d.x, Z = center.z + d.z;
      if (isRain) {
        const len = storm ? 0.7 : 0.5;
        arr.set([X, d.y, Z, X - wind * 0.04, d.y + len, Z], i * 6);
      } else arr.set([X, d.y, Z], i * 3);
    }
    (isRain ? this.rain : this.flakes).geometry.attributes.position.needsUpdate = true;
  }
}
