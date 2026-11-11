// Mô hình 3D đồ trang trí & máy móc (khối hình đơn giản, màu pastel)
import * as THREE from 'three';
import { rbox, sphere, cyl, cone, at, torus, capsule } from './primitives.js';
import { basic } from './materials.js';
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

export function buildDecor(id) {
  const g = (BUILDERS[id] || BUILDERS.pot)();
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
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

/** Máy bón phân nhỏ */
export function buildFeeder() {
  const g = new THREE.Group();
  g.add(at(rbox(0.45, 0.4, 0.45, '#f6d67a', 0.08), 0, 0.2, 0));
  g.add(at(cone(0.25, 0.3, '#c9a27e', 10), 0, 0.55, 0));
  g.add(at(sphere(0.06, '#7cc27f', 8), 0.15, 0.32, 0.23));
  return g;
}
