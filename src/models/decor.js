// Mô hình 3D đồ trang trí & máy móc (khối hình đơn giản, màu pastel)
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { rbox, sphere, cyl, cone, at, torus, capsule } from './primitives.js';
import { basic, mat } from './materials.js';
import { bush } from './environment.js';

const WOOD = '#c9926a', WOOD2 = '#e2b98f';
// vật liệu "tự sáng" (không bị bóng tối làm tối đi) cho mặt bí ngô, ngọn nến, nước phù thủy
const GLOW = basic('#ffd36e');
const FLAME = basic('#ffb347');
const BREW = basic('#9ff0a8');
const PUMP = '#ff9a3c', PUMP2 = '#f28a2e';

/** Quả bí ngô tròn có múi (r: bán kính) */
function pumpkinBall(r, face = false) {
  const g = new THREE.Group();
  for (let i = 0; i < 6; i++) {
    const seg = sphere(r * 0.62, i % 2 ? PUMP : PUMP2, 12);
    const a = (i / 6) * Math.PI * 2;
    seg.scale.set(0.75, 0.95, 1.05);
    seg.position.set(Math.cos(a) * r * 0.38, r * 0.85, Math.sin(a) * r * 0.38);
    seg.rotation.y = -a;
    g.add(seg);
  }
  g.add(at(sphere(r * 0.7, PUMP, 12), 0, r * 0.85, 0));
  const stem = cyl(r * 0.09, r * 0.13, r * 0.4, '#6c9a4b', 6); stem.position.y = r * 1.6; stem.rotation.z = 0.25; g.add(stem);
  if (face) {
    // mắt tam giác + miệng răng cưa, phát sáng
    for (const x of [-0.32, 0.32]) {
      const e = new THREE.Mesh(new THREE.ConeGeometry(r * 0.16, r * 0.24, 3), GLOW);
      e.position.set(x * r, r * 1.02, r * 0.97); e.rotation.x = Math.PI / 2; e.rotation.y = Math.PI;
      g.add(e);
    }
    const mouth = new THREE.Mesh(new THREE.BoxGeometry(r * 0.75, r * 0.14, r * 0.08), GLOW);
    mouth.position.set(0, r * 0.62, r * 0.98); g.add(mouth);
    for (const x of [-0.22, 0, 0.22]) {
      const t = new THREE.Mesh(new THREE.ConeGeometry(r * 0.07, r * 0.12, 3), GLOW);
      t.position.set(x * r, r * 0.74, r * 0.99); g.add(t);
    }
  }
  return g;
}

function bat(scale = 1) {
  const k = scale;
  const b = new THREE.Group();
  const C = '#5b4a73';
  const body = sphere(0.09 * k, C, 10); body.scale.set(0.9, 1.1, 0.9); b.add(body);
  const head = sphere(0.07 * k, C, 10); head.position.set(0, 0.1 * k, 0.02 * k); b.add(head);
  for (const sx of [-1, 1]) {
    const ear = cone(0.025 * k, 0.07 * k, C, 4); ear.position.set(sx * 0.04 * k, 0.17 * k, 0.02 * k); ear.rotation.z = -sx * 0.25; b.add(ear);
    // cánh: 2 múi bầu ghép lại, hơi vểnh lên
    const wing = new THREE.Group(); wing.position.set(sx * 0.07 * k, 0.03 * k, 0); wing.rotation.z = sx * 0.35;
    for (const [dx, sz] of [[0.09, 1], [0.19, 0.8]]) { const m = sphere(0.075 * k, C, 8); m.scale.set(1.25 * sz, 0.28, 0.85 * sz); m.position.x = sx * dx * k; wing.add(m); }
    b.add(wing);
    b.userData[sx < 0 ? 'wl' : 'wr'] = wing;
    b.add(at(sphere(0.018 * k, '#ffe9a8', 6), sx * 0.028 * k, 0.11 * k, 0.08 * k));
  }
  return b;
}


