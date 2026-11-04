// 🍀 Mô hình 5 Cây Vận May (GĐ15) — mỗi cây có hiệu ứng động riêng.
// buildLuckHead() dựng bông hoa và gắn root.userData.fx; animateLuckFx() chạy mỗi khung hình (farmView.update).
// Vật liệu dùng riêng từng cây (để đổi màu/độ sáng) ⇒ khi bỏ cây phải gọi disposeLuckFx().
import * as THREE from 'three';
import { uniqueMat } from './materials.js';

const FACE = new THREE.Vector3(1, 1.4, 1);
const G = {
  oct: new THREE.OctahedronGeometry(1, 0),
  ico: new THREE.IcosahedronGeometry(1, 0),
  ball: new THREE.SphereGeometry(1, 10, 8),
  tiny: new THREE.SphereGeometry(1, 6, 4),
  cone: new THREE.ConeGeometry(1, 1, 10, 1, true),
};

function m(geo, material, sx, sy = sx, sz = sx) {
  const o = new THREE.Mesh(geo, material);
  o.scale.set(sx, sy, sz);
  o.castShadow = true;
  return o;
}
// quầng sáng mềm (ban đêm sáng hơn) — dùng chung 1 ảnh, mỗi cây 1 vật liệu riêng để chỉnh độ sáng
let haloTex = null;
function halo(color, size) {
  if (!haloTex) {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.35, 'rgba(255,255,255,0.45)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g;
    x.fillRect(0, 0, 64, 64);
    haloTex = new THREE.CanvasTexture(c);
  }
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex, color, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  sp.scale.setScalar(size);
  return sp;
}

const glowMat = (color, opacity = 1) => new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity, depthWrite: opacity >= 1 });

/** Dựng bông hoa của cây Vận May vào "head". Trả về thông tin hiệu ứng (gắn vào root.userData.fx) */
export function buildLuckHead(model, head, C) {
  const fx = { kind: model, parts: [], mats: [] };
  const keep = (mat) => { fx.mats.push(mat); return mat; };
  const face = new THREE.Group();
  face.lookAt(FACE);
  head.add(face);

  if (model === 'crystal') {
    // Hoa Pha Lê: cánh tinh thể trong suốt + các đốm sáng lấp lánh bay quanh
    const petal = keep(uniqueMat(C.petal, { transparent: true, opacity: 0.78, emissive: new THREE.Color('#9fe6ff'), emissiveIntensity: 0.35 }));
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const p = m(G.oct, petal, 0.07, 0.17, 0.05);
      p.position.set(Math.cos(a) * 0.15, Math.sin(a) * 0.15, 0);
      p.rotation.z = a - Math.PI / 2;
      face.add(p);
    }
    const core = m(G.ico, keep(glowMat('#ffffff')), 0.07);
    face.add(core);
    fx.core = core;
    fx.halo = halo('#9fe6ff', 0.6);
    head.add(fx.halo);
    fx.mats.push(fx.halo.material);
    const ring = new THREE.Group();
    const spark = keep(glowMat('#ffffff', 0.95));
    for (let i = 0; i < 6; i++) {
      const s = m(G.oct, spark, 0.035);
      const a = (i / 6) * Math.PI * 2;
      s.position.set(Math.cos(a) * 0.32, 0.05 + (i % 3) * 0.1, Math.sin(a) * 0.32);
      s.castShadow = false;
      s.userData.phase = i * 1.3;
      ring.add(s);
      fx.parts.push(s);
    }
    head.add(ring);
    fx.ring = ring;
  } else if (model === 'firefly') {
    // Hoa Đom Đóm: chuông hoa ôm 1 bóng sáng, ban đêm sáng rực + đom đóm bay quanh
    const cup = m(G.cone, keep(uniqueMat(C.petal, { side: THREE.DoubleSide })), 0.17, 0.2, 0.17);
    cup.rotation.x = Math.PI;
    cup.position.y = 0.1;
    head.add(cup);
    const bulbMat = keep(glowMat('#fff6b0'));
    const bulb = m(G.ball, bulbMat, 0.1);
    bulb.position.y = 0.06;
    head.add(bulb);
    fx.halo = halo('#fff27a', 0.9);
    fx.halo.position.y = 0.06;
    head.add(fx.halo);
    fx.mats.push(fx.halo.material);
    fx.bulbMat = bulbMat;
    const bugMat = keep(glowMat('#d9ff7a', 0.9));
    fx.bugMat = bugMat;
    for (let i = 0; i < 4; i++) {
      const b = m(G.tiny, bugMat, 0.028);
      b.castShadow = false;
      b.userData.phase = i * 1.6;
      b.userData.r = 0.26 + (i % 2) * 0.1;
      head.add(b);
      fx.parts.push(b);
    }
  } else if (model === 'prism') {
    // Hoa Cầu Vồng: 10 cánh, mỗi cánh đổi màu liên tục theo cầu vồng
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const mat = keep(uniqueMat(C.petal));
      const p = m(G.ball, mat, 0.065, 0.13, 0.025);
      p.position.set(Math.cos(a) * 0.15, Math.sin(a) * 0.15, 0);
      p.rotation.z = a - Math.PI / 2;
      face.add(p);
      fx.parts.push(p);
    }
    const c = m(G.ball, keep(uniqueMat(C.center || '#ffe066', { emissive: new THREE.Color('#ffd34e'), emissiveIntensity: 0.3 })), 0.075, 0.075, 0.04);
    face.add(c);
  } else if (model === 'wisp') {
    // Hoa Lửa Ma: đài hoa tím đỡ 3 ngọn lửa xanh lập lòe + 1 đốm ma bay lơ lửng
    const cup = m(G.cone, keep(uniqueMat(C.petalDark, { side: THREE.DoubleSide })), 0.15, 0.12, 0.15);
    cup.rotation.x = Math.PI;
    cup.position.y = 0.05;
    head.add(cup);
    const flameMat = keep(glowMat(C.petal, 0.85));
    const inner = keep(glowMat('#e6f0ff', 0.9));
    [[0, 0, 1], [0.07, 0.04, 0.7], [-0.06, -0.05, 0.75]].forEach(([x, z, k], i) => {
      const f = new THREE.Group();
      f.position.set(x, 0.1, z);
      const outer = m(G.ball, flameMat, 0.07 * k, 0.16 * k, 0.07 * k);
      outer.position.y = 0.09 * k;
      const core = m(G.ball, inner, 0.035 * k, 0.08 * k, 0.035 * k);
      core.position.y = 0.06 * k;
      outer.castShadow = core.castShadow = false;
      f.add(outer, core);
      f.userData.phase = i * 2.1;
      head.add(f);
      fx.parts.push(f);
    });
    fx.halo = halo('#7f8cff', 0.75);
    fx.halo.position.y = 0.18;
    head.add(fx.halo);
    fx.mats.push(fx.halo.material);
    const orb = m(G.ball, keep(glowMat('#b9c8ff', 0.8)), 0.04);
    orb.castShadow = false;
    head.add(orb);
    fx.orb = orb;
  } else if (model === 'snowbell') {
    // Hoa Tuyết: bông 6 cánh trắng hình sao, bông tuyết nhỏ rơi quanh cây
    const petal = keep(uniqueMat(C.petal, { emissive: new THREE.Color('#dff0ff'), emissiveIntensity: 0.25 }));
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const p = m(G.oct, petal, 0.06, 0.16, 0.025);
      p.position.set(Math.cos(a) * 0.13, Math.sin(a) * 0.13, 0);
      p.rotation.z = a - Math.PI / 2;
      face.add(p);
    }
    face.add(m(G.ball, keep(uniqueMat(C.center || '#bfe0ff')), 0.06, 0.06, 0.03));
    const flake = keep(glowMat('#ffffff', 0.95));
    for (let i = 0; i < 7; i++) {
      const s = m(G.oct, flake, 0.025);
      s.castShadow = false;
      s.userData.phase = i / 7;
      s.userData.a = i * 2.4;
      head.add(s);
      fx.parts.push(s);
    }
  }
  return fx;
}

