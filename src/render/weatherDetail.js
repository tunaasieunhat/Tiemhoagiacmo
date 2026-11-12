// 🌦️ Thời tiết chi tiết (GĐ24): những thứ thời tiết để lại TRÊN MẶT ĐẤT và trong thế giới 3D, chạy cùng WeatherFx (hạt mưa / tuyết).
//  - Đất ướt sẫm dần khi mưa, khô dần khi tạnh · vũng nước đọng ở những chỗ trũng
//  - Bọt nước bắn lên khi hạt mưa chạm đất · viên đá nằm lại trên cỏ khi mưa đá
//  - Tuyết phủ trắng dần (cỏ, ruộng, ngọn cây), tan dần khi hết tuyết · sương giá trắng mờ buổi sáng
//  - Bóng mây trôi kéo qua đảo · từng làn sương bay là là · bão: chớp lóe sáng cả đảo + tia sét + tiếng sấm
//  - Nắng nóng: những vệt nắng vàng lung linh
// Số liệu ở data/island.js (WEATHER_FX).
import * as THREE from 'three';
import { WEATHER_FX as W } from '../../data/island.js';

const rng = (seed) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

function softTex(inner, outer) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(64, 64, 2, 64, 64, 62);
  g.addColorStop(0, inner); g.addColorStop(0.55, outer); g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const WET_TYPES = new Set(['rain', 'storm', 'hail']);
const CLOUDY = { rain: 0.32, storm: 0.48, hail: 0.42, wind: 0.22, snow: 0.2, fog: 0.12, frost: 0.08, sunny: 0.07, heat: 0, rainbow: 0.1, meteor: 0 };

