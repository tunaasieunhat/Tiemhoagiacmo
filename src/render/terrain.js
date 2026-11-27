// ⛰️ Địa hình đặc biệt (0.29): vách đá + thác nước, cột đá giữa biển, vòm đá, cụm đá bazan. Số liệu: data/terrain.js
// Phần đứng yên được gộp (mergeStatic) cho nhẹ; phần chuyển động (dòng nước, bọt sóng) nằm trong nhóm riêng, chạy trong update(dt).
import * as THREE from 'three';
import { TERRAIN, TERRAIN_COLORS as C } from '../../data/terrain.js';
import { mat, basic } from '../models/materials.js';
import { rng } from '../models/environment.js';
import { bush } from '../models/environment.js';

const SEA_Y = -1.3;

/** Khối đá nhiều tầng hơi méo (lăng trụ có đỉnh rung ngẫu nhiên) */
function rockLayer(r1, r2, h, color, seg, rand, jitter = 0.18) {
  const g = new THREE.CylinderGeometry(r1, r2, h, seg, 1);
  const pos = g.attributes.position, seen = new Map();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i), key = `${Math.round(Math.atan2(z, x) * 100)}`;
    if (Math.hypot(x, z) < 1e-4) continue;
    if (!seen.has(key)) seen.set(key, 1 + (rand() - 0.5) * jitter * 2);
    const k = seen.get(key);
    pos.setX(i, x * k); pos.setZ(i, z * k);
    if (pos.getY(i) > 0) pos.setY(i, pos.getY(i) + (rand() - 0.5) * h * 0.15);
  }
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat(color));
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

function boulder(r, color, rand) {
  const g = new THREE.DodecahedronGeometry(r, 0);
  const m = new THREE.Mesh(g, mat(color));
  m.scale.set(1 + rand() * 0.3, 0.7 + rand() * 0.3, 1 + rand() * 0.3);
  m.rotation.set(rand(), rand() * 6, rand());
  m.castShadow = true;
  return m;
}

export class TerrainView {
  /** decorMap: vùng cấm đặt đồ (thêm vách đá / hồ) */
  constructor(scene, decorMap) {
    this.root = new THREE.Group();
    this.still = new THREE.Group();   // gộp được
    this.moving = new THREE.Group();  // nước chảy, bọt sóng
    this.root.add(this.still, this.moving);
    scene.add(this.root);
    this.streaks = []; this.foams = []; this.t = 0;
    for (const f of TERRAIN) {
      const rand = rng(f.id.split('').reduce((a, c) => a * 31 + c.charCodeAt(0), 7) >>> 0);
      if (f.kind === 'cliff') this.cliff(f, rand, decorMap);
      else if (f.kind === 'stack') this.stack(f, rand);
      else if (f.kind === 'arch') this.arch(f, rand);
      else if (f.kind === 'basalt') this.basalt(f, rand);
    }
  }

