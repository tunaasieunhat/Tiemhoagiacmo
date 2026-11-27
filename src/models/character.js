// Nhân vật chibi: đầu to, thân nhỏ. avatar = { skin, hair, outfit, hat }
// (GĐ26) thêm tùy chọn trang phục: hairStyle, hatKind, top, trim, shoes, bag, bagColor, glasses — xem data/wardrobe.js
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { sphere, cyl, capsule, rbox, at, cone, torus } from './primitives.js';
import { mat } from './materials.js';

// (0.29) Nhân vật chi tiết hơn nhưng không nặng hơn: các khối cùng màu trong mỗi bộ phận chuyển động (đầu, tay, chân, thân)
// được gộp lại thành 1 khối ⇒ mỗi nhân vật chỉ còn khoảng 20–30 lần vẽ dù có nhiều chi tiết nhỏ.
function compact(nodes, keep = []) {
  const set = new Set([...nodes, ...keep]);
  for (const n of nodes) {
    n.updateMatrixWorld(true);
    const inv = new THREE.Matrix4().copy(n.matrixWorld).invert();
    const buckets = new Map();
    const visit = (o) => {
      for (const c of o.children) {
        if (set.has(c)) continue;
        if (c.isMesh && !Array.isArray(c.material)) {
          let g = c.geometry.index ? c.geometry.toNonIndexed() : c.geometry.clone();
          for (const name of Object.keys(g.attributes)) if (name !== 'position' && name !== 'normal') g.deleteAttribute(name);
          g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, c.matrixWorld));
          const k = c.material.uuid;
          if (!buckets.has(k)) buckets.set(k, { m: c.material, geos: [], src: [] });
          buckets.get(k).geos.push(g);
          buckets.get(k).src.push(c);
        }
        if (c.children.length) visit(c);
      }
    };
    visit(n);
    for (const b of buckets.values()) {
      if (b.src.length < 2) continue;
      const merged = mergeGeometries(b.geos, false);
      if (!merged) continue; // không gộp được thì giữ nguyên
      for (const v of b.src) { const kids = [...v.children]; v.parent.remove(v); kids.forEach((k) => n.add(k)); }
      const m = new THREE.Mesh(merged, b.m);
      m.castShadow = true;
      n.add(m);
    }
    const prune = (o) => { [...o.children].forEach(prune); if (o !== n && !set.has(o) && o.type === 'Group' && !o.children.length) o.parent?.remove(o); };
    prune(n);
  }
}
const lens = () => mat('#bfe6ff', { transparent: true, opacity: 0.45 });
// (0.29) khối nhỏ ít mặt cho chi tiết li ti (đỡ nặng): vòng, hộp, chấm tròn
const lowCache = new Map();
const low = (key, make) => { if (!lowCache.has(key)) lowCache.set(key, make()); return lowCache.get(key); };
const ring = (r, tube, color) => { const m = new THREE.Mesh(low(`r${r}|${tube}`, () => new THREE.TorusGeometry(r, tube, 4, 14)), mat(color)); return m; };
const bx = (w, h, d, color) => new THREE.Mesh(low(`b${w}|${h}|${d}`, () => new THREE.BoxGeometry(w, h, d)), mat(color));
const dot = (r, color) => new THREE.Mesh(low(`d${r}`, () => new THREE.SphereGeometry(r, 7, 5)), mat(color));

