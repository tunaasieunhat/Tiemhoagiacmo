// Mô hình nhà & đồ vật trong Làng Hoa (GĐ11) — khối hình đơn giản, màu pastel.
// Cửa nhìn về hướng +z của nhà (khi đặt sẽ xoay cho cửa hướng về quảng trường).
import * as THREE from 'three';
import { rbox, sphere, cyl, cone, at, torus, mesh, textSprite } from './primitives.js';
import { mat, uniqueMat } from './materials.js';
import { tree, bush } from './environment.js';

const W = 3.0, D = 2.6, H = 1.9; // kích thước thân nhà

/** Mái tam giác (lăng trụ) dọc trục x */
function gableRoof(width, depth, height, color) {
  const s = new THREE.Shape();
  s.moveTo(-depth / 2, 0); s.lineTo(depth / 2, 0); s.lineTo(0, height); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: width, bevelEnabled: false });
  g.translate(0, 0, -width / 2);
  g.rotateY(Math.PI / 2);
  return mesh(g, mat(color));
}

function windowPane(winMat, w = 0.55, h = 0.5, trim = '#ffffff') {
  const g = new THREE.Group();
  g.add(rbox(w + 0.12, h + 0.12, 0.08, trim, 0.03));
  g.add(at(mesh(new THREE.BoxGeometry(w, h, 0.1), winMat, { cast: false }), 0, 0, 0.01));
  g.add(at(rbox(0.04, h, 0.11, trim, 0.01), 0, 0, 0.02));
  return g;
}

function flowerBox(color) {
  const g = new THREE.Group();
  g.add(rbox(0.7, 0.16, 0.2, '#c9926a', 0.04));
  for (let i = 0; i < 4; i++) g.add(at(sphere(0.07, i % 2 ? color : '#ffffff', 6), -0.24 + i * 0.16, 0.12, 0));
  return g;
}

/**
 * Dựng 1 ngôi nhà theo style (xem data/village.js). Trả về { group, windowMat }.
 * windowMat: vật liệu cửa sổ riêng của nhà (bật sáng khi chủ nhà ở nhà buổi tối).
 */
