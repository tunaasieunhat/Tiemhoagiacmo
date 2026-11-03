// Mô hình cảnh vật: cây, bụi, đá, hàng rào, đèn, nhà, sạp hàng, ao...
import * as THREE from 'three';
import { rbox, sphere, cyl, cone, at, group, mesh, capsule } from './primitives.js';
import { mat, uniqueMat } from './materials.js';

// Vật liệu phát sáng ban đêm (dùng chung, đổi độ sáng theo giờ)
export const glow = {
  bulb: uniqueMat('#fff4c9', { emissive: new THREE.Color('#ffd27a'), emissiveIntensity: 0 }),
  window: uniqueMat('#bfe3f5', { emissive: new THREE.Color('#ffcf7a'), emissiveIntensity: 0 }),
};

export function rng(seed = 1) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

export function tree(kind = 'green', scale = 1) {
  const palettes = {
    green: ['#8fd18b', '#a6dd94', '#7cc27f'],
    blossom: ['#ffc4d6', '#ffb0c8', '#ffd6e2'],
    mint: ['#9fe0c4', '#b4e9cf', '#8cd3b6'],
  };
  const p = palettes[kind] || palettes.green;
  const g = new THREE.Group();
  g.add(at(cyl(0.16, 0.24, 1.2, '#a8795a', 8), 0, 0.6, 0));
  g.add(at(sphere(0.85, p[0], 12), 0, 1.75, 0));
  g.add(at(sphere(0.6, p[1], 12), 0.5, 1.45, 0.25));
  g.add(at(sphere(0.55, p[2], 12), -0.45, 1.5, -0.2));
  g.add(at(sphere(0.5, p[1], 12), 0.05, 2.3, 0.1));
  if (kind === 'blossom') {
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      g.add(at(sphere(0.07, '#fff', 6), Math.cos(a) * 0.8, 1.8 + Math.sin(i * 1.7) * 0.3, Math.sin(a) * 0.8));
    }
  }
  g.scale.setScalar(scale);
  return g;
}

export function bush(color = '#93d48d', flowerColor = null, scale = 1) {
  const g = new THREE.Group();
  g.add(at(sphere(0.42, color, 10), 0, 0.3, 0));
  g.add(at(sphere(0.32, color, 10), 0.38, 0.22, 0.1));
  g.add(at(sphere(0.3, color, 10), -0.35, 0.2, -0.05));
  if (flowerColor) {
    [[0.1, 0.65, 0.2], [-0.25, 0.48, 0.25], [0.45, 0.45, 0.15], [0.2, 0.55, -0.2], [-0.4, 0.4, -0.15]].forEach(([x, y, z]) => g.add(at(sphere(0.07, flowerColor, 6), x, y, z)));
  }
  g.scale.setScalar(scale);
  return g;
}

export function rock(scale = 1, color = '#c9c3bd') {
  const r = sphere(0.4, color, 7);
  r.scale.set(1.2 * scale, 0.65 * scale, 0.95 * scale);
  r.position.y = 0.12 * scale;
  return r;
}

export function grassTuft(color = '#7fc277') {
  const g = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const c = cone(0.05, 0.28, color, 4);
    c.position.set((i - 1) * 0.07, 0.14, (i % 2) * 0.05);
    c.rotation.z = (i - 1) * 0.3;
    c.castShadow = false;
    g.add(c);
  }
  return g;
}

/** Hàng rào gỗ từ điểm a đến b (trên mặt đất) */
export function fence(ax, az, bx, bz, color = '#f3dcc0') {
  const g = new THREE.Group();
  const dx = bx - ax, dz = bz - az;
  const len = Math.hypot(dx, dz);
  const n = Math.max(1, Math.round(len / 1.1));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const post = rbox(0.18, 0.75, 0.18, color, 0.06);
    post.position.set(ax + dx * t, 0.37, az + dz * t);
    g.add(post);
    const cap = sphere(0.1, color, 8);
    cap.position.set(ax + dx * t, 0.78, az + dz * t);
    g.add(cap);
  }
  const angle = Math.atan2(dx, dz);
  for (const y of [0.3, 0.56]) {
    const rail = rbox(0.08, 0.1, len, color, 0.04);
    rail.position.set(ax + dx / 2, y, az + dz / 2);
    rail.rotation.y = angle;
    g.add(rail);
  }
  return g;
}

