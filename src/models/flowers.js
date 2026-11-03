// Mô hình 3D chibi cho các loài hoa theo từng giai đoạn lớn.
import * as THREE from 'three';
import { FLOWERS } from '../../data/flowers.js';
import { sphere, cyl, cone, at, group } from './primitives.js';

const DRY = '#b39a74';
const DEAD_STEM = '#9b7f5c';
const SMILE_GEO = new THREE.TorusGeometry(0.035, 0.01, 6, 12, Math.PI);
const SMILE_MAT = new THREE.MeshBasicMaterial({ color: '#3b2a22' });

export function mixColor(a, b, t) {
  return '#' + new THREE.Color(a).lerp(new THREE.Color(b), t).getHexString();
}

function leaf(color, len, angleY, tilt, y) {
  const holder = new THREE.Group();
  const l = sphere(0.1, color, 10);
  l.scale.set(0.55, 0.18, len / 0.1 / 2);
  l.position.z = len * 0.45;
  holder.add(l);
  holder.rotation.order = 'YXZ';
  holder.rotation.y = angleY;
  holder.rotation.x = -tilt;
  holder.position.y = y;
  return holder;
}

function stem(h, color, r = 0.04) {
  return at(cyl(r * 0.85, r, h, color, 8), 0, h / 2, 0);
}

/**
 * Tạo cây hoa.
 * @param {string} flowerId
 * @param {number} stage 0 hạt, 1 mầm, 2 nụ, 3 nở
 * @param {{wilted?: boolean, dead?: boolean}} cond
 */
export function buildPlant(flowerId, stage, { wilted = false, dead = false } = {}) {
  const def = FLOWERS[flowerId];
  const base = def.colors;
  const t = dead ? 0.85 : wilted ? 0.45 : 0;
  const C = {
    petal: mixColor(base.petal, DRY, t),
    petalDark: mixColor(base.petalDark, DRY, t),
    stem: mixColor(base.stem, dead ? DEAD_STEM : DRY, t),
    leaf: mixColor(base.leaf, dead ? DEAD_STEM : DRY, t),
    center: base.center ? mixColor(base.center, DRY, t * 0.5) : null,
  };

  const root = new THREE.Group();
  const sway = new THREE.Group(); // phần đung đưa theo gió
  root.add(sway);
  root.userData.sway = sway;

  if (stage === 0 && !dead) {
    const mound = sphere(0.22, '#7c5640', 12);
    mound.scale.set(1, 0.32, 1);
    mound.position.y = 0.02;
    sway.add(mound);
    [[-0.07, 0.05], [0.06, -0.04], [0.02, 0.08]].forEach(([x, z]) => sway.add(at(sphere(0.035, '#f3e1b5', 6), x, 0.08, z)));
    return root;
  }

  if (stage === 1 && !dead) {
    sway.add(stem(0.22, C.stem, 0.03));
    sway.add(leaf(C.leaf, 0.22, Math.PI / 4, 0.5, 0.2));
    sway.add(leaf(C.leaf, 0.22, Math.PI / 4 + Math.PI, 0.5, 0.2));
    return root;
  }

  // từ giai đoạn 2 trở đi: thân + lá + nụ/hoa
  const h = { rose: 0.75, tulip: 0.7, sunflower: 1.15, daisy: 0.6, lavender: 0.55, hydrangea: 0.5 }[def.model] ?? 0.8;
  const H = stage === 2 ? h * 0.8 : h;
  const r = def.model === 'sunflower' ? 0.055 : 0.04;
  sway.add(stem(H, C.stem, r));
  const leafLen = def.model === 'sunflower' ? 0.42 : def.model === 'tulip' ? 0.38 : def.model === 'hydrangea' ? 0.36 : 0.26;
  if (def.model === 'hydrangea') {
    for (let i = 0; i < 4; i++) sway.add(leaf(C.leaf, leafLen, i * 1.57 + 0.4, 0.55, H * 0.45));
  } else if (def.model === 'lavender') {
    sway.add(leaf(C.leaf, 0.3, 0.5, 1.1, 0.04));
    sway.add(leaf(C.leaf, 0.3, 2.6, 1.1, 0.04));
    sway.add(leaf(C.leaf, 0.28, 4.4, 1.1, 0.04));
  } else if (def.model === 'tulip') {
    sway.add(leaf(C.leaf, leafLen, 0.6, 1.0, 0.05));
    sway.add(leaf(C.leaf, leafLen, 0.6 + Math.PI, 1.05, 0.05));
  } else {
    sway.add(leaf(C.leaf, leafLen, 0.3, 0.35, H * 0.35));
    sway.add(leaf(C.leaf, leafLen * 0.9, 0.3 + Math.PI, 0.4, H * 0.55));
    if (def.model === 'rose') sway.add(leaf(C.leaf, leafLen * 0.8, 1.8, 0.4, H * 0.7));
  }

  const head = new THREE.Group();
  head.position.y = H;
  sway.add(head);
  root.userData.head = head;

  if (stage === 2 && !dead) {
    const bud = sphere(0.12, C.petalDark, 12);
    bud.scale.set(0.85, 1.25, 0.85);
    bud.position.y = 0.1;
    head.add(bud);
    const sepal = cone(0.1, 0.1, C.leaf, 6);
    sepal.rotation.x = Math.PI;
    sepal.position.y = 0.02;
    head.add(sepal);
  } else if (def.model === 'rose') {
    buildRose(head, C);
  } else if (def.model === 'tulip') {
    buildTulip(head, C);
  } else if (def.model === 'sunflower') {
    buildSunflower(head, C, dead);
  } else if (def.model === 'daisy') {
    buildDaisy(head, sway, C, H);
  } else if (def.model === 'lavender') {
    buildLavender(head, sway, C, H);
  } else if (def.model === 'hydrangea') {
    buildHydrangea(head, C);
  }

  if (dead) {
    sway.rotation.z = 0.75;
    head.rotation.z = 1.0;
  } else if (wilted) {
    sway.rotation.z = 0.35;
    head.rotation.z = 0.7;
  }
  return root;
}