export function buildHouse(style = {}) {
  const g = new THREE.Group();
  const windowMat = uniqueMat('#bfe3f5', { emissive: new THREE.Color('#ffcf7a'), emissiveIntensity: 0 });
  const wall = style.wall || '#fff1dd', roof = style.roof || '#f6a6b9', trim = style.trim || '#c9926a';
  const big = style.cafe || style.school;
  const w = big ? W + 0.6 : W, d = big ? D + 0.2 : D;

  g.add(at(rbox(w + 0.3, 0.22, d + 0.3, '#d8cfc4', 0.05, { receive: true }), 0, 0.11, 0));
  g.add(at(rbox(w, H, d, wall, 0.08), 0, 0.22 + H / 2, 0));
  // mái
  const r = gableRoof(w + 0.5, d + 0.6, 1.15, roof);
  r.position.y = 0.22 + H;
  g.add(r);
  g.add(at(rbox(w + 0.55, 0.1, 0.16, trim, 0.03), 0, 0.22 + H + 0.02, d / 2 + 0.28));
  // cửa
  g.add(at(rbox(0.62, 1.05, 0.08, trim, 0.06), 0, 0.22 + 0.53, d / 2 + 0.02));
  g.add(at(sphere(0.04, '#ffd34e', 6), 0.2, 0.22 + 0.55, d / 2 + 0.08));
  g.add(at(rbox(0.9, 0.06, 0.45, '#d8cfc4', 0.02), 0, 0.25, d / 2 + 0.3)); // bậc thềm
  // cửa sổ trước & hai bên
  for (const x of [-0.95, 0.95]) {
    const wp = windowPane(windowMat); wp.position.set(x * (w / W), 0.22 + 1.15, d / 2 + 0.03); g.add(wp);
    if (style.flowers || style.vines) { const fb = flowerBox(style.flowers || style.vines); fb.position.set(x * (w / W), 0.22 + 0.8, d / 2 + 0.12); g.add(fb); }
  }
  for (const sx of [-1, 1]) { const wp = windowPane(windowMat, 0.5, 0.45); wp.position.set(sx * (w / 2 + 0.03), 0.22 + 1.15, 0); wp.rotation.y = sx * Math.PI / 2; g.add(wp); }
  // ống khói
  if (!style.school) {
    g.add(at(rbox(0.32, 0.8, 0.32, '#c9b8a8', 0.04), w * 0.28, 0.22 + H + 0.75, -d * 0.18));
  }

  if (style.porch) {
    g.add(at(rbox(w, 0.1, 1.0, '#e2b98f', 0.03, { receive: true }), 0, 0.28, d / 2 + 0.6));
    for (const x of [-w / 2 + 0.1, w / 2 - 0.1]) g.add(at(cyl(0.05, 0.05, 1.3, trim, 6), x, 0.95, d / 2 + 1.0));
    const pr = rbox(w + 0.2, 0.08, 1.2, roof, 0.03); pr.position.set(0, 1.62, d / 2 + 0.6); pr.rotation.x = 0.22; g.add(pr);
    // ghế bập bênh
    const ch = new THREE.Group(); ch.position.set(0.9, 0.33, d / 2 + 0.6);
    ch.add(at(rbox(0.45, 0.06, 0.4, '#a87458', 0.02), 0, 0.3, 0));
    ch.add(at(rbox(0.45, 0.5, 0.06, '#a87458', 0.02), 0, 0.55, -0.18));
    for (const x of [-0.2, 0.2]) { const t = torus(0.3, 0.025, '#7a5238'); t.scale.set(0.2, 1, 1); t.rotation.y = Math.PI / 2; t.position.set(x, 0.12, 0); g.add(t); }
    g.add(ch);
    g.add(at(sphere(0.1, '#f78fa7', 8), 0.5, 0.42, d / 2 + 0.75)); // cuộn len
  }
  if (style.vines) {
    // giàn hoa giấy vòm trên cửa
    for (let i = 0; i <= 10; i++) { const t = (i / 10) * Math.PI; g.add(at(sphere(0.13, i % 3 ? style.vines : '#8fd18b', 7), Math.cos(t) * 0.55, 0.22 + 1.05 + Math.sin(t) * 0.45, d / 2 + 0.12)); }
    for (let i = 0; i < 9; i++) g.add(at(sphere(0.12, i % 2 ? style.vines : '#8fd18b', 7), -w / 2 - 0.05, 0.4 + i * 0.22, d / 2 - 0.1 - (i % 3) * 0.3));
  }
  if (style.books) {
    const tb = new THREE.Group(); tb.position.set(-1.0, 0.22, d / 2 + 0.85);
    tb.add(at(cyl(0.35, 0.35, 0.05, '#e2b98f', 12), 0, 0.6, 0));
    tb.add(at(cyl(0.05, 0.06, 0.6, '#a87458', 6), 0, 0.3, 0));
    ['#e8384f', '#6fb7e0', '#ffd34e'].forEach((c, i) => tb.add(at(rbox(0.28, 0.06, 0.2, c, 0.01), 0, 0.66 + i * 0.065, 0)));
    g.add(tb);
    // xe đạp
    const bike = new THREE.Group(); bike.position.set(1.15, 0.22, d / 2 + 0.7); bike.rotation.y = 0.3;
    for (const x of [-0.32, 0.32]) { const wh = torus(0.22, 0.03, '#3d3550'); wh.position.set(x, 0.22, 0); bike.add(wh); }
    bike.add(at(rbox(0.6, 0.05, 0.04, '#6fb7e0', 0.02), 0, 0.38, 0));
    bike.add(at(rbox(0.05, 0.3, 0.04, '#6fb7e0', 0.02), -0.18, 0.45, 0));
    bike.add(at(rbox(0.18, 0.05, 0.1, '#3d3550', 0.02), -0.18, 0.6, 0));
    g.add(bike);
  }
  if (style.workshop) {
    // lán gỗ bên hông
    const sh = new THREE.Group(); sh.position.set(w / 2 + 1.0, 0, 0.2);
    for (const [x, z] of [[-0.8, -0.9], [0.8, -0.9], [-0.8, 0.9], [0.8, 0.9]]) sh.add(at(cyl(0.06, 0.07, 1.6, '#7a5238', 6), x, 0.8, z));
    const sr = rbox(2.0, 0.08, 2.2, '#a8724f', 0.03); sr.position.y = 1.65; sr.rotation.z = -0.18; sh.add(sr);
    for (let i = 0; i < 5; i++) { const lg = cyl(0.16, 0.16, 1.2, '#c9926a', 10); lg.rotation.x = Math.PI / 2; lg.position.set(-0.5 + (i % 3) * 0.34, 0.16 + Math.floor(i / 3) * 0.3, -0.4); sh.add(lg); }
    sh.add(at(rbox(1.0, 0.08, 0.4, '#e2b98f', 0.02), 0.3, 0.6, 0.5)); // bàn mộc
    for (const x of [-0.1, 0.7]) sh.add(at(rbox(0.08, 0.56, 0.3, '#a87458', 0.02), x, 0.3, 0.5));
    g.add(sh);
  }
  if (style.swing) {
    const t = tree('green', 1.05); t.position.set(w / 2 + 1.6, 0, 1.6); g.add(t);
    for (const x of [-0.12, 0.12]) g.add(at(cyl(0.012, 0.012, 1.1, '#e6e0d8', 4), w / 2 + 1.6 + x, 1.25, 2.35));
    const tire = torus(0.24, 0.08, '#3d3550'); tire.position.set(w / 2 + 1.6, 0.62, 2.35); g.add(tire);
  }
  if (style.cafe) {
    // mái hiên sọc
    for (let i = 0; i < 7; i++) { const st = rbox((w + 0.4) / 7, 0.06, 1.1, i % 2 ? '#ffffff' : style.roof, 0.02); st.position.set(-w / 2 - 0.2 + (i + 0.5) * ((w + 0.4) / 7), 1.75, d / 2 + 0.5); st.rotation.x = 0.35; g.add(st); }
    // quầy
    g.add(at(rbox(1.4, 0.8, 0.45, '#e2b98f', 0.05), 0.6, 0.62, d / 2 + 0.55));
    g.add(at(cyl(0.09, 0.07, 0.14, '#ffffff', 10), 0.3, 1.09, d / 2 + 0.55));
    g.add(at(cyl(0.09, 0.07, 0.14, '#ffffff', 10), 0.75, 1.09, d / 2 + 0.55));
    const sign = textSprite('Cà phê Mây', { scale: 0.55, bg: '#e8f6ff', border: '#9fd6f0', fg: '#4f7f99' });
    sign.position.set(0, 2.55, d / 2 + 0.4); g.add(sign);
  }
  if (style.school) {
    // tháp chuông
    g.add(at(rbox(0.9, 0.9, 0.9, style.wall, 0.05), 0, 0.22 + H + 1.3, 0));
    g.add(at(cone(0.75, 0.7, style.roof, 4), 0, 0.22 + H + 2.1, 0)); g.children[g.children.length - 1].rotation.y = Math.PI / 4;
    g.add(at(sphere(0.18, '#ffd34e', 10), 0, 0.22 + H + 1.25, 0.46));
    // cột cờ
    g.add(at(cyl(0.035, 0.035, 3.0, '#d8d2cb', 6), -w / 2 - 0.5, 1.5, d / 2 + 0.6));
    g.add(at(rbox(0.7, 0.45, 0.03, '#e8384f', 0.01), -w / 2 - 0.15, 2.75, d / 2 + 0.6));
    const star = new THREE.Shape();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5; const rr = i % 2 ? 0.05 : 0.12; const p = [Math.cos(a) * rr, -Math.sin(a) * rr]; if (i) star.lineTo(...p); else star.moveTo(...p); }
    const stm = mesh(new THREE.ShapeGeometry(star), mat('#ffd34e'), { cast: false }); stm.position.set(-w / 2 - 0.15, 2.75, d / 2 + 0.62); g.add(stm);
    const sign = textSprite('Trường làng', { scale: 0.5 }); sign.position.set(0, 3.9, 0.6); g.add(sign);
  }
  return { group: g, windowMat };
}