export class WeatherDetail {
  /** shapes: các hình tròn của đảo (để vũng nước / bọt nước chỉ nằm trên đất) */
  constructor(scene, shapes) {
    this.scene = scene;
    this.shapes = shapes;
    this.root = new THREE.Group();
    scene.add(this.root);
    this.type = 'sunny';
    this.wet = 0; this.snow = 0; this.hailCover = 0; this.flash = 0; this.t = 0;
    this.nextBolt = 4;
    const rand = rng(5151);
    const onLand = (x, z, pad = 1.5) => shapes.some((c) => Math.hypot(x - c.x, z - c.z) < c.r - pad);
    this.onLand = onLand;
    // ----- vũng nước (cố định trên đảo) -----
    this.puddleMat = new THREE.MeshBasicMaterial({ color: '#7f9fb8', transparent: true, opacity: 0, depthWrite: false });
    const pg = new THREE.CircleGeometry(1, 20);
    this.puddles = new THREE.InstancedMesh(pg, this.puddleMat, W.puddles);
    const d = new THREE.Object3D();
    let n = 0;
    for (let k = 0; k < 800 && n < W.puddles; k++) {
      const x = -40 + rand() * 90, z = -40 + rand() * 86;
      if (!onLand(x, z, 3)) continue;
      d.position.set(x, 0.035, z); d.rotation.set(-Math.PI / 2, 0, rand() * 6); d.scale.set(0.6 + rand() * 1.1, 0.4 + rand() * 0.7, 1); d.updateMatrix();
      this.puddles.setMatrixAt(n++, d.matrix);
    }
    this.puddles.count = n;
    this.puddles.renderOrder = 1;
    this.root.add(this.puddles);
    // ----- bọt nước (quanh chỗ đang nhìn) -----
    this.splashMat = new THREE.MeshBasicMaterial({ color: '#e8f4ff', transparent: true, opacity: 0.7, depthWrite: false, side: THREE.DoubleSide });
    this.splashes = new THREE.InstancedMesh(new THREE.RingGeometry(0.55, 0.8, 14), this.splashMat, W.splashes);
    this.splashes.frustumCulled = false;
    this.spl = Array.from({ length: W.splashes }, () => ({ x: 0, z: 0, life: -Math.random() }));
    this.root.add(this.splashes);
    // ----- viên đá mưa đá nằm trên cỏ -----
    this.ice = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.07, 0), new THREE.MeshBasicMaterial({ color: '#f2f8ff' }), 220);
    this.ice.frustumCulled = false;
    this.icePts = Array.from({ length: 220 }, () => ({ x: (rand() - 0.5) * 30, z: (rand() - 0.5) * 30, s: 0.6 + rand() * 0.8 }));
    this.root.add(this.ice);
    // ----- bóng mây -----
    const shadowTex = softTex('rgba(20,30,50,0.9)', 'rgba(20,30,50,0.45)');
    this.clouds = Array.from({ length: W.clouds }, (_, i) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, opacity: 0, depthWrite: false }));
      m.rotation.x = -Math.PI / 2;
      m.position.set(-45 + rand() * 100, 0.07, -45 + rand() * 90);
      m.scale.set(14 + rand() * 12, 9 + rand() * 8, 1);
      m.userData.v = 0.6 + rand() * 0.6;
      m.renderOrder = 2;
      this.root.add(m);
      return m;
    });
    // ----- làn sương bay là là -----
    const fogTex = softTex('rgba(246,248,250,0.95)', 'rgba(240,244,246,0.5)');
    this.banks = Array.from({ length: 16 }, () => {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: fogTex, transparent: true, opacity: 0, depthWrite: false }));
      s.userData = { x: (rand() - 0.5) * 34, z: (rand() - 0.5) * 34, y: 0.6 + rand() * 1.6, v: 0.3 + rand() * 0.5, ph: rand() * 6 };
      s.scale.set(9 + rand() * 6, 3 + rand() * 2, 1);
      s.renderOrder = 6;
      this.root.add(s);
      return s;
    });
    // ----- vệt nắng (nắng nóng) -----
    const sunTex = softTex('rgba(255,236,170,0.9)', 'rgba(255,220,140,0.35)');
    this.rays = Array.from({ length: 8 }, () => {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: sunTex, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
      s.userData = { x: (rand() - 0.5) * 26, z: (rand() - 0.5) * 26, ph: rand() * 6 };
      s.scale.set(5, 9, 1);
      this.root.add(s);
      return s;
    });
    // ----- tia sét -----
    const bg = new THREE.BufferGeometry();
    bg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(14 * 3), 3));
    this.bolt = new THREE.Line(bg, new THREE.LineBasicMaterial({ color: '#f4f6ff', transparent: true, opacity: 1, depthTest: false }));
    this.bolt.frustumCulled = false; this.bolt.renderOrder = 23; this.bolt.visible = false;
    this.root.add(this.bolt);
    this.boltT = 0;
    this.onThunder = null; // game gắn tiếng sấm vào đây
  }

  set(type) { this.type = type; }

  /** center: điểm camera đang nhìn · hour: giờ trong ngày · density: 0..1 theo mức đồ họa */
  update(dt, center, hour = 12, density = 1) {
    this.t += dt;
    const t = this.t, ty = this.type;
    const wetNow = WET_TYPES.has(ty);
    // ---- độ ướt / tuyết phủ / đá ----
    this.wet = THREE.MathUtils.clamp(this.wet + (wetNow ? W.wetUp : -W.wetDown) * dt, 0, 1);
    const frost = ty === 'frost' && hour >= 3 && hour < 11 ? W.frostMorning * (1 - Math.max(0, hour - 6) / 5) : 0;
    const snowTarget = ty === 'snow' ? 1 : frost;
    if (this.snow < snowTarget) this.snow = Math.min(snowTarget, this.snow + W.snowUp * dt);
    else this.snow = Math.max(snowTarget, this.snow - W.snowDown * dt);
    this.hailCover = THREE.MathUtils.clamp(this.hailCover + (ty === 'hail' ? 0.05 : -0.02) * dt, 0, 1);
    // ---- vũng nước ----
    this.puddleMat.opacity = Math.max(0, this.wet - 0.25) * 0.6;
    this.puddles.visible = this.puddleMat.opacity > 0.01;
    // ---- bọt nước ----
    const rainHard = ty === 'storm' ? 1 : ty === 'rain' ? 0.7 : ty === 'hail' ? 0.5 : 0;
    this.splashes.visible = rainHard > 0;
    if (this.splashes.visible) {
      const d = new THREE.Object3D(), live = Math.round(W.splashes * rainHard * density);
      this.spl.forEach((p, i) => {
        p.life += dt * 2.6;
        if (p.life >= 1 && i < live) { p.life = 0; p.x = center.x + (Math.random() - 0.5) * 26; p.z = center.z + (Math.random() - 0.5) * 26; p.ok = this.onLand(p.x, p.z, 0.5); }
        const k = p.life;
        const vis = i < live && p.ok && k >= 0 && k < 1;
        d.position.set(p.x, 0.06, p.z); d.rotation.set(-Math.PI / 2, 0, 0);
        const sc = vis ? 0.15 + k * 0.55 : 0.0001; d.scale.set(sc, sc, sc); d.updateMatrix();
        this.splashes.setMatrixAt(i, d.matrix);
      });
      this.splashes.instanceMatrix.needsUpdate = true;
    }
    // ---- đá nằm trên cỏ ----
    this.ice.visible = this.hailCover > 0.02;
    if (this.ice.visible) {
      const d = new THREE.Object3D(), show = Math.round(this.icePts.length * this.hailCover);
      this.icePts.forEach((p, i) => { d.position.set(center.x + p.x, 0.07, center.z + p.z); const s = i < show && this.onLand(center.x + p.x, center.z + p.z, 0.5) ? p.s : 0.0001; d.scale.set(s, s, s); d.updateMatrix(); this.ice.setMatrixAt(i, d.matrix); });
      this.ice.instanceMatrix.needsUpdate = true;
    }
    // ---- bóng mây trôi ----
    const cloudy = (CLOUDY[ty] ?? 0.08) * (hour >= 6 && hour <= 18 ? 1 : 0.35);
    const windV = ty === 'storm' ? 4 : ty === 'wind' ? 5 : ty === 'rain' ? 2 : 1.1;
    for (const m of this.clouds) {
      m.position.x += windV * m.userData.v * dt;
      m.position.z += windV * 0.25 * m.userData.v * dt;
      if (m.position.x > 60) { m.position.x = -50; m.position.z = -45 + Math.random() * 90; }
      if (m.position.z > 50) m.position.z = -45;
      m.material.opacity += (cloudy - m.material.opacity) * Math.min(1, dt * 0.5);
      m.visible = m.material.opacity > 0.01;
    }
    // ---- làn sương ----
    const fogAmt = ty === 'fog' ? 0.5 : ty === 'frost' && hour < 9 ? 0.25 : 0;
    for (const s of this.banks) {
      const u = s.userData;
      u.x += u.v * dt; if (u.x > 18) u.x -= 36;
      s.position.set(center.x + u.x, u.y + Math.sin(t * 0.3 + u.ph) * 0.2, center.z + u.z);
      s.material.opacity += (fogAmt * (0.6 + 0.4 * Math.sin(t * 0.2 + u.ph)) - s.material.opacity) * Math.min(1, dt * 0.6);
      s.visible = s.material.opacity > 0.01;
    }
    // ---- vệt nắng ----
    const heat = ty === 'heat' && hour > 8 && hour < 17 ? 0.35 : 0;
    for (const r of this.rays) {
      const u = r.userData;
      r.position.set(center.x + u.x, 3.5 + Math.sin(t * 0.5 + u.ph) * 0.3, center.z + u.z);
      r.material.opacity += (heat * (0.5 + 0.5 * Math.sin(t * 0.8 + u.ph)) - r.material.opacity) * Math.min(1, dt * 1.2);
      r.visible = r.material.opacity > 0.01;
    }
    // ---- chớp & sét (bão) ----
    this.flash = Math.max(0, this.flash - dt * 3.2);
    if (this.boltT > 0) { this.boltT -= dt; this.bolt.material.opacity = Math.max(0, this.boltT / 0.25); if (this.boltT <= 0) this.bolt.visible = false; }
    if (ty === 'storm') {
      this.nextBolt -= dt;
      if (this.nextBolt <= 0) {
        this.nextBolt = W.lightning[0] + Math.random() * (W.lightning[1] - W.lightning[0]);
        this.strike(center);
      }
    }
  }

  /** Một tia sét: lóe sáng + vẽ tia + gọi tiếng sấm (trễ một chút) */
  strike(center) {
    this.flash = 1;
    const x = center.x + (Math.random() - 0.5) * 22, z = center.z + (Math.random() - 0.5) * 22;
    const arr = this.bolt.geometry.attributes.position.array;
    for (let i = 0; i < 14; i++) {
      const k = i / 13;
      arr.set([x + (i ? (Math.random() - 0.5) * 1.6 : 0) + k * 0.5, 28 * (1 - k), z + (Math.random() - 0.5) * 0.8], i * 3);
    }
    this.bolt.geometry.attributes.position.needsUpdate = true;
    this.bolt.visible = true; this.boltT = 0.25;
    const delay = 300 + Math.random() * 900;
    setTimeout(() => this.onThunder?.(), delay);
  }
}
