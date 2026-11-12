// Hiệu ứng thời tiết: mưa, tuyết, bão, cánh hoa / lá bay theo mùa,
// GĐ14: mưa đá, gió lớn, sương mù, cầu vồng, mưa sao băng.
// Lưu ý: camera trực giao ⇒ kích thước chấm (Points) tính bằng điểm ảnh (sizeAttenuation: false).
import * as THREE from 'three';

const N = 900;
const AREA = 26;
const TOP = 16;

/** Ảnh tròn mềm cho chấm (tuyết, cánh hoa, sương) */
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

// Cấu hình từng chế độ: số hạt, tốc độ rơi, gió, kích thước chấm (px), màu
const MODES = {
  rain: { lines: 600, fall: 16, wind: 1.2, len: 0.5 },
  storm: { lines: N, fall: 22, wind: 6, len: 0.7 },
  hail: { lines: 260, fall: 18, wind: 1.5, len: 0.45, dots: 260, dotFall: 13, size: 5, color: '#eef7ff' },
  wind: { streaks: 70, dots: 150, dotFall: 0.7, wind: 9, size: 7, color: '#9cc46a', color2: '#d9a35a', swirl: 1.6 },
  snow: { dots: 500, dotFall: 1.6, wind: 0.8, size: 4, color: '#ffffff' },
  petals: { dots: 70, dotFall: 1.1, wind: 0.8, size: 7, color: '#ffc4d6' },
  leaves: { dots: 70, dotFall: 1.1, wind: 0.8, size: 8, color: '#f0a85a' },
  fog: { mist: 46 },
  rainbow: { arc: true, dots: 40, dotFall: 0.9, wind: 0.5, size: 6, color: '#fff4b8' },
  meteor: { meteors: 7 },
};