function buildRose(head, C) {
  head.add(at(sphere(0.11, C.petalDark, 12), 0, 0.15, 0));
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const p = sphere(0.12, C.petal, 10);
    p.scale.set(1, 0.85, 0.55);
    p.position.set(Math.cos(a) * 0.12, 0.13, Math.sin(a) * 0.12);
    p.rotation.y = -a + Math.PI / 2;
    p.rotation.x = -0.25;
    head.add(p);
  }
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.4;
    const p = sphere(0.13, C.petalDark, 10);
    p.scale.set(1, 0.65, 0.5);
    p.position.set(Math.cos(a) * 0.19, 0.07, Math.sin(a) * 0.19);
    p.rotation.y = -a + Math.PI / 2;
    p.rotation.x = -0.6;
    head.add(p);
  }
  const sepal = cone(0.12, 0.08, C.leaf, 6);
  sepal.rotation.x = Math.PI;
  head.add(sepal);
}

function buildTulip(head, C) {
  for (let i = 0; i < 5; i++) {
    const holder = new THREE.Group();
    holder.rotation.y = (i / 5) * Math.PI * 2;
    const p = sphere(0.13, i % 2 ? C.petal : C.petalDark, 10);
    p.scale.set(0.75, 1.35, 0.45);
    p.position.set(0, 0.16, 0.08);
    p.rotation.x = 0.18;
    holder.add(p);
    head.add(holder);
  }
  head.add(at(sphere(0.06, '#ffe7a3', 8), 0, 0.2, 0));
}