/** Giếng nước giữa quảng trường */
export function well() {
  const g = new THREE.Group();
  g.add(at(cyl(0.75, 0.8, 0.7, '#c9c3bd', 14), 0, 0.35, 0));
  g.add(at(cyl(0.6, 0.6, 0.05, '#6fb7e0', 14), 0, 0.62, 0));
  for (const x of [-0.7, 0.7]) g.add(at(cyl(0.06, 0.06, 1.5, '#a87458', 6), x, 1.0, 0));
  const roof = gableRoof(1.8, 1.5, 0.55, '#f47a93'); roof.position.y = 1.72; g.add(roof);
  const axle = cyl(0.04, 0.04, 1.4, '#7a5238', 6); axle.rotation.z = Math.PI / 2; axle.position.y = 1.4; g.add(axle);
  g.add(at(cyl(0.12, 0.1, 0.18, '#c9926a', 8), 0, 1.05, 0));
  return g;
}

/** Bàn cà phê có dù */
export function cafeTable(color = '#9fd6f0') {
  const g = new THREE.Group();
  g.add(at(cyl(0.35, 0.35, 0.05, '#ffffff', 12), 0, 0.62, 0));
  g.add(at(cyl(0.04, 0.05, 0.62, '#c9926a', 6), 0, 0.31, 0));
  g.add(at(cyl(0.03, 0.03, 1.4, '#ffffff', 6), 0, 1.25, 0));
  const um = cone(0.85, 0.35, color, 8); um.position.y = 2.0; g.add(um);
  for (const a of [0.6, 3.7]) { const c = cyl(0.16, 0.16, 0.4, '#e2b98f', 8); c.position.set(Math.cos(a) * 0.6, 0.2, Math.sin(a) * 0.6); g.add(c); }
  return g;
}