  /** Vách đá nhiều tầng, đỉnh phủ cỏ; có `face` thì có thác đổ xuống hồ */
  cliff(f, rand, decorMap) {
    const g = new THREE.Group(); g.position.set(f.x, 0, f.z);
    const layers = Math.max(2, Math.round(f.h / 0.85)), lh = f.h / layers;
    for (let i = 0; i < layers; i++) {
      const r = f.r * (1 - i * 0.12);
      const L = rockLayer(r * 0.94, r, lh * 1.04, C.rock[i % C.rock.length], 11, rand, f.face != null ? 0.08 : 0.18);
      L.position.y = lh * i + lh / 2; g.add(L);
    }
    const top = rockLayer(f.r * (1 - layers * 0.12) * 0.98, f.r * (1 - (layers - 1) * 0.12) * 0.96, 0.16, C.grass, 11, rand, 0.1);
    top.position.y = f.h + 0.02; g.add(top);
    const tr = f.r * (1 - layers * 0.12);
    for (let i = 0; i < 4; i++) { const a = rand() * 6.28, d = rand() * tr * 0.6; const b = bush('#8fd18b', ['#ffc4d6', '#fff0a8', null][i % 3], 0.5 + rand() * 0.3); b.position.set(Math.cos(a) * d, f.h + 0.08, Math.sin(a) * d); g.add(b); }
    for (let i = 0; i < 9; i++) { const a = rand() * 6.28; const b = boulder(0.25 + rand() * 0.45, C.rock[i % 3], rand); b.position.set(Math.cos(a) * (f.r + 0.2), 0.1, Math.sin(a) * (f.r + 0.2)); g.add(b); }
    this.still.add(g);
    decorMap?.circles.push({ x: f.x, z: f.z, r: f.r + 0.6, name: f.name ? `vách ${f.name}` : 'vách đá' });
    if (f.face == null) return;
    // ----- thác nước -----
    const a = THREE.MathUtils.degToRad(f.face), dx = Math.sin(a), dz = Math.cos(a);
    // lòng suối trên đỉnh
    const creek = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.05, tr * 1.1), mat(C.water));
    creek.position.set(dx * tr * 0.45, f.h + 0.13, dz * tr * 0.45); creek.rotation.y = a; g.add(creek);
    // màn nước: nghiêng theo vách (đỉnh lùi vào trong vì các tầng đá trên nhỏ hơn)
    const lean = Math.atan2(f.r * 1.06 - tr, f.h), len = Math.hypot(f.h, f.r * 1.06 - tr) + 0.1;
    const wf = new THREE.Group(); wf.position.set(f.x + dx * f.r * 1.06, 0, f.z + dz * f.r * 1.06); wf.rotation.y = a;
    const tilt = new THREE.Group(); tilt.rotation.x = -lean; wf.add(tilt);
    const sheet = new THREE.Mesh(new THREE.PlaneGeometry(1.1, len), basic('#cfeefe', { transparent: true, opacity: 0.85, side: THREE.DoubleSide }));
    sheet.position.set(0, len / 2, 0.06); tilt.add(sheet);
    const streakGeo = new THREE.BoxGeometry(0.06, 0.5, 0.02), sMat = basic('#ffffff', { transparent: true, opacity: 0.85 });
    for (let i = 0; i < 14; i++) {
      const s = new THREE.Mesh(streakGeo, sMat);
      s.position.set(-0.45 + (i % 7) * 0.15 + (rand() - 0.5) * 0.05, rand() * len, 0.08);
      s.userData = { top: len - 0.2, speed: 2.2 + rand() * 1.2 };
      tilt.add(s); this.streaks.push(s);
    }
    this.moving.add(wf);
    // hồ dưới chân thác + đá viền + bọt
    const pd = f.r + f.pool * 0.85, px = f.x + dx * pd, pz = f.z + dz * pd;
    const pool = new THREE.Mesh(new THREE.CylinderGeometry(f.pool, f.pool, 0.06, 20), mat(C.water));
    pool.position.set(px, 0.04, pz); pool.receiveShadow = true; this.still.add(pool);
    for (let i = 0; i < 14; i++) { const b2 = (i / 14) * Math.PI * 2; const bo = boulder(0.2 + rand() * 0.18, C.rock[i % 3], rand); bo.position.set(px + Math.cos(b2) * (f.pool + 0.05), 0.08, pz + Math.sin(b2) * (f.pool + 0.05)); this.still.add(bo); }
    for (let i = 0; i < 3; i++) { const lp = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.02, 10), mat('#7cc27f')); lp.position.set(px + (rand() - 0.2) * f.pool, 0.08, pz + (rand() - 0.5) * f.pool); this.still.add(lp); }
    const foamGeo = new THREE.SphereGeometry(0.16, 8, 6), fMat = basic(C.foam, { transparent: true, opacity: 0.9 });
    for (let i = 0; i < 7; i++) {
      const fm = new THREE.Mesh(foamGeo, fMat);
      fm.position.set(f.x + dx * (f.r + 0.4) + (rand() - 0.5) * 0.9 * dz, 0.12, f.z + dz * (f.r + 0.4) - (rand() - 0.5) * 0.9 * dx);
      fm.userData.phase = rand() * 6; this.moving.add(fm); this.foams.push(fm);
    }
    decorMap?.circles.push({ x: px, z: pz, r: f.pool + 0.3, name: 'hồ thác' });
  }

  /** Cột đá mọc giữa biển, đỉnh có cỏ + bụi, chân có bọt sóng */
  stack(f, rand) {
    const g = new THREE.Group(); g.position.set(f.x, SEA_Y - 0.4, f.z);
    const H = f.h + 1.3, layers = Math.max(3, Math.round(H / 0.9)), lh = H / layers;
    for (let i = 0; i < layers; i++) {
      const r = f.r * (1.08 - i * 0.07);
      const L = rockLayer(r * 0.92, r, lh * 1.05, C.rock[(i + 1) % 3], 8, rand, 0.22);
      L.position.y = lh * i + lh / 2; L.rotation.y = rand() * 6; g.add(L);
    }
    const tr = f.r * (1.08 - layers * 0.07);
    const top = rockLayer(tr * 0.95, tr, 0.18, C.grass, 8, rand, 0.12); top.position.y = H + 0.05; g.add(top);
    const b = bush('#7cc27f', rand() > 0.5 ? '#fff0a8' : null, 0.45 + tr * 0.2); b.position.y = H + 0.12; g.add(b);
    for (let i = 0; i < 4; i++) { const a = rand() * 6.28; const bo = boulder(0.25 + rand() * 0.3, C.rock[i % 3], rand); bo.position.set(Math.cos(a) * (f.r + 0.4), 0.3, Math.sin(a) * (f.r + 0.4)); g.add(bo); }
    this.still.add(g);
    this.addFoam(f.x, f.z, f.r * 1.15);
  }

  /** Vòm đá: 2 trụ + nhịp đá cong nối ngang */
  arch(f, rand) {
    const a = THREE.MathUtils.degToRad(f.face || 0), half = f.span / 2;
    const ax = Math.cos(a), az = -Math.sin(a);
    for (const s of [-1, 1]) this.stack({ ...f, x: f.x + ax * half * s, z: f.z + az * half * s, h: f.h - 0.4 * (s > 0 ? 1 : 0) }, rand);
    const bridge = new THREE.Mesh(new THREE.TorusGeometry(half, f.r * 0.55, 6, 14, Math.PI), mat(C.rock[0]));
    bridge.position.set(f.x, f.h - half * 0.55, f.z); bridge.rotation.y = a; bridge.castShadow = true;
    this.still.add(bridge);
    const cap = new THREE.Mesh(new THREE.TorusGeometry(half, f.r * 0.25, 4, 14, Math.PI), mat(C.grass));
    cap.position.set(f.x, f.h - half * 0.55 + f.r * 0.42, f.z); cap.rotation.y = a; this.still.add(cap);
  }

  /** Cụm cột đá lục giác (bazan) mọc từ mép nước */
  basalt(f, rand) {
    const g = new THREE.Group(); g.position.set(f.x, SEA_Y + 0.1, f.z);
    const n = 9 + Math.round(f.r * 3);
    for (let i = 0; i < n; i++) {
      const a = rand() * 6.28, d = Math.sqrt(rand()) * f.r, cr = 0.32 + rand() * 0.12;
      const h = (f.h + 1.2) * (1 - d / f.r * 0.6) * (0.6 + rand() * 0.4);
      const col = new THREE.Mesh(new THREE.CylinderGeometry(cr, cr, h, 6), mat(C.rockDark[i % 3]));
      col.position.set(Math.cos(a) * d, h / 2, Math.sin(a) * d); col.castShadow = true; g.add(col);
      if (rand() < 0.3) { const moss = new THREE.Mesh(new THREE.CylinderGeometry(cr * 1.01, cr * 1.01, 0.06, 6), mat('#8fbf7a')); moss.position.set(col.position.x, h + 0.02, col.position.z); g.add(moss); }
    }
    // vũng nước đọng (tide pool)
    const tp = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.04, 12), mat('#7fc9e0'));
    tp.position.set(f.r * 0.9, 0.35, 0); g.add(tp);
    this.still.add(g);
    this.addFoam(f.x, f.z, f.r * 1.1);
  }

  addFoam(x, z, r) {
    const fm = new THREE.Mesh(new THREE.TorusGeometry(r, 0.09, 4, 24), basic(C.foam, { transparent: true, opacity: 0.75 }));
    fm.rotation.x = Math.PI / 2; fm.position.set(x, SEA_Y + 0.04, z);
    fm.userData.wave = r; this.moving.add(fm); this.foams.push(fm);
  }

  update(dt) {
    this.t += dt;
    for (const s of this.streaks) { s.position.y -= s.userData.speed * dt; if (s.position.y < 0.2) s.position.y = s.userData.top; }
    for (const f of this.foams) {
      if (f.userData.wave) { const k = 1 + Math.sin(this.t * 1.6 + f.position.x) * 0.06; f.scale.set(k, k, 1); }
      else { const k = 0.7 + Math.abs(Math.sin(this.t * 3 + f.userData.phase)) * 0.6; f.scale.setScalar(k); }
    }
  }
}