export class WeatherFx {
  constructor(scene, camera = null) {
    this.camera = camera;
    // mưa: các vệt ngắn (gió lớn: vệt gió nằm ngang)
    const rg = new THREE.BufferGeometry();
    rg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 6), 3));
    this.rain = new THREE.LineSegments(rg, new THREE.LineBasicMaterial({ color: '#cfe8ff', transparent: true, opacity: 0.55, depthWrite: false }));
    this.rain.frustumCulled = false;
    // tuyết / cánh hoa / mưa đá / lá: các chấm
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
    sg.setAttribute('color', new THREE.BufferAttribute(new Float32Array(N * 3).fill(1), 3));
    this.flakes = new THREE.Points(sg, new THREE.PointsMaterial({ size: 4, sizeAttenuation: false, map: dotTexture(false), vertexColors: true, transparent: true, opacity: 0.95, depthWrite: false, alphaTest: 0.05 }));
    this.flakes.frustumCulled = false;
    // sương mù: các đám mây mờ to sát mặt đất
    const mg = new THREE.BufferGeometry();
    mg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(64 * 3), 3));
    this.mist = new THREE.Points(mg, new THREE.PointsMaterial({ color: '#f4f6f8', size: 160, sizeAttenuation: false, map: dotTexture(true), transparent: true, opacity: 0.32, depthWrite: false }));
    this.mist.frustumCulled = false;
    this.mist.renderOrder = 5;
    this.mistPts = Array.from({ length: 64 }, () => ({ x: (Math.random() - 0.5) * AREA, y: 0.4 + Math.random() * 2.2, z: (Math.random() - 0.5) * AREA, v: 0.15 + Math.random() * 0.3 }));
    // sao băng: vài vệt sáng dài trên trời
    const tg = new THREE.BufferGeometry();
    tg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(8 * 6), 3));
    this.trails = new THREE.LineSegments(tg, new THREE.LineBasicMaterial({ color: '#fff6d0', transparent: true, opacity: 0.9, depthWrite: false }));
    this.trails.renderOrder = 21;
    this.trails.frustumCulled = false;
    // vị trí sao băng tính theo khung màn hình (u, v: -0.5..0.5), vì camera trực giao không thấy bầu trời
    this.meteors = Array.from({ length: 8 }, () => ({ t: -Math.random() * 2, u: Math.random() * 0.7 - 0.3, v: Math.random() * 0.3 }));
    const hg = new THREE.BufferGeometry();
    hg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(8 * 3), 3));
    this.heads = new THREE.Points(hg, new THREE.PointsMaterial({ color: '#fffbe6', size: 11, sizeAttenuation: false, map: dotTexture(true), transparent: true, depthWrite: false }));
    this.heads.frustumCulled = false;
    this.heads.renderOrder = 22;
    // cầu vồng: 7 dải cung tròn
    this.arc = new THREE.Group();
    ['#ff6b6b', '#ffa94d', '#ffe066', '#8ce99a', '#74c0fc', '#748ffc', '#b197fc'].forEach((col, i) => {
      const m = new THREE.Mesh(new THREE.TorusGeometry(15 - i * 0.55, 0.3, 4, 48, Math.PI), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0, depthWrite: false, fog: false }));
      m.renderOrder = 4;
      this.arc.add(m);
    });
    // (0.25.1) cầu vồng là vật thể THẬT đứng trên đảo: một chân ở Khu vui chơi, một chân ở rừng tây nam; cây và nhà phía trước che được nó
    this.arc.position.set(2, -0.4, 0);
    this.arc.rotation.y = Math.PI / 4; // mặt cung quay về phía máy quay
    this.arc.scale.setScalar(1.6);
    scene.add(this.rain, this.flakes, this.mist, this.trails, this.heads, this.arc);
    this.drops = Array.from({ length: N }, () => ({ x: (Math.random() - 0.5) * AREA, y: Math.random() * TOP, z: (Math.random() - 0.5) * AREA, s: 0.7 + Math.random() * 0.6, ph: Math.random() * 6 }));
    this.mode = 'none';
    this.t = 0;
    this.density = 1; // giảm khi đồ họa "Tiết kiệm pin"
    this.set('sunny', 1);
  }

  /** type: thời tiết hôm nay; season: chỉ số mùa */
  set(type, seasonIndex) {
    if (MODES[type]) this.mode = type;
    else if (type === 'frost') this.mode = 'snow';
    else if (seasonIndex === 0) this.mode = 'petals';
    else if (seasonIndex === 2) this.mode = 'leaves';
    else this.mode = 'none';
    const M = MODES[this.mode] || {};
    this.cfg = M;
    this.rain.visible = !!(M.lines || M.streaks);
    this.flakes.visible = !!M.dots;
    this.mist.visible = !!M.mist;
    this.trails.visible = this.heads.visible = !!M.meteors;
    this.arc.visible = !!M.arc;
    this.rain.material.color.set(M.streaks ? '#ffffff' : '#cfe8ff');
    this.rain.material.opacity = M.streaks ? 0.6 : 0.55;
    if (M.dots) {
      this.flakes.material.size = M.size;
      const col = this.flakes.geometry.attributes.color.array;
      const a = new THREE.Color(M.color), b = new THREE.Color(M.color2 || M.color), c = new THREE.Color();
      for (let i = 0; i < N; i++) { c.copy(a).lerp(b, (i * 0.618) % 1); col.set([c.r, c.g, c.b], i * 3); }
      this.flakes.geometry.attributes.color.needsUpdate = true;
    }
  }

  update(dt, center, hourFloat = 12) {
    this.t += dt;
    if (this.mode === 'none') return;
    const M = this.cfg;
    const night = hourFloat >= 19 || hourFloat < 5;
    // vệt mưa / vệt gió
    if (this.rain.visible) {
      const arr = this.rain.geometry.attributes.position.array;
      const count = Math.round((M.lines || M.streaks) * this.density);
      for (let i = 0; i < N; i++) {
        const d = this.drops[i];
        if (i >= count) { arr.fill(0, i * 6, i * 6 + 6); continue; }
        const X0 = center.x + d.x, Z0 = center.z + d.z;
        if (M.streaks) { // gió: vệt ngang bay nhanh
          d.x += M.wind * 1.8 * d.s * dt;
          if (d.x > AREA / 2) { d.x -= AREA; d.y = 0.3 + Math.random() * 5; d.z = (Math.random() - 0.5) * AREA; }
          const yy = Math.min(d.y, 5.5) + Math.sin(this.t * 2 + d.ph) * 0.15;
          arr.set([X0, yy, Z0, X0 - 2.2 * d.s, yy, Z0 - 0.2], i * 6);
        } else {
          d.y -= M.fall * d.s * dt;
          d.x += M.wind * dt;
          if (d.y < 0) { d.y = TOP; d.x = (Math.random() - 0.5) * AREA; d.z = (Math.random() - 0.5) * AREA; }
          if (d.x > AREA / 2) d.x -= AREA;
          arr.set([X0, d.y, Z0, X0 - M.wind * 0.04, d.y + M.len, Z0], i * 6);
        }
      }
      this.rain.geometry.attributes.position.needsUpdate = true;
    }
    // chấm: tuyết, cánh hoa, lá, mưa đá
    if (this.flakes.visible) {
      const arr = this.flakes.geometry.attributes.position.array;
      const count = Math.round(M.dots * this.density);
      const wind = M.wind || 0.8;
      for (let i = 0; i < N; i++) {
        const d = this.drops[(i + 450) % N];
        if (i >= count) { arr.fill(-50, i * 3, i * 3 + 3); continue; }
        d.y -= M.dotFall * d.s * dt;
        d.x += wind * dt * (M.swirl ? d.s : 1) + Math.sin(this.t * (M.swirl || 1.5) + d.ph) * (M.swirl ? 1.2 : 0.4) * dt;
        if (M.swirl) d.y += Math.cos(this.t * 2.2 + d.ph) * 0.9 * dt; // lá xoáy lên xuống theo gió
        if (d.y < 0) { d.y = M.swirl ? 0.5 + Math.random() * 5 : TOP; d.x = (Math.random() - 0.5) * AREA; d.z = (Math.random() - 0.5) * AREA; }
        if (d.x > AREA / 2) d.x -= AREA;
        arr.set([center.x + d.x, d.y, center.z + d.z], i * 3);
      }
      this.flakes.geometry.attributes.position.needsUpdate = true;
    }
    // sương mù: đám sương trôi chậm
    if (this.mist.visible) {
      const arr = this.mist.geometry.attributes.position.array;
      const count = Math.round(M.mist * Math.max(0.5, this.density));
      for (let i = 0; i < 64; i++) {
        const m = this.mistPts[i];
        if (i >= count) { arr.fill(-50, i * 3, i * 3 + 3); continue; }
        m.x += m.v * dt;
        if (m.x > AREA / 2) m.x -= AREA;
        arr.set([center.x + m.x, m.y, center.z + m.z], i * 3);
      }
      this.mist.geometry.attributes.position.needsUpdate = true;
      this.mist.material.opacity = night ? 0.14 : 0.3;
    }
    // sao băng: chỉ ban đêm
    if (this.trails.visible) {
      const arr = this.trails.geometry.attributes.position.array;
      const ha = this.heads.geometry.attributes.position.array;
      for (let i = 0; i < 8; i++) {
        const m = this.meteors[i];
        ha.fill(-50, i * 3, i * 3 + 3);
        if (!night || i >= M.meteors) { arr.fill(-50, i * 6, i * 6 + 6); continue; }
        m.t += dt;
        if (m.t > 0.9) { // bay xong ⇒ chờ một lúc rồi bay vệt mới
          m.t = -0.4 - Math.random() * 2.2;
          m.u = Math.random() * 0.7 - 0.3; m.v = Math.random() * 0.3;
        }
        if (m.t < 0) { arr.fill(-50, i * 6, i * 6 + 6); continue; }
        // (0.25.1) sao băng rơi thật trên trời đảo: bay chéo xuống rồi tắt trước khi chạm đất
        const k = m.t / 0.9;
        const sx = center.x + m.u * 60, sz = center.z + (m.v - 0.15) * 80;
        const A = new THREE.Vector3(sx - k * 14, 24 - k * 16, sz + k * 5);
        const tail = Math.min(1, m.t * 4) * 4.5;
        const B = new THREE.Vector3(A.x + tail * 0.64, A.y + tail * 0.73, A.z - tail * 0.23);
        arr.set([A.x, A.y, A.z, B.x, B.y, B.z], i * 6);
        ha.set([A.x, A.y, A.z], i * 3);
      }
      this.trails.geometry.attributes.position.needsUpdate = true;
      this.heads.geometry.attributes.position.needsUpdate = true;
    }
    // cầu vồng: cung thật đứng trên đảo (vị trí đặt trong constructor), chỉ hiện ban ngày
    if (this.arc.visible) {
      const day = hourFloat >= 6.5 && hourFloat <= 18;
      this.arc.children.forEach((m) => { m.material.opacity += ((day ? 0.5 : 0) - m.material.opacity) * Math.min(1, dt * 2); });
    }
  }
}