export function lampPost() {
  const g = new THREE.Group();
  g.add(at(cyl(0.07, 0.09, 1.8, '#7c6a8f', 8), 0, 0.9, 0));
  g.add(at(cyl(0.18, 0.2, 0.12, '#7c6a8f', 8), 0, 0.06, 0));
  const bulb = mesh(new THREE.SphereGeometry(0.2, 12, 10), glow.bulb, { cast: false });
  bulb.position.y = 1.95;
  g.add(bulb);
  g.add(at(cone(0.26, 0.2, '#7c6a8f', 8), 0, 2.2, 0));
  return g;
}

function windowBox(w, h) {
  const g = new THREE.Group();
  g.add(rbox(w + 0.12, h + 0.12, 0.08, '#ffffff', 0.04));
  const pane = mesh(new THREE.BoxGeometry(w, h, 0.1), glow.window, { cast: false });
  g.add(pane);
  return g;
}

function awning(width, colors, depth = 0.9) {
  const g = new THREE.Group();
  const n = 7;
  const sw = width / n;
  for (let i = 0; i < n; i++) {
    const s = rbox(sw, 0.06, depth, colors[i % 2], 0.03);
    s.position.set(-width / 2 + sw * (i + 0.5), 0, depth / 2);
    g.add(s);
    const scallop = sphere(sw / 2, colors[i % 2], 8);
    scallop.scale.set(1, 0.55, 0.3);
    scallop.position.set(-width / 2 + sw * (i + 0.5), -0.05, depth);
    g.add(scallop);
  }
  g.rotation.x = 0.35;
  return g;
}

/** Cửa hàng hoa (mặt tiền hướng +Z) */
export function flowerShop() {
  const g = new THREE.Group();
  g.add(at(rbox(5.2, 0.25, 4.2, '#f2e2d2', 0.1), 0, 0.12, 0));
  g.add(at(rbox(4.6, 2.5, 3.4, '#fff3e6', 0.18), 0, 1.5, -0.1));
  // mái
  const roof = cone(3.6, 1.7, '#f6a6b9', 4);
  roof.rotation.y = Math.PI / 4;
  roof.scale.set(1.05, 1, 0.8);
  roof.position.set(0, 3.55, -0.1);
  g.add(roof);
  g.add(at(rbox(0.5, 0.9, 0.5, '#e98aa1', 0.08), 1.3, 3.8, -0.6));
  // cửa
  g.add(at(rbox(1.0, 1.6, 0.12, '#c98f6b', 0.1), 0, 1.05, 1.62));
  g.add(at(sphere(0.06, '#ffd56b', 8), 0.32, 1.05, 1.72));
  // cửa sổ
  g.add(at(windowBox(0.9, 0.75), -1.5, 1.6, 1.62));
  g.add(at(windowBox(0.9, 0.75), 1.5, 1.6, 1.62));
  // mái hiên sọc
  g.add(at(awning(4.4, ['#f78fa7', '#fffaf3']), 0, 2.55, 1.6));
  // biển hiệu
  const sign = new THREE.Group();
  sign.add(rbox(2.4, 0.62, 0.14, '#fffaf3', 0.14));
  sign.add(at(rbox(1.5, 0.12, 0.05, '#f47a93', 0.05), 0, 0, 0.08));
  sign.add(at(sphere(0.13, '#f47a93', 8), -0.95, 0, 0.08));
  sign.add(at(sphere(0.13, '#ffd34e', 8), 0.95, 0, 0.08));
  sign.position.set(0, 3.25, 2.25);
  sign.rotation.x = -0.12;
  g.add(sign);
  // chậu hoa trước cửa
  for (const x of [-1.9, -1.1, 1.1, 1.9]) {
    const pot = new THREE.Group();
    pot.add(at(cyl(0.22, 0.16, 0.32, '#e0a383', 10), 0, 0.16, 0));
    pot.add(at(sphere(0.24, '#8fd18b', 10), 0, 0.42, 0));
    ['#f47a93', '#ffd34e', '#c79cf2'].forEach((c, i) => pot.add(at(sphere(0.07, c, 6), Math.cos(i * 2.1) * 0.15, 0.55, Math.sin(i * 2.1) * 0.15)));
    pot.position.set(x, 0.25, 2.0);
    g.add(pot);
  }
  return g;
}