const BUILDERS = {
  bench() {
    const g = new THREE.Group();
    g.add(at(rbox(1.4, 0.12, 0.5, WOOD2, 0.05), 0, 0.45, 0));
    g.add(at(rbox(1.4, 0.4, 0.1, WOOD2, 0.05), 0, 0.75, -0.22));
    for (const x of [-0.6, 0.6]) for (const z of [-0.18, 0.18]) g.add(at(rbox(0.1, 0.45, 0.1, WOOD, 0.03), x, 0.22, z));
    return g;
  },
  pot() {
    const g = new THREE.Group();
    g.add(at(cyl(0.38, 0.28, 0.5, '#e0a383', 12), 0, 0.25, 0));
    const b = bush('#8fd18b', '#f47a93', 0.75); b.position.y = 0.35;
    g.add(b);
    return g;
  },
  lantern() {
    const g = new THREE.Group();
    g.add(at(cyl(0.05, 0.06, 1.6, '#7c6a8f', 8), 0, 0.8, 0));
    g.add(at(rbox(0.6, 0.06, 0.06, '#7c6a8f', 0.02), 0.25, 1.6, 0));
    const l = sphere(0.22, '#f47a6a', 12); l.scale.set(1, 1.25, 1); l.position.set(0.5, 1.3, 0);
    g.add(l);
    g.add(at(cyl(0.12, 0.12, 0.05, '#f6d67a', 10), 0.5, 1.58, 0));
    g.add(at(cyl(0.1, 0.1, 0.05, '#f6d67a', 10), 0.5, 1.02, 0));
    return g;
  },
  mailbox() {
    const g = new THREE.Group();
    g.add(at(cyl(0.05, 0.05, 0.9, WOOD, 8), 0, 0.45, 0));
    g.add(at(rbox(0.5, 0.36, 0.34, '#f78fa7', 0.12), 0, 1.05, 0));
    g.add(at(rbox(0.04, 0.22, 0.12, '#ffd34e', 0.02), 0.27, 1.2, 0));
    return g;
  },
  birdhouse() {
    const g = new THREE.Group();
    g.add(at(cyl(0.06, 0.06, 1.4, WOOD, 8), 0, 0.7, 0));
    g.add(at(rbox(0.5, 0.45, 0.45, '#9fd6f0', 0.06), 0, 1.6, 0));
    const roof = cone(0.45, 0.35, '#f6a6b9', 4); roof.rotation.y = Math.PI / 4; roof.position.y = 2.0;
    g.add(roof);
    g.add(at(sphere(0.08, '#3b2a22', 8), 0, 1.62, 0.23));
    g.add(at(sphere(0.12, '#ffd34e', 8), 0.12, 2.25, 0));
    return g;
  },
  swing() {
    const g = new THREE.Group();
    for (const x of [-0.8, 0.8]) { const p = cyl(0.07, 0.08, 2.0, WOOD, 8); p.position.set(x, 1, 0); g.add(p); }
    const top = cyl(0.06, 0.06, 1.8, WOOD, 8);
    top.position.y = 2.0;
    top.rotation.z = Math.PI / 2;
    g.add(top);
    for (const x of [-0.3, 0.3]) g.add(at(cyl(0.015, 0.015, 1.4, '#ffffff', 4), x, 1.3, 0));
    g.add(at(rbox(0.8, 0.08, 0.36, '#f78fa7', 0.04), 0, 0.6, 0));
    return g;
  },
  bunny() {
    const g = new THREE.Group();
    g.add(at(rbox(0.7, 0.2, 0.7, '#e6e0d8', 0.06), 0, 0.1, 0));
    const body = sphere(0.32, '#ffffff', 14); body.scale.set(1, 1.1, 0.9); body.position.y = 0.48; g.add(body);
    g.add(at(sphere(0.24, '#ffffff', 14), 0, 0.92, 0.04));
    for (const x of [-0.1, 0.1]) { const e = sphere(0.07, '#ffffff', 8); e.scale.set(0.8, 2.6, 0.6); e.position.set(x, 1.25, 0); g.add(e); const i = sphere(0.035, '#ffc4d6', 6); i.scale.set(0.8, 3, 0.4); i.position.set(x, 1.25, 0.05); g.add(i); }
    for (const x of [-0.09, 0.09]) g.add(at(sphere(0.03, '#3b2a22', 6), x, 0.95, 0.24));
    g.add(at(sphere(0.04, '#ffab9c', 6), 0, 0.88, 0.27));
    return g;
  },
  teaset() {
    const g = new THREE.Group();
    g.add(at(cyl(0.55, 0.55, 0.08, WOOD2, 18), 0, 0.6, 0));
    g.add(at(cyl(0.08, 0.12, 0.6, WOOD, 8), 0, 0.3, 0));
    g.add(at(sphere(0.14, '#9fe0c4', 10), 0, 0.76, 0));
    for (let i = 0; i < 3; i++) { const a = i * 2.1; g.add(at(cyl(0.06, 0.05, 0.08, '#ffffff', 8), Math.cos(a) * 0.32, 0.68, Math.sin(a) * 0.32)); }
    for (const a of [0.8, 3.9]) { const st = cyl(0.2, 0.2, 0.36, WOOD2, 10); st.position.set(Math.cos(a) * 0.95, 0.18, Math.sin(a) * 0.95); g.add(st); }
    return g;
  },
  windmill() {
    const g = new THREE.Group();
    g.add(at(cyl(0.35, 0.55, 2.2, '#fff3e6', 8), 0, 1.1, 0));
    g.add(at(cone(0.5, 0.6, '#f6a6b9', 8), 0, 2.5, 0));
    g.add(at(rbox(0.3, 0.5, 0.06, '#a87458', 0.04), 0, 0.3, 0.5));
    const blades = new THREE.Group(); blades.position.set(0, 2.0, 0.45);
    for (let i = 0; i < 4; i++) { const b = rbox(0.18, 1.1, 0.04, '#ffffff', 0.03); b.position.y = 0.55; const h = new THREE.Group(); h.rotation.z = (i * Math.PI) / 2; h.add(b); blades.add(h); }
    blades.add(sphere(0.1, '#ffd34e', 8));
    g.add(blades);
    g.userData.spin = blades;
    return g;
  },
  fountain() {
    const g = new THREE.Group();
    g.add(at(cyl(1.0, 1.1, 0.35, '#d8d2cb', 20), 0, 0.17, 0));
    const w = cyl(0.88, 0.88, 0.05, '#9fdcf0', 20); w.position.y = 0.33; g.add(w);
    g.add(at(cyl(0.15, 0.2, 0.9, '#e6e0d8', 10), 0, 0.6, 0));
    g.add(at(cyl(0.45, 0.3, 0.14, '#d8d2cb', 14), 0, 1.05, 0));
    const jet = sphere(0.16, '#cfeefe', 10); jet.position.y = 1.3; g.add(jet);
    g.userData.bob = jet;
    return g;
  },
  arch() {
    const g = new THREE.Group();
    const a = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.09, 8, 24, Math.PI), torus(1, 0.09, '#f3dcc0').material); a.position.y = 1.4; g.add(a);
    for (const x of [-1, 1]) g.add(at(cyl(0.09, 0.09, 1.4, '#f3dcc0', 8), x, 0.7, 0));
    for (let i = 0; i < 12; i++) { const t = (i / 11) * Math.PI; g.add(at(sphere(0.12, i % 2 ? '#f47a93' : '#8fd18b', 8), Math.cos(t) * 1.0, 1.4 + Math.sin(t) * 1.0, 0.05)); }
    return g;
  },
  balloon() {
    const g = new THREE.Group();
    const b = sphere(0.9, '#f78fa7', 18); b.scale.set(1, 1.15, 1); b.position.y = 3.0; g.add(b);
    for (let i = 0; i < 6; i++) { const s = sphere(0.905, i % 2 ? '#ffd34e' : '#9fd6f0', 18); s.scale.set(0.25, 1.16, 1.01); s.rotation.y = (i * Math.PI) / 3; s.position.y = 3.0; g.add(s); }
    g.add(at(rbox(0.6, 0.4, 0.6, WOOD, 0.08), 0, 1.4, 0));
    for (const [x, z] of [[-0.25, -0.25], [0.25, -0.25], [-0.25, 0.25], [0.25, 0.25]]) g.add(at(cyl(0.015, 0.015, 1.0, '#7c6a5e', 4), x, 1.95, z));
    g.add(at(cyl(0.05, 0.05, 1.4, '#7c6a5e', 6), 0, 0.7, 0));
    g.userData.bob = b;
    return g;
  },
};

