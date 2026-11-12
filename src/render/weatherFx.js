// 🌦️ Hạt thời tiết TRONG THẾ GIỚI 3D (viết lại ở 0.25.2 — trước đây hạt rơi đều khắp màn hình nên nhìn như một lớp phủ).
//  - Mây là những cụm bông 3D thật bay trên đảo (cao ~13), trôi theo gió, có bóng đổ dưới đất.
//  - Mưa / tuyết / mưa đá RƠI TỪ DƯỚI ĐÁM MÂY: chỗ có mây mới có mưa ⇒ thấy từng cột mưa trôi qua đảo.
//  - Hạt rơi chạm đất thì bắn bọt nước đúng chỗ đó (rơi xuống biển thì thành vòng gợn sóng); tuyết nằm lại trên cỏ một lúc;
//    mưa đá nảy lên rồi nằm lại. Nhà, cây phía trước che được hạt mưa phía sau (có chiều sâu).
//  - Cánh hoa (xuân) / lá (thu) rụng từ chính các ngọn cây gần đó, chao lượn rồi nằm trên cỏ.
//  - Gió lớn: lá bị cuốn bay ngang theo từng cơn, một dải gió chạy qua đảo, mây chạy nhanh (cây nghiêng ở forest.js).
//  - Sương mù / mưa: sương thật theo chiều sâu (THREE.Fog) — chỗ xa mờ dần, chỗ gần vẫn rõ.
//  - Sao băng bay trên trời đảo · cầu vồng là cung thật đứng trên đảo.
// Lưu ý: camera trực giao ⇒ kích thước chấm (Points) tính bằng điểm ảnh (sizeAttenuation: false).
import * as THREE from 'three';

const N = 1100;          // số hạt mưa / tuyết tối đa
const NF = 160;          // số cánh hoa / lá tối đa
const NS = 140;          // số bọt nước tối đa
const NC = 14;           // số đám mây
const CLOUD_Y = 13;
const AREA = { x0: -62, x1: 78, z0: -62, z1: 68 }; // vùng mây trôi