const tmp = new THREE.Color();

/** Chạy hiệu ứng mỗi khung hình. t: thời gian (giây), night: 0 ngày → 1 đêm */
export function animateLuckFx(fx, t, night = 0) {
  if (!fx) return;
  switch (fx.kind) {
    case 'crystal':
      if (fx.halo) fx.halo.material.opacity = (0.15 + night * 0.5) * (0.8 + Math.sin(t * 3) * 0.2);
      if (fx.ring) fx.ring.rotation.y = t * 0.8;
      fx.parts.forEach((s) => { const k = Math.max(0, Math.sin(t * 3 + s.userData.phase)); s.scale.setScalar(0.012 + k * 0.035); s.rotation.y = t * 2; });
      if (fx.core) fx.core.rotation.y = t * 1.5;
      break;
    case 'firefly': {
      const pulse = 0.75 + Math.sin(t * 2.2) * 0.25;
      const glow = 0.45 + night * 0.55;
      fx.bulbMat.color.setRGB(1 * glow * pulse + 0.25, 0.96 * glow * pulse + 0.2, 0.55 * glow * pulse);
      fx.bugMat.opacity = 0.35 + night * 0.6;
      if (fx.halo) { fx.halo.material.opacity = (0.12 + night * 0.85) * pulse; fx.halo.scale.setScalar(0.8 + night * 0.5 + pulse * 0.1); }
      fx.parts.forEach((b) => {
        const a = t * 0.9 + b.userData.phase;
        b.position.set(Math.cos(a) * b.userData.r, 0.1 + Math.sin(t * 1.7 + b.userData.phase) * 0.12, Math.sin(a * 1.3) * b.userData.r);
        b.scale.setScalar(0.022 + Math.max(0, Math.sin(t * 5 + b.userData.phase * 3)) * 0.016);
      });
      break;
    }
    case 'prism':
      fx.parts.forEach((p, i) => { tmp.setHSL((t * 0.12 + i / 10) % 1, 0.75, 0.7); p.material.color.copy(tmp); });
      break;
    case 'wisp':
      if (fx.halo) fx.halo.material.opacity = (0.15 + night * 0.6) * (0.85 + Math.sin(t * 9) * 0.15);
      fx.parts.forEach((f) => { const k = 1 + Math.sin(t * 11 + f.userData.phase) * 0.12 + Math.sin(t * 6.3 + f.userData.phase) * 0.08; f.scale.set(1 / Math.sqrt(k), k, 1 / Math.sqrt(k)); f.rotation.y = Math.sin(t * 2 + f.userData.phase) * 0.3; });
      if (fx.orb) fx.orb.position.set(Math.cos(t * 0.7) * 0.25, 0.42 + Math.sin(t * 1.9) * 0.08, Math.sin(t * 0.7) * 0.25);
      break;
    case 'snowbell':
      fx.parts.forEach((s) => {
        const k = (t * 0.25 + s.userData.phase) % 1;
        const a = s.userData.a + k * 2;
        s.position.set(Math.cos(a) * (0.18 + k * 0.12), 0.45 - k * 1.1, Math.sin(a) * (0.18 + k * 0.12));
        s.rotation.set(t, t * 1.3, 0);
        s.visible = k < 0.95;
      });
      break;
    default:
  }
}

export function disposeLuckFx(fx) {
  if (fx) fx.mats.forEach((mm) => mm.dispose());
}