// ---- 🎃 Lễ hội Bí Ngô (GĐ10) ----
Object.assign(BUILDERS, {
  pumpkin() {
    const g = new THREE.Group();
    g.add(pumpkinBall(0.42, true));
    const small = pumpkinBall(0.22); small.position.set(0.45, 0, 0.2); g.add(small);
    return g;
  },
  candles() {
    const g = new THREE.Group();
    g.add(at(cyl(0.34, 0.38, 0.12, '#7c6a8f', 12), 0, 0.06, 0));
    const flames = [];
    [[0, 0, 0.55], [0.17, 0.08, 0.38], [-0.16, 0.1, 0.42], [0.04, -0.17, 0.3]].forEach(([x, z, h]) => {
      g.add(at(cyl(0.06, 0.06, h, '#fff3e0', 8), x, 0.12 + h / 2, z));
      const f = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), FLAME);
      f.scale.set(1, 1.7, 1); f.position.set(x, 0.12 + h + 0.06, z);
      g.add(f); flames.push(f);
    });
    g.userData.flicker = flames;
    return g;
  },
  ghost() {
    const g = new THREE.Group();
    g.add(at(cyl(0.04, 0.05, 1.0, WOOD, 6), 0, 0.5, 0));
    const ghost = new THREE.Group(); ghost.position.y = 1.15;
    const head = sphere(0.32, '#ffffff', 14); head.position.y = 0.25; ghost.add(head);
    // khăn trùm: rộng dần xuống dưới, mép lượn sóng
    const robe = cone(0.42, 0.75, '#f7f4ff', 14); robe.position.y = -0.12; ghost.add(robe);
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; ghost.add(at(sphere(0.09, '#f7f4ff', 8), Math.cos(a) * 0.36, -0.48, Math.sin(a) * 0.36)); }
    for (const x of [-0.11, 0.11]) { const e = sphere(0.055, '#3b2a40', 8); e.scale.set(0.8, 1.2, 0.6); e.position.set(x, 0.3, 0.28); ghost.add(e); }
    ghost.add(at(sphere(0.05, '#ffb3c6', 8), -0.18, 0.18, 0.27)); ghost.add(at(sphere(0.05, '#ffb3c6', 8), 0.18, 0.18, 0.27));
    for (const sx of [-1, 1]) { const arm = capsule(0.07, 0.25, '#f7f4ff'); arm.rotation.z = sx * 1.1; arm.position.set(sx * 0.4, 0.02, 0); ghost.add(arm); }
    g.add(ghost);
    g.userData.float = ghost;
    return g;
  },
  grave() {
    const g = new THREE.Group();
    g.add(at(rbox(0.9, 0.08, 0.6, '#8fbf72', 0.04), 0, 0.04, 0));
    const stone = rbox(0.62, 0.8, 0.18, '#b8b4c4', 0.08); stone.position.y = 0.45; g.add(stone);
    g.add(at(sphere(0.31, '#b8b4c4', 14), 0, 0.82, 0)); g.children[2].scale.set(1, 0.55, 0.29);
    g.add(at(rbox(0.07, 0.34, 0.03, '#8d88a0', 0.01), 0, 0.62, 0.1));
    g.add(at(rbox(0.22, 0.07, 0.03, '#8d88a0', 0.01), 0, 0.7, 0.1));
    const p = pumpkinBall(0.13, true); p.position.set(0.35, 0.06, 0.22); g.add(p);
    return g;
  },
  bats() {
    const g = new THREE.Group();
    g.add(at(cyl(0.05, 0.06, 1.9, '#5b4a73', 8), 0, 0.95, 0));
    g.add(at(sphere(0.16, '#ffd36e', 10), 0, 1.98, 0));
    g.children[1].material = GLOW;
    const ring = new THREE.Group(); ring.position.y = 1.55;
    ring.userData.bats = [];
    for (let i = 0; i < 3; i++) { const b = bat(1.3); ring.userData.bats.push(b); const a = (i / 3) * Math.PI * 2; b.position.set(Math.cos(a) * 0.55, Math.sin(i * 2) * 0.15, Math.sin(a) * 0.55); b.rotation.y = -a; ring.add(b); }
    g.add(ring);
    g.userData.orbit = ring;
    return g;
  },
  cauldron() {
    const g = new THREE.Group();
    for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2; const l = cyl(0.04, 0.04, 0.35, '#3d3550', 6); l.position.set(Math.cos(a) * 0.32, 0.17, Math.sin(a) * 0.32); g.add(l); }
    for (const a of [0.4, 2.1, 3.9]) { const log = cyl(0.06, 0.06, 0.5, '#a87458', 6); log.rotation.z = Math.PI / 2; log.rotation.y = a; log.position.y = 0.06; g.add(log); }
    const pot = sphere(0.45, '#3d3550', 16); pot.scale.set(1, 0.85, 1); pot.position.y = 0.62; g.add(pot);
    g.add(at(torus(0.38, 0.06, '#5b5070'), 0, 0.95, 0)); g.children[g.children.length - 1].rotation.x = Math.PI / 2;
    const brew = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.04, 16), BREW); brew.position.y = 0.95; g.add(brew);
    const bubbles = [];
    for (let i = 0; i < 4; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.07 + (i % 2) * 0.03, 8, 6), BREW); b.position.set((i - 1.5) * 0.12, 1.0, (i % 2 - 0.5) * 0.15); b.userData.phase = i * 1.7; g.add(b); bubbles.push(b); }
    g.userData.bubbles = bubbles;
    return g;
  },
  web() {
    const g = new THREE.Group();
    for (const x of [-1, 1]) g.add(at(cyl(0.08, 0.1, 2.1, '#6f5a4a', 8), x, 1.05, 0));
    g.add(at(rbox(2.3, 0.14, 0.14, '#6f5a4a', 0.04), 0, 2.1, 0));
    const silk = '#f2f0ff';
    const cx = 0, cy = 1.35, R = 0.8;
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; const s = cyl(0.012, 0.012, R, silk, 4); s.position.set(cx + Math.cos(a) * R / 2, cy + Math.sin(a) * R / 2, 0); s.rotation.z = a - Math.PI / 2; g.add(s); }
    for (const rr of [0.3, 0.55, 0.78]) { const t = new THREE.Mesh(new THREE.TorusGeometry(rr, 0.012, 4, 8), torus(1, 0.01, silk).material); t.position.set(cx, cy, 0); t.rotation.z = Math.PI / 8; g.add(t); }
    const spider = new THREE.Group(); spider.position.set(0.2, 1.1, 0.03);
    spider.add(sphere(0.09, '#3d3550', 8));
    for (const x of [-0.03, 0.03]) spider.add(at(sphere(0.02, '#ffffff', 6), x, 0.03, 0.08));
    for (let i = 0; i < 4; i++) for (const sx of [-1, 1]) { const leg = cyl(0.01, 0.01, 0.16, '#3d3550', 3); leg.rotation.z = sx * (0.9 + i * 0.2); leg.position.set(sx * 0.1, 0.02 - i * 0.02, 0); spider.add(leg); }
    g.add(spider);
    g.userData.dangle = spider;
    const p = pumpkinBall(0.2, true); p.position.set(-1.25, 0, 0.25); g.add(p);
    return g;
  },
  pumpkinhouse() {
    const g = new THREE.Group();
    const house = pumpkinBall(1.0);
    g.add(house);
    g.add(at(rbox(0.5, 0.75, 0.1, '#6f4a3a', 0.12), 0, 0.42, 0.93));
    g.add(at(sphere(0.04, '#ffd36e', 6), 0.15, 0.45, 0.99));
    for (const x of [-0.5, 0.5]) { const w = new THREE.Mesh(new THREE.CircleGeometry(0.16, 12), GLOW); w.position.set(x, 1.15, 0.9); w.rotation.y = x * -0.5; g.add(w); }
    const chim = cyl(0.12, 0.14, 0.5, '#8d88a0', 8); chim.position.set(-0.5, 1.95, -0.3); g.add(chim);
    const hat = cone(0.5, 0.9, '#5b4a73', 10); hat.position.set(0.2, 2.25, 0); hat.rotation.z = -0.25; g.add(hat);
    g.add(at(torus(0.42, 0.06, '#c79cf2'), 0.12, 1.85, 0)); g.children[g.children.length - 1].rotation.x = Math.PI / 2;
    return g;
  },

  // ---- 🍀 Vận May (GĐ15) ----
  clover() {
    // tượng cỏ bốn lá trên bệ đá, lá xoay chầm chậm và nhấp nhô
    const g = new THREE.Group();
    g.add(at(cyl(0.42, 0.5, 0.25, '#e6e0d8', 16), 0, 0.12, 0));
    g.add(at(cyl(0.34, 0.34, 0.05, '#ffd34e', 16), 0, 0.27, 0));
    const top = new THREE.Group(); top.position.y = 1.05;
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      const leafG = new THREE.Group(); leafG.rotation.y = a;
      for (const sx of [-1, 1]) { const h = sphere(0.17, '#5fc46a', 12); h.scale.set(1, 1, 0.35); h.position.set(sx * 0.1, 0.06, 0.22); leafG.add(h); }
      top.add(leafG);
    }
    top.add(sphere(0.08, '#ffe066', 10));
    g.add(at(cyl(0.035, 0.045, 0.8, '#4f9a57', 6), 0, 0.65, 0));
    g.add(top);
    g.userData.spinY = top;
    g.userData.hover = top; g.userData.hoverBase = 1.05;
    return g;
  },
  luckycat() {
    // mèo may mắn vẫy tay
    const g = new THREE.Group();
    g.add(at(rbox(0.7, 0.16, 0.6, '#c8433b', 0.06), 0, 0.08, 0));
    const body = sphere(0.33, '#fffaf3', 14); body.scale.set(1, 1.05, 0.85); body.position.y = 0.48; g.add(body);
    const head = sphere(0.3, '#fffaf3', 14); head.position.y = 0.98; g.add(head);
    for (const x of [-0.17, 0.17]) { const e = cone(0.1, 0.18, '#fffaf3', 6); e.position.set(x, 1.24, 0); e.rotation.z = -x * 1.3; g.add(e); g.add(at(cone(0.05, 0.1, '#ffb3c6', 6), x * 1.02, 1.23, 0.04)); }
    for (const x of [-0.1, 0.1]) { const eye = torus(0.04, 0.012, '#3b2a22'); eye.position.set(x, 1.0, 0.28); eye.rotation.z = Math.PI; g.add(eye); }
    g.add(at(sphere(0.03, '#ff8fa3', 6), 0, 0.93, 0.29));
    g.add(at(torus(0.24, 0.035, '#e23b3b'), 0, 0.75, 0)); g.children[g.children.length - 1].rotation.x = Math.PI / 2;
    g.add(at(sphere(0.07, '#ffd34e', 8), 0, 0.7, 0.24));
    const coin = cyl(0.14, 0.14, 0.04, '#ffd34e', 14); coin.rotation.x = Math.PI / 2; coin.position.set(-0.12, 0.45, 0.3); g.add(coin);
    const arm = new THREE.Group(); arm.position.set(0.27, 0.75, 0.05);
    const paw = capsule(0.07, 0.3, '#fffaf3'); paw.position.y = 0.2; arm.add(paw);
    arm.add(at(sphere(0.08, '#fffaf3', 8), 0, 0.4, 0));
    g.add(arm);
    g.userData.wave = arm;
    return g;
  },
  // ---- 📅 Sự kiện tuần (GĐ18) ----
  flowercart() {
    // xe đẩy gỗ chở đầy hoa, bánh xe quay chầm chậm
    const g = new THREE.Group();
    g.add(at(rbox(1.3, 0.5, 0.8, WOOD, 0.08), 0, 0.6, 0));
    g.add(at(rbox(1.36, 0.08, 0.86, WOOD2, 0.04), 0, 0.88, 0));
    const wheels = new THREE.Group();
    for (const z of [-0.45, 0.45]) { const w = torus(0.26, 0.06, '#8a5a3c'); w.position.set(-0.3, 0.3, z); wheels.add(w); wheels.add(at(sphere(0.07, '#c9926a', 8), -0.3, 0.3, z)); }
    g.add(wheels);
    g.add(at(cyl(0.04, 0.04, 0.9, WOOD, 6), 0.95, 0.75, 0)); g.children[g.children.length - 1].rotation.z = 1.1;
    g.add(at(cyl(0.05, 0.05, 0.6, WOOD, 6), 0.45, 0.35, 0)); // chân chống
    const cols = ['#f47a93', '#ffd34e', '#c79cf2', '#ff9f7a', '#ffffff', '#8fd8ff'];
    for (let i = 0; i < 16; i++) {
      const x = -0.5 + (i % 4) * 0.33, z = -0.27 + Math.floor(i / 4) * 0.18;
      g.add(at(sphere(0.13, cols[i % cols.length], 8), x, 1.02 + (i % 3) * 0.04, z));
    }
    for (let i = 0; i < 6; i++) g.add(at(sphere(0.12, '#8fd18b', 8), -0.55 + i * 0.22, 0.95, i % 2 ? 0.33 : -0.33));
    return g;
  },
  trophy() {
    // cúp vàng trên bệ, ngôi sao xoay phía trên
    const g = new THREE.Group();
    g.add(at(rbox(0.6, 0.3, 0.6, '#7c6a8f', 0.06), 0, 0.15, 0));
    g.add(at(cyl(0.08, 0.12, 0.35, '#f2c14e', 10), 0, 0.48, 0));
    const cup = cyl(0.32, 0.14, 0.45, '#f7c531', 16); cup.position.y = 0.88; g.add(cup);
    for (const x of [-0.36, 0.36]) { const h = torus(0.12, 0.035, '#f2c14e'); h.position.set(x, 0.9, 0); h.rotation.y = Math.PI / 2; g.add(h); }
    const star = new THREE.Group(); star.position.y = 1.35;
    const s = sphere(0.13, '#fff2a8', 10); s.scale.set(1, 1, 0.4); star.add(s);
    for (let i = 0; i < 5; i++) { const sp = cone(0.07, 0.18, '#ffd34e', 6); const a = (i / 5) * Math.PI * 2; sp.position.set(Math.cos(a) * 0.15, Math.sin(a) * 0.15, 0); sp.rotation.z = a - Math.PI / 2; star.add(sp); }
    g.add(star);
    g.userData.spinY = star;
    g.userData.hover = star; g.userData.hoverBase = 1.35;
    return g;
  },
  carousel() {
    // đu quay mini có ngựa gỗ & mái sọc, quay tròn
    const g = new THREE.Group();
    g.add(at(cyl(0.95, 1.0, 0.18, '#f3dcc0', 20), 0, 0.09, 0));
    const top = new THREE.Group();
    top.add(at(cyl(0.07, 0.07, 1.7, '#f6d67a', 8), 0, 0.95, 0));
    const roof = cone(1.05, 0.55, '#f6a6b9', 12); roof.position.y = 1.95; top.add(roof);
    top.add(at(sphere(0.1, '#ffd34e', 8), 0, 2.28, 0));
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      const pole = cyl(0.03, 0.03, 1.5, '#ffffff', 6); pole.position.set(Math.cos(a) * 0.7, 1.0, Math.sin(a) * 0.7); top.add(pole);
      const horse = new THREE.Group();
      horse.add(rbox(0.36, 0.2, 0.14, ['#ffffff', '#ffd3df', '#d8f0ff', '#fff3c4'][i], 0.06));
      horse.add(at(rbox(0.14, 0.22, 0.12, ['#ffffff', '#ffd3df', '#d8f0ff', '#fff3c4'][i], 0.05), 0.18, 0.14, 0));
      horse.position.set(Math.cos(a) * 0.7, 0.75 + (i % 2) * 0.15, Math.sin(a) * 0.7);
      horse.rotation.y = -a;
      top.add(horse);
    }
    g.add(top);
    g.userData.spinY = top;
    return g;
  },
  starlamp() {
    // đèn ngôi sao bay lơ lửng trên cột, ban đêm tự sáng
    const g = new THREE.Group();
    g.add(at(cyl(0.3, 0.36, 0.14, '#7c6a8f', 12), 0, 0.07, 0));
    g.add(at(cyl(0.04, 0.05, 1.3, '#a89cc0', 8), 0, 0.75, 0));
    g.add(at(torus(0.22, 0.03, '#ffd34e'), 0, 1.45, 0));
    const star = new THREE.Group(); star.position.y = 1.85;
    const shape = new THREE.Shape();
    for (let i = 0; i < 10; i++) { const r = i % 2 ? 0.14 : 0.32; const a = (i / 10) * Math.PI * 2 + Math.PI / 2; if (i) shape.lineTo(Math.cos(a) * r, Math.sin(a) * r); else shape.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
    const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.12, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 1 });
    geo.center();
    const sm = new THREE.Mesh(geo, GLOW); star.add(sm);
    for (let i = 0; i < 3; i++) { const sp = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 4), basic('#fff6d0')); sp.position.set(Math.cos(i * 2.1) * 0.5, 0, Math.sin(i * 2.1) * 0.5); star.add(sp); }
    g.add(star);
    g.userData.spinY = star;
    g.userData.hover = star; g.userData.hoverBase = 1.85;
    return g;
  },
});