function dotTexture(soft) {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(soft ? 0.25 : 0.6, soft ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,1)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function shadowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(64, 64, 4, 64, 64, 62);
  g.addColorStop(0, 'rgba(30,40,60,0.85)'); g.addColorStop(0.6, 'rgba(30,40,60,0.4)'); g.addColorStop(1, 'rgba(30,40,60,0)');
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Cấu hình từng kiểu: clouds = số mây · cloud = màu mây · alpha = độ đặc của mây · precip = loại hạt rơi · rate = số hạt
//  fall = tốc độ rơi · wind = gió ngang · fog = [độ xa bắt đầu mờ, độ xa mờ hẳn] tính từ máy quay (máy quay cách tâm nhìn ~60)
const MODES = {
  sunny: { clouds: 3, cloud: '#ffffff', alpha: 0.5, wind: 1 },
  heat: { clouds: 0, cloud: '#ffffff', alpha: 0.4, wind: 0.5 },
  rainbow: { clouds: 4, cloud: '#ffffff', alpha: 0.55, wind: 1, arc: true },
  meteor: { clouds: 0, cloud: '#ffffff', alpha: 0.3, wind: 0.5, meteors: 7 },
  rain: { clouds: 11, cloud: '#c3cad3', alpha: 0.82, precip: 'rain', rate: 700, fall: 17, wind: 1.6, fog: [58, 125] },
  storm: { clouds: 14, cloud: '#8d96a3', alpha: 0.9, precip: 'rain', rate: N, fall: 24, wind: 6, fog: [54, 105] },
  hail: { clouds: 12, cloud: '#aab2bc', alpha: 0.86, precip: 'hail', rate: 380, fall: 15, wind: 1.5, fog: [58, 125] },
  snow: { clouds: 11, cloud: '#eef2f5', alpha: 0.8, precip: 'snow', rate: 650, fall: 1.7, wind: 0.8, fog: [56, 115] },
  frost: { clouds: 3, cloud: '#eef2f5', alpha: 0.5, precip: 'snow', rate: 120, fall: 1.2, wind: 0.5 },
  wind: { clouds: 7, cloud: '#e6ebf0', alpha: 0.6, wind: 9, gust: true },
  fog: { clouds: 5, cloud: '#e4e8ec', alpha: 0.55, wind: 0.6, fog: [46, 82], cloudY: 9 },
};

export class WeatherFx {
  constructor(scene, camera = null) {
    this.scene = scene;
    this.camera = camera;
    this.t = 0;
    this.density = 1;
    this.onLand = () => true;
    this.trees = [];
    this.root = new THREE.Group();
    scene.add(this.root);
    // ---------- mây 3D ----------
    const puffGeo = new THREE.IcosahedronGeometry(1, 1);
    const shTex = shadowTexture();
    this.clouds = Array.from({ length: NC }, (_, i) => {
      const g = new THREE.Group();
      const m = new THREE.MeshLambertMaterial({ color: '#ffffff', emissive: '#ffffff', emissiveIntensity: 0.45, transparent: true, opacity: 0, depthWrite: false });
      const r = 4 + Math.random() * 4.5;
      const n = 10 + Math.floor(Math.random() * 5); // nhiều cụm bông nhỏ ⇒ mây xốp, mềm
      for (let k = 0; k < n; k++) {
        const p = new THREE.Mesh(puffGeo, m);
        const a = (k / n) * Math.PI * 2 + Math.random() * 0.6, d = (k === 0 ? 0 : 0.35 + Math.random() * 0.45) * r;
        const s = r * (0.26 + Math.random() * 0.18) * (k === 0 ? 1.5 : 1);
        p.position.set(Math.cos(a) * d, Math.random() * 0.8, Math.sin(a) * d * 0.7);
        p.scale.set(s, s * 0.62, s * 0.85);
        g.add(p);
      }
      const sh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: shTex, transparent: true, opacity: 0, depthWrite: false }));
      sh.rotation.x = -Math.PI / 2;
      sh.scale.set(r * 2.6, r * 1.9, 1);
      sh.renderOrder = 2;
      this.root.add(g, sh);
      return { g, m, sh, r, x: AREA.x0 + Math.random() * (AREA.x1 - AREA.x0), z: AREA.z0 + Math.random() * (AREA.z1 - AREA.z0), y: CLOUD_Y + Math.random() * 3, v: 0.7 + Math.random() * 0.6, on: 0, idx: i };
    });
    this.cloudColor = new THREE.Color('#ffffff');
    // ---------- mưa (vệt) ----------
    const rg = new THREE.BufferGeometry();
    rg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 6), 3));
    this.rain = new THREE.LineSegments(rg, new THREE.LineBasicMaterial({ color: '#d6e8f8', transparent: true, opacity: 0.7, depthWrite: false }));
    this.rain.frustumCulled = false;
    // ---------- tuyết / mưa đá (chấm) ----------
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
    this.flakes = new THREE.Points(sg, new THREE.PointsMaterial({ color: '#ffffff', size: 4, sizeAttenuation: false, map: dotTexture(false), transparent: true, opacity: 0.95, depthWrite: false, alphaTest: 0.05 }));
    this.flakes.frustumCulled = false;
    this.drops = Array.from({ length: N }, () => ({ x: 0, y: -99, z: 0, vy: 0, st: 0, life: 0, s: 0.7 + Math.random() * 0.6, ph: Math.random() * 6 }));
    // ---------- cánh hoa / lá (rụng từ cây) ----------
    const fg = new THREE.BufferGeometry();
    fg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(NF * 3), 3));
    fg.setAttribute('color', new THREE.BufferAttribute(new Float32Array(NF * 3).fill(1), 3));
    this.petals = new THREE.Points(fg, new THREE.PointsMaterial({ size: 7, sizeAttenuation: false, map: dotTexture(false), vertexColors: true, transparent: true, depthWrite: false, alphaTest: 0.05 }));
    this.petals.frustumCulled = false;
    this.pts = Array.from({ length: NF }, () => ({ x: 0, y: -99, z: 0, st: 0, life: 0, ph: Math.random() * 6, s: 0.7 + Math.random() * 0.6 }));
    // ---------- vệt gió (chỉ trong từng dải gió, sát mặt đất) ----------
    const wg = new THREE.BufferGeometry();
    wg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(60 * 6), 3));
    this.gusts = new THREE.LineSegments(wg, new THREE.LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.45, depthWrite: false }));
    this.gusts.frustumCulled = false;
    this.gustPts = Array.from({ length: 60 }, () => ({ x: 0, y: 0, z: 0, l: 0 }));
    this.gustX = -40;
    // ---------- bọt nước / vòng gợn ----------
    this.splashMat = new THREE.MeshBasicMaterial({ color: '#eaf5ff', transparent: true, opacity: 0.75, depthWrite: false, side: THREE.DoubleSide });
    this.splashes = new THREE.InstancedMesh(new THREE.RingGeometry(0.6, 0.85, 16), this.splashMat, NS);
    this.splashes.frustumCulled = false;
    this.spl = Array.from({ length: NS }, () => ({ x: 0, y: 0, z: 0, t: 1, big: false }));
    this.splNext = 0;
    // ---------- sao băng ----------
    const tg = new THREE.BufferGeometry();
    tg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(8 * 6), 3));
    this.trails = new THREE.LineSegments(tg, new THREE.LineBasicMaterial({ color: '#fff6d0', transparent: true, opacity: 0.9, depthWrite: false }));
    this.trails.renderOrder = 21;
    this.trails.frustumCulled = false;
    this.meteors = Array.from({ length: 8 }, () => ({ t: -Math.random() * 2, u: Math.random() * 0.7 - 0.3, v: Math.random() * 0.3 }));
    const hg = new THREE.BufferGeometry();
    hg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(8 * 3), 3));
    this.heads = new THREE.Points(hg, new THREE.PointsMaterial({ color: '#fffbe6', size: 11, sizeAttenuation: false, map: dotTexture(true), transparent: true, depthWrite: false }));
    this.heads.frustumCulled = false;
    this.heads.renderOrder = 22;
    // ---------- cầu vồng: cung thật đứng trên đảo ----------
    this.arc = new THREE.Group();
    ['#ff6b6b', '#ffa94d', '#ffe066', '#8ce99a', '#74c0fc', '#748ffc', '#b197fc'].forEach((col) => {
      const m = new THREE.Mesh(new THREE.TorusGeometry(15 - this.arc.children.length * 0.55, 0.3, 4, 48, Math.PI), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0, depthWrite: false, fog: false }));
      m.renderOrder = 4;
      this.arc.add(m);
    });
    this.arc.position.set(2, -0.4, 0);
    this.arc.rotation.y = Math.PI / 4;
    this.arc.scale.setScalar(1.6);
    this.root.add(this.rain, this.flakes, this.petals, this.gusts, this.splashes, this.trails, this.heads, this.arc);
    // sương theo chiều sâu
    this.fog = new THREE.Fog('#dfe5ea', 1e4, 2e4);
    scene.fog = this.fog;
    this.fogNear = 1e4; this.fogFar = 2e4;
    this.mode = 'sunny';
    this.set('sunny', 0);
  }

  /** Gắn thông tin bản đồ: shapes = các hình tròn đất liền · trees = [[x, z, loại, cỡ]] (ngọn cây để cánh hoa rụng) */
  attach({ shapes = [], trees = [] } = {}) {
    this.onLand = (x, z) => shapes.some((c) => Math.hypot(x - c.x, z - c.z) < c.r - 0.3);
    this.trees = trees;
  }

  /** type: thời tiết hôm nay · seasonIndex: mùa (xuân có cánh hoa, thu có lá rụng) */
  set(type, seasonIndex) {
    this.mode = MODES[type] ? type : 'sunny';
    this.season = seasonIndex;
    const M = this.cfg = MODES[this.mode];
    this.cloudColor.set(M.cloud);
    // mưa / tuyết ⇒ dời sẵn vài đám mây về phía đang nhìn để thấy ngay
    if (M.precip && this.lastCenter) {
      this.clouds.slice(0, Math.ceil(M.clouds * 0.5)).forEach((c, i) => {
        const a = (i / 6) * Math.PI * 2 + Math.random(), d = 4 + Math.random() * 16;
        c.x = this.lastCenter.x + Math.cos(a) * d; c.z = this.lastCenter.z + Math.sin(a) * d;
      });
    }
    // cánh hoa (xuân) / lá (thu) — gió lớn thì lá xanh + vàng
    this.petalMode = M.gust ? 'wind' : M.precip ? null : seasonIndex === 0 ? 'petal' : seasonIndex === 2 ? 'leaf' : null;
    const cols = { petal: ['#ffc4d6', '#ffe0ea', '#ffffff'], leaf: ['#f0a85a', '#e0603a', '#f2c14e'], wind: ['#9cc46a', '#d9a35a', '#c7d98a'] }[this.petalMode] || ['#ffffff'];
    const col = this.petals.geometry.attributes.color.array, c = new THREE.Color();
    for (let i = 0; i < NF; i++) { c.set(cols[i % cols.length]); col.set([c.r, c.g, c.b], i * 3); }
    this.petals.geometry.attributes.color.needsUpdate = true;
    this.flakes.material.size = M.precip === 'hail' ? 5 : 4;
    this.flakes.material.color.set(M.precip === 'hail' ? '#eef7ff' : '#ffffff');
    this.rain.material.color.set(this.mode === 'storm' ? '#c9d6e6' : '#d6e8f8');
  }

  // ---------- mặt đất ----------
  groundY(x, z) { return this.onLand(x, z) ? 0.05 : -1.25; }

  splash(x, z, y, big) {
    const s = this.spl[this.splNext];
    this.splNext = (this.splNext + 1) % NS;
    s.x = x; s.y = y + 0.02; s.z = z; s.t = 0; s.big = big;
  }

  /** Một điểm dưới đám mây đang hoạt động gần (cx, cz) — dùng cho hạt rơi và tia sét */
  cloudPoint(cx, cz, maxD = 34) {
    const near = this.clouds.filter((c) => c.on > 0.3 && Math.hypot(c.x - cx, c.z - cz) < maxD + c.r);
    if (!near.length) return null;
    const c = near[Math.floor(Math.random() * near.length)];
    const a = Math.random() * Math.PI * 2, d = Math.sqrt(Math.random()) * c.r * 0.85;
    return { x: c.x + Math.cos(a) * d, z: c.z + Math.sin(a) * d * 0.8, y: (this.cfg.cloudY || c.y) - 0.6, c };
  }

  update(dt, center, hourFloat = 12) {
    this.t += dt;
    this.lastCenter = center;
    const M = this.cfg, t = this.t;
    const night = hourFloat >= 19 || hourFloat < 5;
    const windX = M.wind || 1, windZ = windX * 0.25;
    // ---------- mây ----------
    const zoom = this.camera?.zoom || 1;
    const proj = new THREE.Vector3();
    this.clouds.forEach((c, i) => {
      const want = i < M.clouds ? 1 : 0;
      c.on += (want - c.on) * Math.min(1, dt * 0.4);
      c.x += windX * c.v * dt * 0.6; c.z += windZ * c.v * dt * 0.6;
      if (c.x > AREA.x1) { c.x = AREA.x0; c.z = AREA.z0 + Math.random() * (AREA.z1 - AREA.z0); }
      if (c.z > AREA.z1) c.z = AREA.z0;
      const cy = M.cloudY || c.y;
      c.g.position.set(c.x, cy, c.z);
      c.sh.position.set(c.x + 1.5, 0.08, c.z + 1.0);
      c.m.color.lerp(this.cloudColor, Math.min(1, dt * 0.8));
      c.m.emissive.copy(c.m.color).multiplyScalar(night ? 0.1 : 0.5);
      // mây trôi ngang chỗ đang nhìn thì mờ bớt để vẫn thấy ruộng / tiệm
      let a = M.alpha * c.on * (night ? 0.6 : 1);
      if (this.camera && a > 0) {
        proj.set(c.x, cy, c.z).project(this.camera);
        const dc = Math.hypot(proj.x, proj.y);
        if (dc < 0.8) a *= 0.06 + 0.94 * (dc / 0.8) ** 2; // giữa màn hình gần như trong suốt
        if (zoom > 1.0) a *= Math.max(0.15, 1 - (zoom - 1.0) * 1.2);
      }
      c.m.opacity = a;
      c.g.visible = a > 0.01;
      c.sh.material.opacity = c.on * (M.precip ? 0.42 : 0.2) * (night ? 0.3 : 1);
      c.sh.visible = c.sh.material.opacity > 0.01;
    });
    // ---------- mưa / tuyết / mưa đá rơi từ mây ----------
    const P = M.precip;
    const count = P ? Math.round(M.rate * this.density) : 0;
    this.rain.visible = P === 'rain';
    this.flakes.visible = P === 'snow' || P === 'hail';
    if (P) {
      const ra = this.rain.geometry.attributes.position.array, fa = this.flakes.geometry.attributes.position.array;
      for (let i = 0; i < N; i++) {
        const d = this.drops[i];
        if (i >= count) { ra.fill(0, i * 6, i * 6 + 6); fa.fill(-99, i * 3, i * 3 + 3); d.y = -99; continue; }
        if (d.y <= -50) { // sinh hạt mới dưới một đám mây gần đây; lần đầu rải đều theo chiều cao để cột mưa đầy ngay
          const q = this.cloudPoint(center.x, center.z);
          if (!q) { ra.fill(0, i * 6, i * 6 + 6); fa.fill(-99, i * 3, i * 3 + 3); continue; }
          d.x = q.x; d.z = q.z; d.y = d.fresh ? q.y : Math.random() * q.y; d.fresh = true; d.st = 0; d.b = 0; d.vy = -M.fall * d.s;
        }
        if (d.st === 0) { // đang rơi
          d.x += windX * (P === 'snow' ? 0.5 + Math.sin(t * 1.3 + d.ph) * 0.6 : 0.35) * dt;
          d.z += (P === 'snow' ? Math.cos(t * 1.1 + d.ph) * 0.4 : windZ * 0.2) * dt;
          d.vy = P === 'hail' ? Math.max(-M.fall, d.vy - 22 * dt) : -M.fall * d.s;
          d.y += d.vy * dt;
          const gy = this.groundY(d.x, d.z);
          if (d.y <= gy) {
            d.y = gy;
            if (P === 'rain') { if (Math.random() < 0.55) this.splash(d.x, d.z, gy, gy < 0); d.y = -99; }
            else if (P === 'hail') { if (!d.b && gy > 0) { d.b = 1; d.vy = 3 + Math.random() * 2; d.y = gy + 0.02; } else { d.st = 1; d.life = 1.2; } }
            else { d.st = 1; d.life = gy < 0 ? 0.2 : 2 + Math.random() * 2.5; } // tuyết nằm lại trên cỏ, rơi xuống biển thì tan
          }
        } else { // nằm trên mặt đất
          d.life -= dt;
          if (d.life <= 0) d.y = -99;
        }
        if (P === 'rain') {
          const len = this.mode === 'storm' ? 0.75 : 0.55;
          ra.set([d.x, d.y, d.z, d.x - windX * 0.035, d.y + len, d.z - windZ * 0.03], i * 6);
        } else fa.set([d.x, d.y, d.z], i * 3);
      }
      this.rain.geometry.attributes.position.needsUpdate = true;
      this.flakes.geometry.attributes.position.needsUpdate = true;
    }
    // ---------- bọt nước / vòng gợn ----------
    this.splashes.visible = P === 'rain';
    if (this.splashes.visible) {
      const o = new THREE.Object3D();
      this.spl.forEach((s, i) => {
        s.t += dt * (s.big ? 1.6 : 3.2);
        const k = s.t, vis = k < 1;
        o.position.set(s.x, s.y, s.z); o.rotation.set(-Math.PI / 2, 0, 0);
        const sc = vis ? (s.big ? 0.25 + k * 0.9 : 0.12 + k * 0.4) : 0.0001;
        o.scale.set(sc, sc, sc); o.updateMatrix();
        this.splashes.setMatrixAt(i, o.matrix);
      });
      this.splashes.instanceMatrix.needsUpdate = true;
    }
    // ---------- cánh hoa / lá rụng từ cây ----------
    this.petals.visible = !!this.petalMode;
    if (this.petals.visible) {
      const pa = this.petals.geometry.attributes.position.array;
      if (!this.nearT || this.nearT < t) { // danh sách cây gần chỗ đang nhìn (cập nhật mỗi giây)
        this.nearT = t + 1;
        this.near = this.trees.filter(([x, z]) => Math.abs(x - center.x) < 30 && Math.abs(z - center.z) < 30);
      }
      const near = this.near;
      const wind = this.petalMode === 'wind';
      const live = Math.round((wind ? 140 : 80) * this.density);
      for (let i = 0; i < NF; i++) {
        const p = this.pts[i];
        if (i >= live || !near.length) { pa.fill(-99, i * 3, i * 3 + 3); p.y = -99; continue; }
        if (p.y <= -50) {
          const tr = near[Math.floor(Math.random() * near.length)];
          const s = tr[3] || 1;
          p.x = tr[0] + (Math.random() - 0.5) * 1.6 * s; p.z = tr[1] + (Math.random() - 0.5) * 1.6 * s;
          p.y = p.fresh ? 1.6 * s + Math.random() * 1.2 * s : Math.random() * 2.8 * s; p.fresh = true; p.st = 0;
        }
        if (p.st === 0) {
          const gw = wind ? windX * (0.8 + Math.sin(t * 2 + p.ph) * 0.4) : 0.6;
          p.x += (gw + Math.sin(t * 1.7 + p.ph) * 0.5) * dt;
          p.z += (Math.cos(t * 1.3 + p.ph) * 0.45 + (wind ? windZ : 0)) * dt;
          p.y -= (wind ? 0.35 : 0.65) * p.s * dt;
          if (wind) p.y += Math.sin(t * 3 + p.ph) * 0.9 * dt;
          if (p.y <= 0.06) { p.y = 0.06; p.st = 1; p.life = wind ? 0.8 : 4 + Math.random() * 3; }
        } else {
          p.life -= dt;
          if (wind) p.x += windX * 0.3 * dt; // bị gió lùa trên mặt đất
          if (p.life <= 0) p.y = -99;
        }
        pa.set([p.x, p.y, p.z], i * 3);
      }
      this.petals.geometry.attributes.position.needsUpdate = true;
    }
    // ---------- vệt gió: một dải gió chạy ngang đảo, chỉ có vệt trong dải ----------
    this.gusts.visible = !!M.gust;
    if (this.gusts.visible) {
      this.gustX += windX * 2.2 * dt;
      if (this.gustX > center.x + 30 || this.gustX < center.x - 40) this.gustX = center.x - 30;
      const ga = this.gusts.geometry.attributes.position.array;
      this.gustPts.forEach((g, i) => {
        g.l -= dt;
        if (g.l <= 0) { g.x = this.gustX + (Math.random() - 0.5) * 8; g.z = center.z + (Math.random() - 0.5) * 34; g.y = 0.3 + Math.random() * 2.2; g.l = 0.5 + Math.random() * 0.7; }
        g.x += windX * 2.4 * dt;
        const len = 1.4 + g.l;
        ga.set([g.x, g.y, g.z, g.x - len, g.y + Math.sin(t * 4 + i) * 0.08, g.z - len * 0.25], i * 6);
      });
      this.gusts.geometry.attributes.position.needsUpdate = true;
    }
    // ---------- sương theo chiều sâu ----------
    const [fn, ff] = M.fog || [1e4, 2e4];
    this.fogNear += (fn - this.fogNear) * Math.min(1, dt * 0.6);
    this.fogFar += (ff - this.fogFar) * Math.min(1, dt * 0.6);
    this.fog.near = this.fogNear; this.fog.far = this.fogFar;
    if (this.scene.background?.isColor) this.fog.color.copy(this.scene.background);
    // ---------- sao băng: bay chéo trên trời đảo, chỉ ban đêm ----------
    this.trails.visible = this.heads.visible = !!M.meteors;
    if (this.trails.visible) {
      const arr = this.trails.geometry.attributes.position.array, ha = this.heads.geometry.attributes.position.array;
      for (let i = 0; i < 8; i++) {
        const m = this.meteors[i];
        ha.fill(-50, i * 3, i * 3 + 3);
        if (!night || i >= M.meteors) { arr.fill(-50, i * 6, i * 6 + 6); continue; }
        m.t += dt;
        if (m.t > 0.9) { m.t = -0.4 - Math.random() * 2.2; m.u = Math.random() * 0.7 - 0.3; m.v = Math.random() * 0.3; }
        if (m.t < 0) { arr.fill(-50, i * 6, i * 6 + 6); continue; }
        const k = m.t / 0.9;
        const sx = center.x + m.u * 60, sz = center.z + (m.v - 0.15) * 80;
        const A = new THREE.Vector3(sx - k * 14, 24 - k * 16, sz + k * 5);
        const tail = Math.min(1, m.t * 4) * 4.5;
        arr.set([A.x, A.y, A.z, A.x + tail * 0.64, A.y + tail * 0.73, A.z - tail * 0.23], i * 6);
        ha.set([A.x, A.y, A.z], i * 3);
      }
      this.trails.geometry.attributes.position.needsUpdate = true;
      this.heads.geometry.attributes.position.needsUpdate = true;
    }
    // ---------- cầu vồng (ban ngày) ----------
    const day = hourFloat >= 6.5 && hourFloat <= 18;
    this.arc.children.forEach((m) => { m.material.opacity += ((M.arc && day ? 0.5 : 0) - m.material.opacity) * Math.min(1, dt * 2); });
    this.arc.visible = this.arc.children[0].material.opacity > 0.01;
  }
}