function buildSunflower(head, C, dead) {
  const face = new THREE.Group();
  face.position.y = 0.12;
  // quay mặt hoa về phía camera
  face.lookAt(new THREE.Vector3(1, 0.55, 1).multiplyScalar(10));
  head.add(face);
  const disc = cyl(0.21, 0.21, 0.08, C.center, 18);
  disc.rotation.x = Math.PI / 2;
  face.add(disc);
  for (let ring = 0; ring < 2; ring++) {
    const n = 12;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + ring * (Math.PI / n);
      const p = sphere(0.1, ring ? C.petalDark : C.petal, 8);
      p.scale.set(0.6, 1.45, 0.28);
      const rr = ring ? 0.3 : 0.3;
      p.position.set(Math.cos(a) * rr, Math.sin(a) * rr, ring ? -0.03 : 0);
      p.rotation.z = a - Math.PI / 2;
      face.add(p);
    }
  }
  if (!dead) {
    // khuôn mặt chibi dễ thương
    const eyeM = '#3b2a22';
    face.add(at(sphere(0.026, eyeM, 8), -0.07, 0.03, 0.045));
    face.add(at(sphere(0.026, eyeM, 8), 0.07, 0.03, 0.045));
    const cheekL = at(sphere(0.03, '#ff9c8a', 8), -0.12, -0.04, 0.04);
    const cheekR = at(sphere(0.03, '#ff9c8a', 8), 0.12, -0.04, 0.04);
    cheekL.scale.z = cheekR.scale.z = 0.3;
    face.add(cheekL, cheekR);
    const smile = new THREE.Mesh(SMILE_GEO, SMILE_MAT);
    smile.rotation.z = Math.PI;
    smile.position.set(0, -0.025, 0.045);
    face.add(smile);
  }
}

function daisyHead(C, size = 1) {
  const g = new THREE.Group();
  const face = new THREE.Group();
  face.lookAt(new THREE.Vector3(1, 1.6, 1));
  g.add(face);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const p = sphere(0.06, C.petal, 6);
    p.scale.set(0.5, 1.6, 0.25);
    p.position.set(Math.cos(a) * 0.12, Math.sin(a) * 0.12, 0);
    p.rotation.z = a - Math.PI / 2;
    face.add(p);
  }
  const c = cyl(0.07, 0.07, 0.05, C.center, 12);
  c.rotation.x = Math.PI / 2;
  face.add(c);
  g.scale.setScalar(size);
  return g;
}

function buildDaisy(head, sway, C, H) {
  // 3 bông nhỏ trên 3 nhánh
  head.add(at(daisyHead(C, 1.15), 0, 0.04, 0));
  for (const [ang, hh] of [[0.9, 0.72], [-1.2, 0.6]]) {
    const branch = new THREE.Group();
    branch.position.y = H * 0.4;
    branch.rotation.z = 0.5 * Math.sign(ang);
    branch.rotation.y = ang;
    const len = H * hh;
    branch.add(at(cyl(0.022, 0.026, len, C.stem, 6), 0, len / 2, 0));
    branch.add(at(daisyHead(C, 0.9), 0, len, 0));
    sway.add(branch);
  }
}

function buildLavender(head, sway, C, H) {
  // vài nhánh mảnh, đầu là bông dài nhiều hạt tím
  const spike = (parent, x, z, tilt, h) => {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.z = tilt;
    g.add(at(cyl(0.016, 0.02, h, C.stem, 5), 0, h / 2, 0));
    for (let i = 0; i < 7; i++) {
      const s = sphere(0.045 - i * 0.003, i % 2 ? C.petal : C.petalDark, 6);
      s.scale.set(1, 1.3, 1);
      s.position.set(Math.sin(i * 2.1) * 0.02, h + i * 0.055, Math.cos(i * 2.1) * 0.02);
      g.add(s);
    }
    parent.add(g);
  };
  spike(sway, 0, 0, 0, H + 0.1);
  spike(sway, 0.07, 0.04, -0.25, H);
  spike(sway, -0.07, 0.03, 0.28, H - 0.05);
  spike(sway, 0.02, -0.07, 0.15, H - 0.1);
}

function buildHydrangea(head, C) {
  // quả cầu hoa lớn gồm nhiều chùm nhỏ
  const n = 22;
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 1.4;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const a = i * 2.4;
    const s = sphere(0.075, i % 3 ? C.petal : C.petalDark, 7);
    s.position.set(Math.cos(a) * r * 0.24, 0.17 + y * 0.2, Math.sin(a) * r * 0.24);
    head.add(s);
  }
  head.add(at(sphere(0.2, C.petal, 10), 0, 0.16, 0));
}

/** Hạt giống (hiển thị nhỏ trong giao diện, không dùng 3D) */
export function flowerIcon(id) { return FLOWERS[id]?.icon ?? '🌼'; }

export { group };
