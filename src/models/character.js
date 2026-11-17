// Nhân vật chibi: đầu to, thân nhỏ. avatar = { skin, hair, outfit, hat }
// (GĐ26) thêm tùy chọn trang phục: hairStyle, hatKind, top, trim, shoes, bag, bagColor, glasses — xem data/wardrobe.js
import * as THREE from 'three';
import { sphere, cyl, capsule, rbox, at, cone, torus } from './primitives.js';

export function buildCharacter(avatar) {
  const { skin, hair, outfit, hat } = avatar;
  const root = new THREE.Group();
  const body = new THREE.Group(); // nhún nhảy khi đi
  root.add(body);

  // chân
  const top = avatar.top || 'tee', trim = avatar.trim || '#ffffff';
  const pants = top === 'aodai' ? trim : top === 'overall' ? outfit : '#7d6a5e';
  const legL = at(capsule(0.09, 0.14, pants), -0.12, 0.17, 0);
  const legR = at(capsule(0.09, 0.14, pants), 0.12, 0.17, 0);
  body.add(legL, legR);
  if (avatar.shoes) for (const leg of [legL, legR]) { const sh = sphere(0.1, avatar.shoes, 8); sh.scale.set(1, 0.55, 1.35); sh.position.set(0, -0.15, 0.03); leg.add(sh); }
  // thân (áo màu chính; yếm / tạp dề thì áo trong màu phụ)
  const shirt = top === 'overall' || top === 'apron' ? trim : outfit;
  const torso = at(capsule(0.24, 0.18, shirt), 0, 0.52, 0);
  torso.scale.set(1, 1, 0.85);
  body.add(torso);
  if (top === 'tee') body.add(at(rbox(0.3, 0.16, 0.06, '#ffffff', 0.03), 0, 0.55, 0.2)); // túi áo
  else if (top === 'hoodie') {
    body.add(at(rbox(0.32, 0.14, 0.06, trim, 0.04), 0, 0.46, 0.2));
    const hood = torus(0.2, 0.07, outfit); hood.rotation.x = -0.9; hood.position.set(0, 0.8, -0.12); body.add(hood);
    for (const x of [-0.06, 0.06]) body.add(at(cyl(0.012, 0.012, 0.18, trim, 4), x, 0.66, 0.21));
  } else if (top === 'overall') {
    body.add(at(rbox(0.36, 0.3, 0.07, outfit, 0.04), 0, 0.5, 0.18));
    for (const x of [-0.12, 0.12]) body.add(at(rbox(0.05, 0.3, 0.04, outfit, 0.02), x, 0.7, 0.17));
    body.add(at(rbox(0.5, 0.14, 0.42, outfit, 0.06), 0, 0.33, 0));
  } else if (top === 'apron') {
    body.add(at(rbox(0.38, 0.42, 0.05, outfit, 0.05), 0, 0.44, 0.2));
    body.add(at(rbox(0.16, 0.08, 0.06, '#ffffff', 0.03), 0, 0.45, 0.23));
  } else if (top === 'sweater') {
    for (const y of [0.45, 0.58]) { const st = torus(0.235, 0.025, trim); st.rotation.x = Math.PI / 2; st.scale.set(1, 0.85, 1); st.position.y = y; body.add(st); }
  } else if (top === 'dress') {
    const skirt = cone(0.42, 0.42, outfit, 16); skirt.position.y = 0.36; body.add(skirt);
    const hem = torus(0.4, 0.03, trim); hem.rotation.x = Math.PI / 2; hem.position.y = 0.16; body.add(hem);
  } else if (top === 'aodai') {
    body.add(at(rbox(0.36, 0.5, 0.04, outfit, 0.02), 0, 0.12 + 0.1, 0.17)); // vạt trước
    body.add(at(rbox(0.36, 0.5, 0.04, outfit, 0.02), 0, 0.22, -0.17)); // vạt sau
    body.add(at(cyl(0.08, 0.09, 0.08, outfit, 10), 0, 0.82, 0)); // cổ áo
  } else if (top === 'raincoat') {
    const hemC = cone(0.36, 0.3, outfit, 14); hemC.position.y = 0.36; body.add(hemC);
    for (const y of [0.5, 0.6, 0.7]) body.add(at(sphere(0.025, trim, 6), 0, y, 0.21));
  }
  // tay
  const armL = new THREE.Group(); armL.position.set(-0.28, 0.65, 0);
  armL.add(at(capsule(0.075, 0.18, shirt), 0, -0.13, 0));
  armL.add(at(sphere(0.08, skin, 8), 0, -0.28, 0));
  const armR = new THREE.Group(); armR.position.set(0.28, 0.65, 0);
  armR.add(at(capsule(0.075, 0.18, shirt), 0, -0.13, 0));
  armR.add(at(sphere(0.08, skin, 8), 0, -0.28, 0));
  body.add(armL, armR);
  const hand = new THREE.Group(); hand.position.set(0, -0.3, 0.05);
  armR.add(hand);

  // đầu to
  const head = new THREE.Group(); head.position.y = 1.12;
  body.add(head);
  head.add(sphere(0.42, skin, 18));
  const hairCap = sphere(0.44, hair, 18);
  hairCap.scale.set(1, 0.82, 1);
  hairCap.position.set(0, 0.1, -0.06);
  head.add(hairCap);
  const bangs = sphere(0.2, hair, 10); bangs.scale.set(1.6, 0.55, 0.7); bangs.position.set(0, 0.25, 0.3);
  head.add(bangs);
  // mắt, má, miệng
  const eyeM = '#3b2a22';
  for (const x of [-0.15, 0.15]) {
    const e = at(sphere(0.06, eyeM, 10), x, -0.02, 0.37); e.scale.set(0.85, 1.2, 0.5); head.add(e);
    head.add(at(sphere(0.02, '#ffffff', 6), x + 0.02, 0.02, 0.4));
    const c = at(sphere(0.06, '#ffab9c', 8), x * 1.55, -0.12, 0.33); c.scale.set(1, 0.6, 0.4); head.add(c);
  }
  head.add(at(sphere(0.025, '#c96a5a', 6), 0, -0.14, 0.4));
  // búi tóc (tùy chọn)
  if (avatar.bun) {
    head.add(at(sphere(0.17, hair, 12), 0, 0.42, -0.18));
  }
  // (GĐ26) kiểu tóc
  const hs = avatar.hairStyle || 'short';
  if (hs === 'long') { const b = sphere(0.4, hair, 14); b.scale.set(1.08, 1.25, 0.55); b.position.set(0, -0.2, -0.24); head.add(b); }
  else if (hs === 'twin') for (const x of [-1, 1]) { head.add(at(sphere(0.15, hair, 10), x * 0.44, -0.12, -0.1)); head.add(at(sphere(0.05, '#ff8fb1', 6), x * 0.38, 0.02, -0.08)); }
  else if (hs === 'bob') { const b = sphere(0.46, hair, 16); b.scale.set(1.06, 0.72, 1.02); b.position.set(0, -0.02, -0.08); head.add(b); }
  else if (hs === 'pony') { const t = capsule(0.11, 0.3, hair); t.rotation.x = 0.5; t.position.set(0, 0.0, -0.5); head.add(t); head.add(at(sphere(0.05, '#ff8fb1', 6), 0, 0.2, -0.42)); }
  else if (hs === 'curly') for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2; head.add(at(sphere(0.13, hair, 8), Math.cos(a) * 0.36, 0.3 + Math.sin(i) * 0.04, Math.sin(a) * 0.3 - 0.05)); }
  else if (hs === 'spiky') for (let i = 0; i < 5; i++) { const c = cone(0.1, 0.24, hair, 6); c.position.set(-0.24 + i * 0.12, 0.44, -0.05); c.rotation.z = (i - 2) * -0.25; head.add(c); }
  // mũ (hat = null => không đội mũ). hatKind mặc định = mũ rơm
  if (hat) {
    const kind = avatar.hatKind || 'straw';
    const hatG = new THREE.Group(); hatG.position.y = 0.3; hatG.rotation.x = -0.12;
    if (kind === 'straw') {
      hatG.add(cyl(0.62, 0.62, 0.05, hat, 20));
      hatG.add(at(cyl(0.3, 0.36, 0.26, hat, 16), 0, 0.14, 0));
      hatG.add(at(cyl(0.365, 0.37, 0.07, '#f28da0', 16), 0, 0.06, 0));
    } else if (kind === 'cap') {
      const d = sphere(0.45, hat, 16); d.scale.set(1, 0.55, 1); d.position.y = 0.02; hatG.add(d);
      hatG.add(at(rbox(0.5, 0.04, 0.32, hat, 0.02), 0, -0.04, 0.42));
    } else if (kind === 'beanie') {
      const d = sphere(0.46, hat, 16); d.scale.set(1, 0.7, 1); hatG.add(d);
      const band = torus(0.43, 0.06, '#ffffff'); band.rotation.x = Math.PI / 2; band.position.y = -0.08; hatG.add(band);
      hatG.add(at(sphere(0.11, '#ffffff', 8), 0, 0.34, 0));
    } else if (kind === 'bow') {
      for (const x of [-1, 1]) { const w = sphere(0.16, hat, 10); w.scale.set(1.3, 0.9, 0.5); w.position.set(0.22 + x * 0.17, 0.1, 0.05); hatG.add(w); }
      hatG.add(at(sphere(0.07, hat, 8), 0.22, 0.1, 0.07));
    } else if (kind === 'flower') {
      const r = torus(0.4, 0.05, hat); r.rotation.x = Math.PI / 2; r.position.y = -0.02; hatG.add(r);
      const cols = ['#ff8fb1', '#ffd36e', '#ffffff', '#c9a2ff', '#8fd8ff'];
      for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; hatG.add(at(sphere(0.07, cols[i % 5], 6), Math.cos(a) * 0.4, 0.02, Math.sin(a) * 0.4)); }
    } else if (kind === 'bunny') {
      for (const x of [-0.15, 0.15]) { const e = capsule(0.07, 0.34, hat); e.position.set(x, 0.32, -0.05); e.rotation.z = -x; hatG.add(e); const inn = capsule(0.035, 0.26, '#ffc6d6'); inn.position.set(x, 0.33, -0.0); inn.rotation.z = -x; hatG.add(inn); }
    } else if (kind === 'crown') {
      hatG.add(at(cyl(0.24, 0.24, 0.14, hat, 10), 0, 0.12, 0));
      for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; hatG.add(at(cone(0.06, 0.14, hat, 4), Math.cos(a) * 0.22, 0.25, Math.sin(a) * 0.22)); }
      hatG.add(at(sphere(0.05, '#ff8fb1', 6), 0, 0.14, 0.24));
    } else if (kind === 'leaf') {
      hatG.add(at(cyl(0.015, 0.015, 0.2, '#5a8f4a', 4), 0, 0.18, 0));
      for (const x of [-1, 1]) { const l = sphere(0.1, hat, 8); l.scale.set(1.3, 0.35, 0.7); l.position.set(x * 0.09, 0.3, 0); l.rotation.z = x * 0.5; hatG.add(l); }
    } else if (kind === 'chef') {
      hatG.add(at(cyl(0.3, 0.3, 0.16, hat, 14), 0, 0.06, 0));
      hatG.add(at(sphere(0.34, hat, 12), 0, 0.32, 0));
    } else if (kind === 'beret') {
      const b = cyl(0.42, 0.38, 0.12, hat, 16); b.position.set(0.05, 0.05, 0); b.rotation.z = -0.25; hatG.add(b);
      hatG.add(at(cyl(0.02, 0.02, 0.08, hat, 4), 0.02, 0.15, 0));
    }
    head.add(hatG);
  }
  // kính
  if (avatar.glasses) {
    const gk = avatar.glasses;
    for (const x of [-0.15, 0.15]) {
      if (gk === 'round') { const r = torus(0.085, 0.015, '#3b2a22'); r.position.set(x, -0.02, 0.39); head.add(r); }
      else if (gk === 'sun') head.add(at(rbox(0.2, 0.12, 0.03, '#2a2a33', 0.04), x, -0.01, 0.4));
      else if (gk === 'star') { const st = cone(0.1, 0.03, '#ffd36e', 5); st.rotation.x = Math.PI / 2; st.position.set(x, -0.01, 0.41); head.add(st); }
      else if (gk === 'heart') for (const dx of [-0.035, 0.035]) head.add(at(sphere(0.055, '#ff6f9a', 8), x + dx, 0.0, 0.4));
    }
    if (gk !== 'heart') head.add(at(rbox(0.1, 0.02, 0.02, '#3b2a22', 0.01), 0, 0.0, 0.41));
  }
  // túi
  if (avatar.bag) {
    const bc = avatar.bagColor || '#f47a93';
    if (avatar.bag === 'backpack') { body.add(at(rbox(0.34, 0.36, 0.18, bc, 0.08), 0, 0.56, -0.26)); body.add(at(rbox(0.22, 0.12, 0.05, '#ffffff', 0.03), 0, 0.48, -0.36)); }
    else if (avatar.bag === 'basket') { const b = cyl(0.12, 0.09, 0.12, bc, 10); b.position.set(0, -0.32, 0.06); armL.add(b); for (let i = 0; i < 3; i++) armL.add(at(sphere(0.045, ['#ff8fb1', '#ffd36e', '#ffffff'][i], 6), -0.04 + i * 0.04, -0.24, 0.06)); }
    else if (avatar.bag === 'flowerbag') { const b = sphere(0.1, bc, 10); b.position.set(0.32, 0.36, 0.06); body.add(b); for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; body.add(at(sphere(0.045, '#ffffff', 6), 0.32 + Math.cos(a) * 0.08, 0.36 + Math.sin(a) * 0.08, 0.12)); } }
  }

  root.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return { root, body, head, armL, armR, legL, legR, hand };
}