/** Sạp chợ có mái che sọc */
export function marketStall(colorA = '#9fd6f0', colorB = '#fffaf3', goods = ['#f4b25a', '#e9dcc5', '#a6dd94']) {
  const g = new THREE.Group();
  g.add(at(rbox(2.2, 0.8, 1.1, '#d9a67e', 0.08), 0, 0.4, 0));
  for (const x of [-1, 1]) {
    g.add(at(cyl(0.06, 0.06, 2.0, '#b98563', 6), x, 1.0, -0.45));
    g.add(at(cyl(0.06, 0.06, 1.7, '#b98563', 6), x, 0.85, 0.5));
  }
  const top = awning(2.4, [colorA, colorB], 1.5);
  top.position.set(0, 2.0, -0.6);
  top.rotation.x = 0.28;
  g.add(top);
  goods.forEach((c, i) => {
    const sack = sphere(0.22, c, 10);
    sack.scale.set(1, 0.9, 1);
    sack.position.set(-0.6 + i * 0.6, 0.95, 0.05);
    g.add(sack);
  });
  return g;
}

/** Tiệm dụng cụ nhỏ */
export function toolShed() {
  const g = new THREE.Group();
  g.add(at(rbox(3.2, 2.0, 2.6, '#e8f2df', 0.15), 0, 1.0, 0));
  const roof = cone(2.6, 1.3, '#8cc9a0', 4);
  roof.rotation.y = Math.PI / 4;
  roof.scale.set(1.0, 1, 0.85);
  roof.position.set(0, 2.6, 0);
  g.add(roof);
  g.add(at(rbox(0.9, 1.4, 0.1, '#a87458', 0.08), 0, 0.75, 1.32));
  g.add(at(windowBox(0.6, 0.55), -1.0, 1.25, 1.32));
  // xẻng & bình tưới trang trí
  const shovel = new THREE.Group();
  shovel.add(at(cyl(0.04, 0.04, 1.1, '#b98563', 6), 0, 0.55, 0));
  shovel.add(at(rbox(0.28, 0.32, 0.05, '#aeb7c2', 0.05), 0, 0.05, 0));
  shovel.position.set(1.25, 0.1, 1.45);
  shovel.rotation.z = -0.2;
  g.add(shovel);
  return g;
}

export function crate(color = '#d9a67e') {
  const g = new THREE.Group();
  g.add(at(rbox(0.6, 0.5, 0.6, color, 0.06), 0, 0.25, 0));
  return g;
}

export function pond(radius = 2.2) {
  const g = new THREE.Group();
  const water = mesh(new THREE.CylinderGeometry(radius, radius, 0.1, 28), uniqueMat('#9fdcf0', { transparent: true, opacity: 0.92 }), { cast: false, receive: true });
  water.position.y = 0.03;
  water.scale.z = 0.75;
  g.add(water);
  const r = rng(7);
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const s = rock(0.45 + r() * 0.25, i % 3 ? '#d8d2cb' : '#c4bdb5');
    s.position.x = Math.cos(a) * (radius + 0.1);
    s.position.z = Math.sin(a) * (radius + 0.1) * 0.75;
    g.add(s);
  }
  for (const [x, z] of [[-0.6, 0.3], [0.7, -0.4], [0.2, 0.6]]) {
    const pad = cyl(0.3, 0.3, 0.03, '#8fd18b', 12);
    pad.position.set(x, 0.1, z);
    g.add(pad);
  }
  g.add(at(sphere(0.09, '#ffc4d6', 8), -0.6, 0.18, 0.3));
  return g;
}