/** Cầu tàu gỗ (dài theo trục z, từ z=0 tới z=len) */
export function pier(len = 5.2) {
  const g = new THREE.Group();
  const n = Math.round(len / 0.42);
  for (let i = 0; i < n; i++) g.add(at(rbox(1.4, 0.08, 0.36, i % 2 ? '#c9926a' : '#d9a67e', 0.02, { receive: true }), 0, 0.05, i * 0.42));
  for (let i = 1; i < n; i += 3) for (const x of [-0.62, 0.62]) g.add(at(cyl(0.07, 0.07, 1.6, '#7a5238', 6), x, -0.7, i * 0.42));
  return g;
}

/** Bồn hoa tròn */
export function flowerBed(r = 0.7, colors = ['#f6a6b9', '#ffd34e', '#ffffff']) {
  const g = new THREE.Group();
  g.add(at(cyl(r, r + 0.05, 0.25, '#d8cfc4', 14), 0, 0.12, 0));
  g.add(at(cyl(r - 0.08, r - 0.08, 0.06, '#9a6b4f', 14), 0, 0.26, 0));
  const b = bush('#8fd18b', colors[0], r * 1.1); b.position.y = 0.2; g.add(b);
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; g.add(at(sphere(0.08, colors[i % colors.length], 6), Math.cos(a) * (r - 0.2), 0.35, Math.sin(a) * (r - 0.2))); }
  return g;
}