/** Dụng cụ cầm tay */
export function buildTool(kind) {
  const g = new THREE.Group();
  if (kind === 'shovel') {
    g.add(at(cyl(0.025, 0.025, 0.6, '#b98563', 6), 0, -0.1, 0));
    g.add(at(rbox(0.18, 0.22, 0.04, '#aeb7c2', 0.04), 0, -0.45, 0));
  } else if (kind === 'water') {
    g.add(at(cyl(0.13, 0.15, 0.24, '#7fc3e6', 12), 0, -0.1, 0.12));
    const spout = cyl(0.025, 0.04, 0.3, '#7fc3e6', 6); spout.rotation.x = 1.0; spout.position.set(0, -0.05, 0.35);
    g.add(spout);
  } else if (kind === 'fertilize') {
    const bag = sphere(0.14, '#c9a27e', 10); bag.scale.set(1, 1.2, 0.8); bag.position.set(0, -0.1, 0.1);
    g.add(bag);
  } else if (kind === 'plant') {
    g.add(at(sphere(0.08, '#f3e1b5', 8), 0, -0.05, 0.05));
  } else if (kind === 'harvest') {
    const basket = cyl(0.16, 0.12, 0.16, '#d9a67e', 12); basket.position.set(0, -0.1, 0.1);
    g.add(basket);
  }
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}