// (GĐ22) bể cá cảnh: 3 con cá bơi vòng (dùng hiệu ứng orbit có sẵn)
BUILDERS.fishtank = function fishtank() {
  const g = new THREE.Group();
  g.add(at(rbox(1.3, 0.5, 0.8, '#a88a6c', 0.06), 0, 0.25, 0));
  const glass = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 0.7), new THREE.MeshStandardMaterial({ color: '#bfe9ff', transparent: true, opacity: 0.4, roughness: 0.2 }));
  glass.position.y = 0.92; g.add(glass);
  g.add(at(rbox(1.3, 0.06, 0.8, '#8a6f55', 0.02), 0, 1.35, 0));
  const ring = new THREE.Group(); ring.position.y = 0.92;
  ['#ff9f5a', '#ffd34e', '#f47a93'].forEach((c, i) => {
    const f = new THREE.Group();
    const body = sphere(0.09, c, 8); body.scale.set(1.6, 0.9, 0.6); f.add(body);
    const tail = sphere(0.06, c, 6); tail.scale.set(0.5, 1.1, 0.3); tail.position.x = -0.15; f.add(tail);
    const a = (i / 3) * Math.PI * 2;
    f.position.set(Math.cos(a) * 0.36, (i - 1) * 0.16, Math.sin(a) * 0.2); f.rotation.y = -a + Math.PI / 2;
    ring.add(f);
  });
  g.add(ring);
  g.userData.orbit = ring;
  return g;
};