export function buildCharacter(avatar) {
  const { skin, hair, outfit, hat } = avatar;
  const root = new THREE.Group();
  const body = new THREE.Group(); // nhún nhảy khi đi
  root.add(body);
  const dark = (c, k = 0.78) => `#${new THREE.Color(c).multiplyScalar(k).getHexString()}`;

  // ----- chân + giày (0.29: luôn có giày, có đế + mũi giày) -----
  const top = avatar.top || 'tee', trim = avatar.trim || '#ffffff';
  const pants = top === 'aodai' ? trim : top === 'overall' ? outfit : '#7d6a5e';
  const legL = at(capsule(0.09, 0.14, pants), -0.12, 0.17, 0);
  const legR = at(capsule(0.09, 0.14, pants), 0.12, 0.17, 0);
  body.add(legL, legR);
  const shoe = avatar.shoes || '#8a5a44';
  for (const leg of [legL, legR]) {
    const sh = sphere(0.1, shoe, 10); sh.scale.set(1, 0.55, 1.35); sh.position.set(0, -0.15, 0.03); leg.add(sh);
    const sole = cyl(0.1, 0.1, 0.025, '#f4ece4', 10); sole.scale.set(1, 1, 1.38); sole.position.set(0, -0.195, 0.03); leg.add(sole);
    leg.add(at(dot(0.022, '#ffffff'), 0, -0.11, 0.15)); // nút / dây giày
    const cuff = ring(0.088, 0.018, dark(pants, 0.85)); cuff.rotation.x = Math.PI / 2; cuff.position.y = -0.06; leg.add(cuff); // gấu quần
  }
  // ----- thân (áo màu chính; yếm / tạp dề thì áo trong màu phụ) -----
  const shirt = top === 'overall' || top === 'apron' ? trim : outfit;
  const torso = at(capsule(0.24, 0.18, shirt), 0, 0.52, 0);
  torso.scale.set(1, 1, 0.85);
  body.add(torso);
  // cổ + cổ áo
  body.add(at(cyl(0.09, 0.1, 0.08, skin, 10), 0, 0.84, 0));
  if (top !== 'aodai' && top !== 'hoodie') {
    for (const x of [-1, 1]) { const c = bx(0.13, 0.04, 0.08, top === 'tee' ? trim : dark(shirt, 0.92)); c.position.set(x * 0.07, 0.8, 0.13); c.rotation.set(-0.4, 0, x * 0.5); body.add(c); }
  }
  // thắt lưng (áo phông, áo len)
  if (top === 'tee' || top === 'sweater') {
    const belt = ring(0.215, 0.025, '#8a5a44'); belt.rotation.x = Math.PI / 2; belt.scale.set(1, 0.85, 1); belt.position.y = 0.33; body.add(belt);
    body.add(at(bx(0.07, 0.05, 0.03, '#ffd36e'), 0, 0.33, 0.19));
  }
  if (top === 'tee') {
    body.add(at(bx(0.13, 0.12, 0.05, '#ffffff'), 0.09, 0.57, 0.2)); // túi áo
    body.add(at(dot(0.025, '#ff8fb1'), 0.09, 0.6, 0.23)); // hoa thêu trên túi
    for (const y of [0.62, 0.5]) body.add(at(dot(0.016, trim), -0.04, y, 0.215)); // nút áo
  } else if (top === 'hoodie') {
    body.add(at(rbox(0.32, 0.14, 0.06, trim, 0.04), 0, 0.46, 0.2));
    const hood = torus(0.2, 0.07, outfit); hood.rotation.x = -0.9; hood.position.set(0, 0.8, -0.12); body.add(hood);
    for (const x of [-0.06, 0.06]) { body.add(at(cyl(0.012, 0.012, 0.18, trim, 4), x, 0.66, 0.21)); body.add(at(dot(0.02, trim), x, 0.56, 0.21)); }
    const rib = ring(0.215, 0.03, dark(outfit)); rib.rotation.x = Math.PI / 2; rib.scale.set(1, 0.85, 1); rib.position.y = 0.33; body.add(rib);
  } else if (top === 'overall') {
    body.add(at(rbox(0.36, 0.3, 0.07, outfit, 0.04), 0, 0.5, 0.18));
    for (const x of [-0.12, 0.12]) { body.add(at(rbox(0.05, 0.3, 0.04, outfit, 0.02), x, 0.7, 0.17)); body.add(at(dot(0.025, '#ffd36e'), x, 0.62, 0.21)); }
    body.add(at(rbox(0.5, 0.14, 0.42, outfit, 0.06), 0, 0.33, 0));
    body.add(at(bx(0.14, 0.1, 0.03, dark(outfit)), 0, 0.5, 0.22)); // túi yếm
  } else if (top === 'apron') {
    body.add(at(rbox(0.38, 0.42, 0.05, outfit, 0.05), 0, 0.44, 0.2));
    body.add(at(bx(0.16, 0.08, 0.06, '#ffffff'), 0, 0.45, 0.23));
    body.add(at(dot(0.03, '#ff8fb1'), 0.1, 0.58, 0.23));
    for (const x of [-1, 1]) { const tie = bx(0.1, 0.03, 0.04, outfit); tie.position.set(x * 0.08, 0.4, -0.2); tie.rotation.z = x * 0.5; body.add(tie); } // nơ sau lưng
  } else if (top === 'sweater') {
    for (const y of [0.45, 0.58]) { const st = ring(0.235, 0.025, trim); st.rotation.x = Math.PI / 2; st.scale.set(1, 0.85, 1); st.position.y = y; body.add(st); }
    for (let i = 0; i < 3; i++) body.add(at(dot(0.022, trim), -0.08 + i * 0.08, 0.515, 0.205)); // họa tiết
  } else if (top === 'dress') {
    const skirt = cone(0.42, 0.42, outfit, 16); skirt.position.y = 0.36; body.add(skirt);
    const hem = ring(0.4, 0.03, trim); hem.rotation.x = Math.PI / 2; hem.position.y = 0.16; body.add(hem);
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; body.add(at(dot(0.025, trim), Math.cos(a) * 0.3, 0.27, Math.sin(a) * 0.3)); } // chấm bi
    body.add(at(sphere(0.045, trim, 8), 0, 0.68, 0.19)); // nơ cổ
  } else if (top === 'aodai') {
    body.add(at(rbox(0.36, 0.5, 0.04, outfit, 0.02), 0, 0.12 + 0.1, 0.17)); // vạt trước
    body.add(at(rbox(0.36, 0.5, 0.04, outfit, 0.02), 0, 0.22, -0.17)); // vạt sau
    body.add(at(cyl(0.08, 0.09, 0.08, outfit, 10), 0, 0.82, 0)); // cổ áo
    for (let i = 0; i < 3; i++) body.add(at(dot(0.018, trim), 0.1 - i * 0.035, 0.74 - i * 0.06, 0.2)); // hàng nút chéo
    body.add(at(dot(0.04, '#ffd36e'), -0.08, 0.3, 0.2)); // hoa văn
  } else if (top === 'raincoat') {
    const hemC = cone(0.36, 0.3, outfit, 14); hemC.position.y = 0.36; body.add(hemC);
    for (const y of [0.5, 0.6, 0.7]) body.add(at(dot(0.025, trim), 0, y, 0.21));
    for (const x of [-1, 1]) body.add(at(bx(0.1, 0.06, 0.04, dark(outfit)), x * 0.12, 0.44, 0.19)); // túi áo mưa
  }
  // ----- tay (0.29: cổ tay áo + ngón cái) -----
  const mkArm = (x) => {
    const arm = new THREE.Group(); arm.position.set(x, 0.65, 0);
    arm.add(at(capsule(0.075, 0.18, shirt), 0, -0.13, 0));
    const cuffA = ring(0.072, 0.02, top === 'tee' ? trim : dark(shirt, 0.88)); cuffA.rotation.x = Math.PI / 2; cuffA.position.y = -0.22; arm.add(cuffA);
    arm.add(at(sphere(0.08, skin, 10), 0, -0.28, 0));
    arm.add(at(dot(0.032, skin), x > 0 ? -0.05 : 0.05, -0.26, 0.05)); // ngón cái
    return arm;
  };
  const armL = mkArm(-0.28), armR = mkArm(0.28);
  body.add(armL, armR);
  const hand = new THREE.Group(); hand.position.set(0, -0.3, 0.05);
  armR.add(hand);

  // ----- đầu to -----
  const head = new THREE.Group(); head.position.y = 1.12;
  body.add(head);
  head.add(sphere(0.42, skin, 18));
  for (const x of [-1, 1]) { const ear = sphere(0.075, skin, 8); ear.scale.set(0.6, 1, 0.8); ear.position.set(x * 0.41, -0.04, 0); head.add(ear); } // tai
  const hairCap = sphere(0.44, hair, 18);
  hairCap.scale.set(1, 0.82, 1);
  hairCap.position.set(0, 0.1, -0.06);
  head.add(hairCap);
  const bangs = sphere(0.2, hair, 10); bangs.scale.set(1.6, 0.55, 0.7); bangs.position.set(0, 0.25, 0.3);
  head.add(bangs);
  // (0.29) lọn tóc mái + tóc mai hai bên + vài sợi dựng
  for (const [x, rz] of [[-0.2, 0.5], [0.0, 0], [0.2, -0.5]]) { const lk = sphere(0.09, hair, 8); lk.scale.set(0.9, 1.3, 0.6); lk.position.set(x, 0.2, 0.34); lk.rotation.z = rz; head.add(lk); }
  for (const x of [-1, 1]) { const sb = capsule(0.055, 0.14, hair); sb.position.set(x * 0.38, -0.02, 0.12); sb.rotation.z = x * 0.15; head.add(sb); }
  const ahoge = cone(0.035, 0.16, hair, 5); ahoge.position.set(0.05, 0.5, 0.02); ahoge.rotation.z = -0.5; head.add(ahoge);
  // mắt (lòng đen + 2 đốm sáng + mi), lông mày, má, mũi, miệng cười
  const eyeM = '#3b2a22';
  for (const x of [-0.15, 0.15]) {
    const e = at(sphere(0.06, eyeM, 12), x, -0.02, 0.37); e.scale.set(0.85, 1.2, 0.5); head.add(e);
    const iris = at(sphere(0.035, '#6b4a3a', 8), x, -0.04, 0.395); iris.scale.set(1, 1.1, 0.4); head.add(iris);
    head.add(at(dot(0.022, '#ffffff'), x + 0.022, 0.025, 0.405));
    head.add(at(dot(0.011, '#ffffff'), x - 0.018, -0.05, 0.405));
    const brow = capsule(0.013, 0.07, dark(hair, 0.8)); brow.rotation.z = Math.PI / 2 + Math.sign(x) * 0.12; brow.position.set(x, 0.12, 0.38); head.add(brow);
    const c = at(sphere(0.06, '#ffab9c', 8), x * 1.55, -0.12, 0.33); c.scale.set(1, 0.6, 0.4); head.add(c);
  }
  const nose = dot(0.022, dark(skin, 0.92)); nose.position.set(0, -0.08, 0.415); head.add(nose);
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.011, 5, 10, Math.PI), mat('#c96a5a'));
  smile.rotation.z = Math.PI; smile.position.set(0, -0.14, 0.395); head.add(smile);
  // búi tóc (tùy chọn) — có trâm cài
  if (avatar.bun) {
    head.add(at(sphere(0.17, hair, 12), 0, 0.42, -0.18));
    const pin = cyl(0.012, 0.012, 0.36, '#c9a27e', 5); pin.rotation.z = 1.2; pin.position.set(0, 0.45, -0.2); head.add(pin);
    head.add(at(dot(0.035, '#ff8fb1'), 0.17, 0.52, -0.2));
  }
  // (GĐ26) kiểu tóc
  const hs = avatar.hairStyle || 'short';
  if (hs === 'long') {
    const b = sphere(0.4, hair, 14); b.scale.set(1.08, 1.25, 0.55); b.position.set(0, -0.2, -0.24); head.add(b);
    for (const x of [-1, 1]) { const s2 = capsule(0.07, 0.28, hair); s2.position.set(x * 0.36, -0.3, -0.04); head.add(s2); }
  } else if (hs === 'twin') for (const x of [-1, 1]) {
    head.add(at(sphere(0.15, hair, 10), x * 0.44, -0.12, -0.1)); head.add(at(sphere(0.11, hair, 8), x * 0.48, -0.3, -0.12));
    const tie = ring(0.06, 0.02, '#ff8fb1'); tie.position.set(x * 0.4, 0.02, -0.08); tie.rotation.y = Math.PI / 2; head.add(tie);
  } else if (hs === 'bob') { const b = sphere(0.46, hair, 16); b.scale.set(1.06, 0.72, 1.02); b.position.set(0, -0.02, -0.08); head.add(b); const clip = bx(0.1, 0.03, 0.03, '#ffd36e'); clip.position.set(0.24, 0.22, 0.3); clip.rotation.z = -0.4; head.add(clip); }
  else if (hs === 'pony') {
    const t = capsule(0.11, 0.3, hair); t.rotation.x = 0.5; t.position.set(0, 0.0, -0.5); head.add(t);
    const tip = cone(0.1, 0.18, hair, 8); tip.rotation.x = Math.PI + 0.5; tip.position.set(0, -0.2, -0.62); head.add(tip);
    const tie = ring(0.07, 0.025, '#ff8fb1'); tie.rotation.x = 0.5 + Math.PI / 2; tie.position.set(0, 0.16, -0.43); head.add(tie);
  } else if (hs === 'curly') for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; head.add(at(sphere(0.12, hair, 8), Math.cos(a) * 0.37, 0.28 + Math.sin(i * 1.7) * 0.06, Math.sin(a) * 0.32 - 0.05)); }
  else if (hs === 'spiky') for (let i = 0; i < 7; i++) { const c = cone(0.09, 0.26, hair, 6); c.position.set(-0.27 + i * 0.09, 0.42 + (i % 2) * 0.04, -0.05 - (i % 2) * 0.1); c.rotation.z = (i - 3) * -0.2; head.add(c); }
  // ----- mũ (hat = null => không đội mũ). hatKind mặc định = mũ rơm -----
  if (hat) {
    const kind = avatar.hatKind || 'straw';
    const hatG = new THREE.Group(); hatG.position.y = 0.3; hatG.rotation.x = -0.12;
    const hd = dark(hat, 0.85);
    if (kind === 'straw') {
      hatG.add(cyl(0.62, 0.62, 0.05, hat, 24));
      const rim = ring(0.62, 0.03, hd); rim.rotation.x = Math.PI / 2; hatG.add(rim); // mép vành
      for (const r of [0.45, 0.53]) { const w = torus(r, 0.012, hd); w.rotation.x = Math.PI / 2; w.position.y = 0.03; hatG.add(w); } // vân đan rơm
      hatG.add(at(cyl(0.3, 0.36, 0.26, hat, 18), 0, 0.14, 0));
      const tw = ring(0.3, 0.012, hd); tw.rotation.x = Math.PI / 2; tw.position.y = 0.2; hatG.add(tw);
      hatG.add(at(cyl(0.365, 0.37, 0.07, '#f28da0', 18), 0, 0.06, 0));
      // bông hoa gài dải mũ
      for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; hatG.add(at(dot(0.045, '#ffffff'), 0.25 + Math.cos(a) * 0.05, 0.08 + Math.sin(a) * 0.05, 0.27)); }
      hatG.add(at(dot(0.03, '#ffd36e'), 0.25, 0.08, 0.3));
    } else if (kind === 'cap') {
      const d = sphere(0.45, hat, 18); d.scale.set(1, 0.55, 1); d.position.y = 0.02; hatG.add(d);
      const brim = cyl(0.27, 0.27, 0.04, hat, 16); brim.scale.set(1, 1, 0.75); brim.position.set(0, -0.04, 0.4); hatG.add(brim);
      for (let i = 0; i < 3; i++) { const sm = ring(0.43, 0.008, hd); sm.rotation.y = (i / 3) * Math.PI; sm.scale.set(1, 0.57, 1); sm.position.y = 0.02; hatG.add(sm); } // đường may
      hatG.add(at(sphere(0.05, hd, 8), 0, 0.27, 0)); // nút đỉnh
      for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; hatG.add(at(dot(0.03, '#ffffff'), Math.cos(a) * 0.045, 0.12 + Math.sin(a) * 0.045, 0.4)); } // logo hoa
      hatG.add(at(dot(0.022, '#ffd36e'), 0, 0.12, 0.42));
    } else if (kind === 'beanie') {
      const d = sphere(0.46, hat, 18); d.scale.set(1, 0.7, 1); hatG.add(d);
      const band = torus(0.43, 0.06, '#ffffff'); band.rotation.x = Math.PI / 2; band.position.y = -0.08; hatG.add(band);
      for (let i = 0; i < 4; i++) { const st = torus(0.42 - i * 0.05, 0.012, hd); st.rotation.x = Math.PI / 2; st.position.y = 0.05 + i * 0.07; hatG.add(st); } // sọc len
      hatG.add(at(sphere(0.11, '#ffffff', 8), 0, 0.34, 0));
      for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; hatG.add(at(dot(0.05, '#ffffff'), Math.cos(a) * 0.08, 0.36 + (i % 2) * 0.05, Math.sin(a) * 0.08)); } // quả bông xù
    } else if (kind === 'bow') {
      for (const x of [-1, 1]) {
        const w = sphere(0.16, hat, 10); w.scale.set(1.3, 0.9, 0.5); w.position.set(0.22 + x * 0.17, 0.1, 0.05); hatG.add(w);
        const fold = ring(0.07, 0.015, hd); fold.position.set(0.22 + x * 0.17, 0.1, 0.12); fold.scale.set(1.4, 0.8, 1); hatG.add(fold);
        const tail = bx(0.06, 0.16, 0.02, hat); tail.position.set(0.22 + x * 0.06, -0.03, 0.08); tail.rotation.z = x * 0.35; hatG.add(tail);
      }
      hatG.add(at(sphere(0.07, hat, 8), 0.22, 0.1, 0.07));
      hatG.add(at(dot(0.03, '#ffffff'), 0.22, 0.1, 0.13));
    } else if (kind === 'flower') {
      const r = torus(0.4, 0.04, '#7cc27f'); r.rotation.x = Math.PI / 2; r.position.y = -0.02; hatG.add(r);
      const cols = ['#ff8fb1', '#ffd36e', '#ffffff', '#c9a2ff', '#8fd8ff'];
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2, cx = Math.cos(a) * 0.4, cz = Math.sin(a) * 0.4;
        for (let k = 0; k < 5; k++) { const b2 = (k / 5) * Math.PI * 2; const pt = dot(0.04, cols[i % 5]); pt.scale.set(1, 0.5, 1); pt.position.set(cx + Math.cos(b2) * 0.045, 0.03, cz + Math.sin(b2) * 0.045); hatG.add(pt); }
        hatG.add(at(dot(0.025, '#ffb347'), cx, 0.05, cz));
        const lf = dot(0.04, '#5fae5c'); lf.scale.set(1.6, 0.35, 0.8); lf.position.set(Math.cos(a + 0.45) * 0.4, 0, Math.sin(a + 0.45) * 0.4); lf.rotation.y = -a; hatG.add(lf);
      }
    } else if (kind === 'bunny') {
      const hb = ring(0.42, 0.03, hat); hb.rotation.z = Math.PI / 2; hb.scale.set(1, 1, 0.9); hb.position.y = -0.12; hatG.add(hb); // bờm
      for (const x of [-0.15, 0.15]) {
        const e = capsule(0.07, 0.34, hat); e.position.set(x, 0.32, -0.05); e.rotation.z = -x; hatG.add(e);
        const inn = capsule(0.035, 0.26, '#ffc6d6'); inn.position.set(x, 0.33, 0.01); inn.rotation.z = -x; hatG.add(inn);
        const tipE = sphere(0.06, hat, 8); tipE.position.set(x * 1.6, 0.56, -0.04); hatG.add(tipE);
      }
      hatG.add(at(dot(0.04, '#ff8fb1'), 0.12, 0.1, 0.06)); // nơ nhỏ
    } else if (kind === 'crown') {
      hatG.add(at(cyl(0.24, 0.24, 0.14, hat, 12), 0, 0.12, 0));
      for (const y of [0.05, 0.19]) { const bd = ring(0.245, 0.015, hd); bd.rotation.x = Math.PI / 2; bd.position.y = y; hatG.add(bd); }
      const gems = ['#ff8fb1', '#8fd8ff', '#9be29b'];
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        hatG.add(at(cone(0.06, 0.14, hat, 4), Math.cos(a) * 0.22, 0.25, Math.sin(a) * 0.22));
        hatG.add(at(dot(0.022, '#ffffff'), Math.cos(a) * 0.22, 0.33, Math.sin(a) * 0.22));
        hatG.add(at(dot(0.03, gems[i % 3]), Math.cos(a) * 0.25, 0.12, Math.sin(a) * 0.25));
      }
      hatG.add(at(dot(0.05, '#ff8fb1'), 0, 0.14, 0.24));
    } else if (kind === 'leaf') {
      const st = cyl(0.015, 0.02, 0.2, '#5a8f4a', 5); st.rotation.z = 0.15; st.position.set(0, 0.18, 0); hatG.add(st);
      for (const x of [-1, 1]) {
        const l = sphere(0.1, hat, 8); l.scale.set(1.3, 0.35, 0.7); l.position.set(x * 0.09, 0.3, 0); l.rotation.z = x * 0.5; hatG.add(l);
        const vein = bx(0.12, 0.008, 0.01, hd); vein.position.set(x * 0.09, 0.315, 0.04); vein.rotation.z = x * 0.5; hatG.add(vein);
      }
      hatG.add(at(dot(0.025, '#bfe6ff'), 0.12, 0.33, 0.05)); // giọt sương
    } else if (kind === 'chef') {
      hatG.add(at(cyl(0.3, 0.3, 0.16, hat, 16), 0, 0.06, 0));
      for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; hatG.add(at(sphere(0.18, hat, 10), Math.cos(a) * 0.17, 0.3, Math.sin(a) * 0.17)); } // nếp phồng
      hatG.add(at(sphere(0.22, hat, 12), 0, 0.38, 0));
      const cb = ring(0.3, 0.015, hd); cb.rotation.x = Math.PI / 2; cb.position.y = 0.13; hatG.add(cb);
    } else if (kind === 'beret') {
      const b = cyl(0.42, 0.38, 0.12, hat, 18); b.position.set(0.05, 0.05, 0); b.rotation.z = -0.25; hatG.add(b);
      const pd = sphere(0.42, hat, 14); pd.scale.set(1, 0.25, 1); pd.position.set(0.07, 0.11, 0); pd.rotation.z = -0.25; hatG.add(pd);
      const rm = ring(0.38, 0.025, hd); rm.rotation.x = Math.PI / 2; rm.position.set(0.05, -0.01, 0); hatG.add(rm);
      hatG.add(at(cyl(0.02, 0.02, 0.08, hat, 4), 0.02, 0.19, 0));
    }
    head.add(hatG);
  }
  // ----- kính (0.29: tròng kính trong + gọng tới tai) -----
  if (avatar.glasses) {
    const gk = avatar.glasses, frame = gk === 'star' ? '#e0a21a' : gk === 'heart' ? '#e8507a' : '#3b2a22';
    for (const x of [-0.15, 0.15]) {
      if (gk === 'round') {
        const r = ring(0.085, 0.015, frame); r.position.set(x, -0.02, 0.39); head.add(r);
        const ln = new THREE.Mesh(new THREE.CircleGeometry(0.08, 14), lens()); ln.position.set(x, -0.02, 0.392); head.add(ln);
      } else if (gk === 'sun') {
        head.add(at(rbox(0.2, 0.12, 0.03, '#2a2a33', 0.04), x, -0.01, 0.4));
        head.add(at(dot(0.02, '#ffffff'), x - 0.05, 0.02, 0.415)); // ánh phản chiếu
      } else if (gk === 'star') { const st = cone(0.1, 0.03, '#ffd36e', 5); st.rotation.x = Math.PI / 2; st.position.set(x, -0.01, 0.41); head.add(st); head.add(at(dot(0.025, '#ffffff'), x, 0, 0.43)); }
      else if (gk === 'heart') { for (const dx of [-0.035, 0.035]) head.add(at(sphere(0.055, '#ff6f9a', 8), x + dx, 0.0, 0.4)); const tp = cone(0.06, 0.07, '#ff6f9a', 8); tp.rotation.z = Math.PI; tp.position.set(x, -0.05, 0.4); head.add(tp); }
      // gọng vắt qua tai
      const arm = rbox(0.015, 0.015, 0.36, frame, 0.006); arm.position.set(x * 2.6, 0, 0.2); arm.rotation.y = -Math.sign(x) * 0.08; head.add(arm);
    }
    if (gk !== 'heart') head.add(at(bx(0.1, 0.02, 0.02, frame), 0, 0.0, 0.41));
  }
  // ----- túi (0.29: quai đeo, nắp, khóa) -----
  if (avatar.bag) {
    const bc = avatar.bagColor || '#f47a93', bd = dark(bc, 0.8);
    if (avatar.bag === 'backpack') {
      body.add(at(rbox(0.34, 0.36, 0.18, bc, 0.08), 0, 0.56, -0.26));
      body.add(at(rbox(0.35, 0.14, 0.2, bd, 0.06), 0, 0.7, -0.26)); // nắp
      body.add(at(rbox(0.22, 0.12, 0.05, '#ffffff', 0.03), 0, 0.48, -0.36));
      body.add(at(bx(0.06, 0.05, 0.03, '#ffd36e'), 0, 0.63, -0.37)); // khóa
      for (const x of [-0.13, 0.13]) { const sp = rbox(0.05, 0.42, 0.03, bd, 0.015); sp.position.set(x, 0.6, 0.17); sp.rotation.x = 0.08; body.add(sp); const tp = rbox(0.05, 0.03, 0.42, bd, 0.012); tp.position.set(x, 0.81, -0.03); body.add(tp); } // quai đeo
      body.add(at(dot(0.04, '#ff8fb1'), 0.1, 0.5, -0.39)); // móc khóa
    } else if (avatar.bag === 'basket') {
      const b = cyl(0.12, 0.09, 0.12, bc, 12); b.position.set(0, -0.32, 0.06); armL.add(b);
      for (const y of [-0.36, -0.3]) { const wv = ring(0.11, 0.01, bd); wv.rotation.x = Math.PI / 2; wv.position.set(0, y, 0.06); armL.add(wv); } // vân đan
      const hd2 = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.012, 5, 12, Math.PI), mat(bd)); hd2.position.set(0, -0.26, 0.06); armL.add(hd2); // quai xách
      for (let i = 0; i < 3; i++) armL.add(at(sphere(0.045, ['#ff8fb1', '#ffd36e', '#ffffff'][i], 6), -0.04 + i * 0.04, -0.24, 0.06));
      const lf = dot(0.035, '#7cc27f'); lf.scale.set(1.6, 0.4, 0.8); lf.position.set(0.07, -0.25, 0.1); armL.add(lf);
    } else if (avatar.bag === 'flowerbag') {
      const b = sphere(0.1, bc, 12); b.position.set(0.32, 0.36, 0.06); body.add(b);
      for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; const pt = dot(0.05, '#ffffff'); pt.scale.set(1, 1, 0.5); pt.position.set(0.32 + Math.cos(a) * 0.08, 0.36 + Math.sin(a) * 0.08, 0.12); body.add(pt); }
      body.add(at(dot(0.04, '#ffd36e'), 0.32, 0.36, 0.15));
      const strap = ring(0.36, 0.014, bd); strap.rotation.set(0, 0, -0.75); strap.scale.set(0.75, 1, 0.62); strap.position.set(0.05, 0.6, 0); body.add(strap); // dây đeo chéo
    }
  }

  root.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  compact([body, head, armL, armR, legL, legR], [hand]);
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