export function scarecrow() {
  const g = new THREE.Group();
  g.add(at(cyl(0.05, 0.05, 1.5, '#b98563', 6), 0, 0.75, 0));
  const arm = cyl(0.04, 0.04, 1.2, '#b98563', 6);
  arm.rotation.z = Math.PI / 2;
  arm.position.y = 1.1;
  g.add(arm);
  g.add(at(capsule(0.22, 0.25, '#f2b880'), 0, 1.1, 0));
  g.add(at(sphere(0.3, '#f6e3b4', 12), 0, 1.65, 0));
  g.add(at(cyl(0.45, 0.45, 0.04, '#f6d67a', 16), 0, 1.85, 0));
  g.add(at(cyl(0.2, 0.25, 0.25, '#f6d67a', 12), 0, 1.98, 0));
  g.add(at(sphere(0.035, '#3b2a22', 6), -0.1, 1.68, 0.27));
  g.add(at(sphere(0.035, '#3b2a22', 6), 0.1, 1.68, 0.27));
  g.add(at(sphere(0.05, '#ff9c8a', 6), 0, 1.58, 0.29));
  return g;
}

export function signPost(color = '#f3dcc0') {
  const g = new THREE.Group();
  g.add(at(cyl(0.05, 0.05, 1.0, '#b98563', 6), 0, 0.5, 0));
  g.add(at(rbox(0.9, 0.5, 0.08, color, 0.08), 0, 1.0, 0));
  return g;
}

export { group };

/** Nhà lai tạo: nhà gỗ nhỏ có mái vòm kính và bình thí nghiệm */
export function labHouse() {
  const g = new THREE.Group();
  g.add(at(rbox(3.0, 0.2, 2.6, '#e9dccd', 0.08), 0, 0.1, 0));
  g.add(at(rbox(2.6, 1.6, 2.2, '#fff6ea', 0.14), 0, 1.0, 0));
  const dome = mesh(new THREE.SphereGeometry(1.3, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), uniqueMat('#cfeefe', { transparent: true, opacity: 0.45 }), { cast: false });
  dome.position.y = 1.8;
  dome.scale.set(1, 0.75, 0.85);
  g.add(dome);
  g.add(at(cyl(1.32, 1.32, 0.12, '#8cc9a0', 20), 0, 1.82, 0));
  // cây con trong vòm kính
  [['#f47a93', -0.4], ['#ffd34e', 0.1], ['#9cc7f2', 0.5]].forEach(([c, x]) => {
    g.add(at(cyl(0.03, 0.03, 0.4, '#5fae63', 6), x, 2.05, 0));
    g.add(at(sphere(0.12, c, 8), x, 2.3, 0));
  });
  g.add(at(rbox(0.8, 1.2, 0.1, '#a87458', 0.08), 0, 0.75, 1.12));
  g.add(at(sphere(0.05, '#ffd56b', 8), 0.25, 0.75, 1.2));
  // bình thí nghiệm
  const flask = new THREE.Group();
  flask.add(at(sphere(0.22, uniqueMat('#d9b8ff', { transparent: true, opacity: 0.8 }), 10), 0, 0.22, 0));
  flask.add(at(cyl(0.07, 0.07, 0.25, uniqueMat('#e8f4ff', { transparent: true, opacity: 0.7 }), 8), 0, 0.5, 0));
  flask.position.set(1.0, 0.2, 1.4);
  g.add(flask);
  g.add(at(windowBox(0.6, 0.5), -0.85, 1.1, 1.12));
  return g;
}