// 🎡 (GĐ26) quà Khu Vui Chơi
BUILDERS.fun_teddy = () => {
  const g = new THREE.Group(), c = '#c9925a', l = '#f2d2b0';
  const b = sphere(0.36, c, 14); b.scale.set(1, 1.1, 0.9); b.position.y = 0.4; g.add(b);
  g.add(at(sphere(0.2, l, 10), 0, 0.36, 0.22));
  g.add(at(sphere(0.3, c, 14), 0, 0.92, 0));
  for (const x of [-0.2, 0.2]) { g.add(at(sphere(0.1, c, 8), x, 1.16, 0)); g.add(at(sphere(0.14, c, 8), x * 1.6, 0.48, 0.1)); g.add(at(sphere(0.15, c, 8), x * 1.1, 0.12, 0.16)); }
  g.add(at(sphere(0.11, l, 8), 0, 0.86, 0.24));
  for (const x of [-0.1, 0.1]) g.add(at(sphere(0.035, '#2a1f1c', 6), x, 0.98, 0.26));
  const bow = sphere(0.08, '#ff8fb1', 8); bow.scale.set(2, 0.8, 0.8); bow.position.set(0, 0.7, 0.2); g.add(bow);
  return g;
};
BUILDERS.fun_balloons = () => {
  const g = new THREE.Group();
  g.add(at(cyl(0.12, 0.14, 0.12, '#d9b48a', 8), 0, 0.06, 0));
  const cols = ['#ff8fb1', '#8fd8ff', '#ffd36e', '#b9a2ff', '#9be29b'];
  const bob = new THREE.Group();
  cols.forEach((c, i) => { const a = (i / 5) * Math.PI * 2; const x = Math.cos(a) * 0.22, z = Math.sin(a) * 0.22, y = 1.5 + (i % 2) * 0.25; const bl = sphere(0.2, c, 10); bl.scale.y = 1.2; bl.position.set(x, y, z); bob.add(bl); bob.add(at(cyl(0.006, 0.006, y - 0.1, '#ffffff', 3), x / 2, (y - 0.1) / 2 + 0.05, z / 2)); });
  g.add(bob);
  g.userData.bob = bob;
  return g;
};

// =============================================================
//  (0.29) Chi tiết thêm cho từng món (gắn sau khi dựng khung chính). Khối nhỏ dùng hình ít mặt.
// =============================================================
const lowCache = new Map();
const low = (k, make) => { if (!lowCache.has(k)) lowCache.set(k, make()); return lowCache.get(k); };
const bx = (w, h, d, c) => new THREE.Mesh(low(`b${w}|${h}|${d}`, () => new THREE.BoxGeometry(w, h, d)), mat(c));
const dot = (r, c) => new THREE.Mesh(low(`d${r}`, () => new THREE.SphereGeometry(r, 8, 6)), mat(c));
const ring = (r, t, c, arc = Math.PI * 2) => new THREE.Mesh(low(`r${r}|${t}|${arc}`, () => new THREE.TorusGeometry(r, t, 5, 18, arc)), mat(c));
const rod = (r, h, c) => new THREE.Mesh(low(`c${r}|${h}`, () => new THREE.CylinderGeometry(r, r, h, 6)), mat(c));
/** bông hoa nhỏ 5 cánh nằm ngang tại (x, y, z) */
function blossom(g, x, y, z, col = '#ffffff', r = 0.05, tilt = 0) {
  const f = new THREE.Group(); f.position.set(x, y, z); f.rotation.x = tilt;
  for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; const p = dot(r, col); p.scale.set(1, 0.45, 1); p.position.set(Math.cos(a) * r, 0, Math.sin(a) * r); f.add(p); }
  f.add(at(dot(r * 0.6, '#ffd36e'), 0, r * 0.25, 0));
  g.add(f);
}
const leafy = (g, x, y, z, s = 1, c = '#7cc27f') => { const l = dot(0.06 * s, c); l.scale.set(1.6, 0.45, 0.9); l.position.set(x, y, z); l.rotation.y = x * 3 + z; g.add(l); };

const DETAILS = {
  bench(g) {
    for (let i = 0; i < 4; i++) g.add(at(bx(1.36, 0.012, 0.02, '#b07d56'), 0, 0.515, -0.18 + i * 0.12)); // khe ván ngồi
    for (const y of [0.66, 0.84]) g.add(at(bx(1.36, 0.012, 0.012, '#b07d56'), 0, y, -0.165)); // khe ván tựa
    for (const x of [-0.7, 0.7]) { g.add(at(rbox(0.08, 0.06, 0.5, WOOD, 0.02), x, 0.7, 0)); g.add(at(rod(0.025, 0.2, WOOD), x, 0.6, 0.2)); } // tay vịn
    g.add(at(rbox(0.36, 0.08, 0.32, '#f6a6b9', 0.04), -0.3, 0.55, 0.02)); // gối ngồi
    for (let i = 0; i < 4; i++) g.add(at(dot(0.015, '#ffffff'), -0.42 + (i % 2) * 0.24, 0.6, -0.08 + Math.floor(i / 2) * 0.2));
    blossom(g, 0.45, 0.53, 0.05, '#ff8fb1', 0.05); leafy(g, 0.52, 0.52, 0.1);
  },
  pot(g) {
    g.add(at(ring(0.37, 0.04, '#d38f6d'), 0, 0.5, 0).rotateX(Math.PI / 2)); // miệng chậu
    g.add(at(cyl(0.34, 0.3, 0.05, '#c98263', 14), 0, 0.02, 0)); // đĩa lót
    for (const y of [0.18, 0.32]) { const b = ring(0.34 - (0.32 - y) * 0.2, 0.012, '#f6e2c8'); b.rotation.x = Math.PI / 2; b.position.y = y; g.add(b); } // sọc trang trí
    for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2 + 0.3; g.add(at(dot(0.025, '#ffffff'), Math.cos(a) * 0.33, 0.25, Math.sin(a) * 0.33)); }
    for (let i = 0; i < 3; i++) { const a = i * 2.1; blossom(g, Math.cos(a) * 0.3, 0.95 + (i % 2) * 0.1, Math.sin(a) * 0.3, ['#f47a93', '#ffd36e', '#ffffff'][i], 0.055); }
  },
  lantern(g) {
    for (let i = 0; i < 6; i++) { const r = ring(0.205, 0.01, '#d9534f'); r.rotation.y = (i / 6) * Math.PI; r.scale.set(1, 1.27, 1); r.position.set(0.5, 1.3, 0); g.add(r); } // gân đèn
    g.add(at(rod(0.008, 0.26, '#7c6a8f'), 0.5, 1.72, 0)); // dây treo
    g.add(at(rod(0.012, 0.2, '#ffd36e'), 0.5, 0.88, 0)); // tua rua
    for (let i = 0; i < 5; i++) g.add(at(rod(0.006, 0.18, '#f47a6a'), 0.48 + i * 0.01, 0.72, (i - 2) * 0.01));
    g.add(at(dot(0.05, '#ffe9a8'), 0.5, 1.3, 0.2)); // chữ phúc sáng
    g.add(at(cyl(0.16, 0.2, 0.08, '#7c6a8f', 10), 0, 0.04, 0)); // đế cột
    g.add(at(dot(0.06, '#7c6a8f'), 0, 1.62, 0));
  },
  mailbox(g) {
    g.add(at(cyl(0.16, 0.2, 0.1, WOOD, 10), 0, 0.05, 0)); // chân đế
    g.add(at(rbox(0.52, 0.04, 0.36, '#e0708a', 0.02), 0, 1.24, 0)); // nắp
    g.add(at(bx(0.3, 0.025, 0.02, '#7a3d4f'), 0, 1.08, 0.175)); // khe thư
    const letter = bx(0.22, 0.14, 0.015, '#fffaf0'); letter.position.set(0, 1.16, 0.17); letter.rotation.x = -0.25; g.add(letter); // lá thư ló ra
    g.add(at(dot(0.025, '#f47a93'), 0, 1.16, 0.185));
    g.add(at(bx(0.04, 0.05, 0.14, '#ffd34e'), 0.27, 1.36, 0.06)); // cờ báo thư
    g.add(at(rbox(0.16, 0.08, 0.02, '#ffffff', 0.01), 0, 0.95, 0.175)); // biển số nhà
    for (let i = 0; i < 3; i++) leafy(g, -0.1 + i * 0.1, 0.06, 0.18, 1.2);
    blossom(g, 0.05, 0.12, 0.2, '#ffd36e', 0.04);
  },
  birdhouse(g) {
    g.add(at(rod(0.015, 0.22, WOOD), 0, 1.5, 0.3).rotateX(Math.PI / 2)); // que đậu
    g.add(at(ring(0.09, 0.015, '#ffffff'), 0, 1.62, 0.235)); // viền lỗ cửa
    const bird = new THREE.Group(); bird.position.set(0, 1.53, 0.4);
    const bd = dot(0.07, '#ffd34e'); bd.scale.set(1, 0.9, 1.2); bird.add(bd);
    bird.add(at(dot(0.05, '#ffd34e'), 0, 0.07, 0.04));
    const beak = cone(0.02, 0.05, '#f2a03d', 4); beak.rotation.x = Math.PI / 2; beak.position.set(0, 0.07, 0.1); bird.add(beak);
    for (const x of [-0.025, 0.025]) bird.add(at(dot(0.012, '#3b2a22'), x, 0.09, 0.08));
    g.add(bird);
    for (const x of [-1, 1]) { const tr = bx(0.36, 0.03, 0.03, '#ffffff'); tr.position.set(x * 0.16, 1.98, 0.24); tr.rotation.z = -x * 0.62; g.add(tr); } // viền mái
    g.add(at(rbox(0.6, 0.05, 0.55, WOOD2, 0.02), 0, 1.36, 0)); // đế nhà
    g.add(at(dot(0.04, '#ffffff'), -0.15, 1.75, 0.235)); g.add(at(dot(0.04, '#ffffff'), 0.15, 1.75, 0.235));
    leafy(g, 0.08, 0.9, 0.06, 1.4); leafy(g, -0.07, 0.6, 0.06, 1.4); blossom(g, 0.05, 0.75, 0.07, '#f47a93', 0.045, Math.PI / 2);
  },
  swing(g) {
    for (const x of [-0.8, 0.8]) { // chân chữ A + cọc
      for (const z of [-1, 1]) { const l = rod(0.045, 2.1, WOOD); l.position.set(x, 1, z * 0.32); l.rotation.x = z * 0.3; g.add(l); }
      for (let i = 0; i < 4; i++) { const a = i * 1.6; leafy(g, x + Math.cos(a) * 0.08, 0.4 + i * 0.35, Math.sin(a) * 0.08, 1.1); }
      blossom(g, x, 1.2, 0.1, '#f47a93', 0.05, Math.PI / 2);
    }
    for (const x of [-0.3, 0.3]) { g.add(at(ring(0.04, 0.012, '#ffffff'), x, 1.98, 0)); g.add(at(dot(0.025, '#e6d8c6'), x, 0.68, 0)); } // khoen + nút dây
    for (let i = 0; i < 3; i++) g.add(at(bx(0.8, 0.01, 0.01, '#e0708a'), 0, 0.645, -0.12 + i * 0.12)); // khe ván ghế
    g.add(at(rbox(0.8, 0.3, 0.05, '#f78fa7', 0.03), 0, 0.82, -0.17)); // tựa lưng
  },
  bunny(g) {
    const tail = dot(0.1, '#ffffff'); tail.position.set(0, 0.42, -0.3); g.add(tail);
    for (const x of [-0.14, 0.14]) { const paw = dot(0.08, '#ffffff'); paw.scale.set(1, 0.7, 1.3); paw.position.set(x, 0.24, 0.2); g.add(paw); }
    for (const x of [-1, 1]) for (const dy of [-0.015, 0.015]) { const w = bx(0.16, 0.006, 0.006, '#c9b8b0'); w.position.set(x * 0.13, 0.88 + dy, 0.27); w.rotation.z = x * dy * 8; g.add(w); } // ria
    const carrot = cone(0.05, 0.22, '#f2913d', 8); carrot.rotation.z = Math.PI / 2 + 0.3; carrot.position.set(0.02, 0.36, 0.28); g.add(carrot);
    for (const dz of [-0.03, 0.03]) leafy(g, 0.16, 0.42, 0.28 + dz, 0.8, '#6fbf63');
    g.add(at(ring(0.36, 0.02, '#f6a6b9'), 0, 0.2, 0).rotateX(Math.PI / 2)); // viền bệ
    for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + 0.4; blossom(g, Math.cos(a) * 0.3, 0.21, Math.sin(a) * 0.3, ['#ffc4d6', '#fff0a8'][i % 2], 0.035); }
  },
  teaset(g) {
    g.add(at(cyl(0.58, 0.58, 0.02, '#fff3f6', 18), 0, 0.645, 0)); // khăn trải bàn
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; g.add(at(dot(0.03, '#f6a6b9'), Math.cos(a) * 0.57, 0.63, Math.sin(a) * 0.57)); } // ren mép
    // ấm trà: nắp, quai, vòi
    g.add(at(dot(0.05, '#ffffff'), 0, 0.9, 0)); g.add(at(cyl(0.08, 0.1, 0.03, '#ffffff', 10), 0, 0.87, 0));
    const sp = cyl(0.015, 0.03, 0.16, '#9fe0c4', 6); sp.position.set(0.15, 0.8, 0); sp.rotation.z = -0.9; g.add(sp);
    const hd = ring(0.07, 0.015, '#9fe0c4'); hd.position.set(-0.15, 0.78, 0); g.add(hd);
    blossom(g, 0, 0.78, 0.13, '#f47a93', 0.03, Math.PI / 2);
    for (let i = 0; i < 3; i++) { const a = i * 2.1, x = Math.cos(a) * 0.32, z = Math.sin(a) * 0.32; g.add(at(cyl(0.09, 0.09, 0.012, '#ffffff', 10), x, 0.645, z)); const h = ring(0.03, 0.008, '#ffffff'); h.position.set(x + 0.07, 0.69, z); g.add(h); g.add(at(cyl(0.05, 0.05, 0.01, '#a87458', 8), x, 0.715, z)); } // đĩa + quai tách + trà
    const plate = cyl(0.12, 0.1, 0.02, '#ffffff', 12); plate.position.set(-0.15, 0.66, -0.3); g.add(plate);
    for (let i = 0; i < 3; i++) g.add(at(cyl(0.035, 0.035, 0.02, ['#f2c27a', '#f6a6b9', '#c9a27e'][i], 8), -0.18 + i * 0.04, 0.68 + i * 0.012, -0.3)); // bánh quy
    for (const a of [0.8, 3.9]) { const x = Math.cos(a) * 0.95, z = Math.sin(a) * 0.95; g.add(at(cyl(0.21, 0.21, 0.06, '#f6a6b9', 12), x, 0.39, z)); } // nệm ghế
  },
  windmill(g) {
    for (const y of [0.5, 1.1, 1.7]) { const b = ring(0.52 - y * 0.08, 0.025, '#f2c9a0'); b.rotation.x = Math.PI / 2; b.position.y = y; g.add(b); } // vạch gạch
    g.add(at(rbox(0.38, 0.06, 0.1, '#a87458', 0.02), 0, 0.58, 0.5)); // mái hiên cửa
    g.add(at(dot(0.025, '#ffd34e'), 0.1, 0.3, 0.54)); // tay nắm
    for (const y of [1.0, 1.6]) { const w = rbox(0.2, 0.22, 0.05, '#9fd6f0', 0.03); w.position.set(0, y, 0.43 - (y - 1) * 0.12); w.rotation.x = -0.09; g.add(w); g.add(at(bx(0.22, 0.02, 0.06, '#ffffff'), 0, y, 0.44 - (y - 1) * 0.12)); } // cửa sổ
    const balc = ring(0.48, 0.03, WOOD); balc.rotation.x = Math.PI / 2; balc.position.y = 1.85; g.add(balc);
    for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; g.add(at(rod(0.015, 0.18, WOOD), Math.cos(a) * 0.48, 1.76, Math.sin(a) * 0.48)); }
    g.add(at(dot(0.06, '#ffd34e'), 0, 2.82, 0));
    // cánh quạt: thêm nan vải (gắn vào nhóm quay)
    const blades = g.userData.spin;
    if (blades) for (let i = 0; i < 4; i++) { const h = new THREE.Group(); h.rotation.z = (i * Math.PI) / 2; for (let k = 0; k < 3; k++) h.add(at(bx(0.26, 0.012, 0.05, '#c9a27e'), 0.04, 0.3 + k * 0.3, 0.02)); blades.add(h); }
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; blossom(g, Math.cos(a) * 0.65, 0.06, Math.sin(a) * 0.65, ['#f47a93', '#ffd36e', '#c79cf2'][i % 3], 0.05); leafy(g, Math.cos(a + 0.3) * 0.68, 0.04, Math.sin(a + 0.3) * 0.68); }
  },
  fountain(g) {
    for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; const st = rbox(0.34, 0.1, 0.2, i % 2 ? '#e6e0d8' : '#cfc8c0', 0.04); st.position.set(Math.cos(a) * 1.02, 0.38, Math.sin(a) * 1.02); st.rotation.y = -a; g.add(st); } // đá viền
    for (let i = 0; i < 3; i++) { const a = i * 2.2 + 0.5; const pad = cyl(0.14, 0.14, 0.015, '#7cc27f', 10); pad.position.set(Math.cos(a) * 0.6, 0.36, Math.sin(a) * 0.6); g.add(pad); if (i !== 1) blossom(g, Math.cos(a) * 0.6, 0.38, Math.sin(a) * 0.6, '#ffc4d6', 0.035); } // lá súng
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; const d = dot(0.035, '#cfeefe'); d.position.set(Math.cos(a) * 0.38, 0.95, Math.sin(a) * 0.38); g.add(d); } // giọt nước tràn tầng trên
    const r2 = ring(0.45, 0.03, '#e6e0d8'); r2.rotation.x = Math.PI / 2; r2.position.y = 1.12; g.add(r2);
    for (let i = 0; i < 2; i++) { const f = dot(0.05, '#ff9f5a'); f.scale.set(1.6, 0.8, 0.7); f.position.set(-0.3 + i * 0.5, 0.34, 0.2 - i * 0.4); f.rotation.y = i * 2; g.add(f); } // cá vàng
  },
  arch(g) {
    for (let i = 0; i < 22; i++) { const t = (i / 21) * Math.PI; leafy(g, Math.cos(t) * 1.0 + (i % 2 ? 0.08 : -0.08), 1.4 + Math.sin(t) * 1.0, 0.1 - (i % 3) * 0.08, 1.4); }
    for (let i = 0; i < 6; i++) { const t = ((i + 0.5) / 6) * Math.PI; blossom(g, Math.cos(t) * 1.02, 1.4 + Math.sin(t) * 1.02, 0.15, i % 2 ? '#ffffff' : '#ffc4d6', 0.06, Math.PI / 2); }
    for (const x of [-1, 1]) { // chậu hoa chân cổng + dây leo
      g.add(at(cyl(0.22, 0.17, 0.3, '#e0a383', 10), x, 0.15, 0.2));
      for (let k = 0; k < 4; k++) leafy(g, x + (k % 2 ? 0.06 : -0.06), 0.3 + k * 0.28, 0.06, 1.3);
      blossom(g, x, 0.33, 0.2, '#f47a93', 0.06);
    }
    g.add(at(rbox(0.7, 0.22, 0.04, '#fff3e6', 0.04), 0, 2.15, 0.12)); // biển chào
    g.add(at(dot(0.05, '#f47a93'), -0.15, 2.15, 0.15)); g.add(at(dot(0.05, '#f47a93'), 0.15, 2.15, 0.15));
  },
  balloon(g) {
    for (const y of [1.25, 1.4, 1.55]) { const w = ring(0.31, 0.012, '#a8784f'); w.rotation.x = Math.PI / 2; w.position.y = y; g.add(w); } // vân đan giỏ
    g.add(at(ring(0.31, 0.04, '#a8784f'), 0, 1.6, 0).rotateX(Math.PI / 2)); // miệng giỏ
    for (const [x, z] of [[0.34, 0.1], [-0.34, -0.05]]) { const sb = dot(0.08, '#e6d8c6'); sb.scale.set(1, 1.2, 1); sb.position.set(x, 1.3, z); g.add(sb); } // bao cát
    g.add(at(cyl(0.12, 0.16, 0.12, '#7c6a5e', 8), 0, 2.0, 0)); // đầu đốt
    g.add(at(new THREE.Mesh(low('fl', () => new THREE.ConeGeometry(0.07, 0.2, 6)), basic('#ffb347')), 0, 2.15, 0));
    const b = g.userData.bob;
    if (b) { const band = ring(0.62, 0.04, '#ffffff'); band.rotation.x = Math.PI / 2; band.position.y = -0.85; b.add(band); for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; b.add(at(dot(0.06, i % 2 ? '#ffd34e' : '#9fd6f0'), Math.cos(a) * 0.62, -0.9, Math.sin(a) * 0.62)); } }
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; g.add(at(dot(0.05, '#e6e0d8'), Math.cos(a) * 0.22, 0.03, Math.sin(a) * 0.22)); }
  },
  fun_teddy(g) {
    for (const x of [-0.2, 0.2]) g.add(at(dot(0.06, '#f2d2b0'), x, 1.17, 0.05)); // lòng tai
    g.add(at(dot(0.035, '#2a1f1c'), 0, 0.88, 0.34)); // mũi
    const mo = ring(0.04, 0.008, '#2a1f1c', Math.PI); mo.rotation.z = Math.PI; mo.position.set(0, 0.82, 0.33); g.add(mo);
    for (const x of [-0.17, 0.17]) { const pad = dot(0.07, '#f2d2b0'); pad.scale.set(1, 1, 0.4); pad.position.set(x * 1.1, 0.12, 0.3); g.add(pad); } // gan bàn chân
    for (let i = 0; i < 5; i++) g.add(at(dot(0.012, '#8a5a3a'), 0, 0.2 + i * 0.07, 0.42 - Math.abs(i - 2) * 0.02)); // đường chỉ may bụng
    g.add(at(dot(0.04, '#ffffff'), 0, 0.7, 0.24));
    const heart = dot(0.07, '#ff6f9a'); heart.scale.set(1, 1, 0.4); heart.position.set(0.12, 0.5, 0.3); g.add(heart);
  },
  fun_balloons(g) {
    const b = g.userData.bob;
    if (b) b.children.filter((c) => c.geometry?.type === 'SphereGeometry').forEach((bl) => { const k = cone(0.035, 0.06, bl.material.color.getStyle(), 6); k.position.set(bl.position.x, bl.position.y - 0.25, bl.position.z); k.rotation.x = Math.PI; b.add(k); const hl = dot(0.04, '#ffffff'); hl.position.set(bl.position.x - 0.07, bl.position.y + 0.1, bl.position.z + 0.15); b.add(hl); });
    g.add(at(ring(0.13, 0.02, '#ff8fb1'), 0, 0.13, 0).rotateX(Math.PI / 2)); // nơ buộc
    blossom(g, 0, 0.14, 0.13, '#ffffff', 0.04, Math.PI / 2);
  },
};

/** (0.29) Gộp các khối đứng yên cùng màu thành 1 khối ⇒ đồ nhiều chi tiết vẫn nhẹ. Bỏ qua các phần chuyển động (userData). */
function mergeStill(g) {
  const u = g.userData, keep = new Set();
  for (const k of ['spin', 'bob', 'float', 'orbit', 'dangle', 'spinY', 'hover', 'wave']) if (u[k]?.isObject3D) keep.add(u[k]);
  for (const k of ['flicker', 'bubbles']) (u[k] || []).forEach((o) => keep.add(o));
  g.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(g.matrixWorld).invert();
  const buckets = new Map();
  const visit = (o) => {
    for (const c of o.children) {
      if (keep.has(c)) continue;
      if (c.isMesh && !Array.isArray(c.material) && !c.children.length) {
        let geo = c.geometry.index ? c.geometry.toNonIndexed() : c.geometry.clone();
        for (const n of Object.keys(geo.attributes)) if (n !== 'position' && n !== 'normal') geo.deleteAttribute(n);
        geo.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, c.matrixWorld));
        const k = c.material.uuid;
        if (!buckets.has(k)) buckets.set(k, { m: c.material, geos: [], src: [] });
        buckets.get(k).geos.push(geo);
        buckets.get(k).src.push(c);
      } else if (c.children.length) visit(c);
    }
  };
  visit(g);
  for (const b of buckets.values()) {
    if (b.src.length < 2) continue; // chỉ 1 khối: để nguyên
    const merged = mergeGeometries(b.geos, false);
    if (!merged) continue; // không gộp được thì giữ các khối cũ
    for (const v of b.src) v.parent.remove(v);
    const m = new THREE.Mesh(merged, b.m); m.castShadow = true;
    g.add(m);
  }
}

export function buildDecor(id) {
  const g = (BUILDERS[id] || BUILDERS.pot)();
  DETAILS[BUILDERS[id] ? id : 'pot']?.(g);
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  mergeStill(g);
  return g;
}

/** Vòi tưới tự động (đặt ở góc lô) */
export function buildSprinkler() {
  const g = new THREE.Group();
  g.add(at(cyl(0.05, 0.05, 0.9, '#aeb7c2', 8), 0, 0.45, 0));
  const head = new THREE.Group(); head.position.y = 0.95;
  head.add(sphere(0.1, '#6fbbe8', 10));
  for (let i = 0; i < 3; i++) { const n = cyl(0.025, 0.025, 0.3, '#6fbbe8', 6); n.rotation.z = Math.PI / 2; n.position.x = 0.15; const h = new THREE.Group(); h.rotation.y = (i * Math.PI * 2) / 3; h.add(n); head.add(h); }
  g.add(head);
  g.userData.spin = head;
  return g;
}

/** (0.31) Nhà ong gỗ trên cọc + ong bay quanh (userData.bees) */
export function buildHive() {
  const g = new THREE.Group();
  g.add(at(cyl(0.04, 0.05, 0.5, '#8a6446', 6), 0, 0.25, 0));
  for (let i = 0; i < 3; i++) g.add(at(rbox(0.42 - i * 0.03, 0.14, 0.32 - i * 0.02, i % 2 ? '#f2c14e' : '#e6a93a', 0.03), 0, 0.57 + i * 0.14, 0));
  g.add(at(rbox(0.5, 0.05, 0.4, '#c98a5a', 0.02), 0, 0.98, 0));
  g.add(at(rbox(0.12, 0.03, 0.02, '#5a3d2b', 0.01), 0, 0.56, 0.17));
  const bees = new THREE.Group(); bees.position.y = 0.85;
  for (let i = 0; i < 4; i++) {
    const b = new THREE.Group();
    const body = sphere(0.045, '#ffd34e', 6); body.scale.set(1.3, 1, 1); b.add(body);
    b.add(at(sphere(0.02, '#3b2a22', 5), 0.05, 0, 0));
    for (const z of [-0.03, 0.03]) { const w = sphere(0.03, '#ffffff', 5); w.scale.set(0.8, 0.3, 1); w.position.set(0, 0.04, z); b.add(w); }
    b.userData.phase = i * 1.6; b.userData.r = 0.35 + (i % 2) * 0.2;
    bees.add(b);
  }
  g.add(bees);
  g.userData.bees = bees;
  return g;
}

/** (0.31) Nhà chim nhỏ trên cọc */
export function buildBirdbox() {
  const g = new THREE.Group();
  g.add(at(cyl(0.035, 0.045, 0.9, '#8a6446', 6), 0, 0.45, 0));
  g.add(at(rbox(0.3, 0.28, 0.28, '#9fd6f0', 0.04), 0, 1.0, 0));
  const roof = cone(0.28, 0.2, '#f47a6a', 4); roof.rotation.y = Math.PI / 4; roof.position.y = 1.24; g.add(roof);
  g.add(at(sphere(0.05, '#3b2a22', 6), 0, 1.02, 0.14));
  const bird = new THREE.Group(); bird.position.set(0.12, 1.36, 0.05);
  bird.add(sphere(0.06, '#c9824a', 6)); bird.add(at(sphere(0.045, '#c9824a', 6), 0.05, 0.05, 0));
  const beak = cone(0.015, 0.04, '#f2a03d', 4); beak.rotation.z = -Math.PI / 2; beak.position.set(0.1, 0.05, 0); bird.add(beak);
  g.add(bird);
  return g;
}

/** Máy bón phân nhỏ */
export function buildFeeder() {
  const g = new THREE.Group();
  g.add(at(rbox(0.45, 0.4, 0.45, '#f6d67a', 0.08), 0, 0.2, 0));
  g.add(at(cone(0.25, 0.3, '#c9a27e', 10), 0, 0.55, 0));
  g.add(at(sphere(0.06, '#7cc27f', 8), 0.15, 0.32, 0.23));
  return g;
}
