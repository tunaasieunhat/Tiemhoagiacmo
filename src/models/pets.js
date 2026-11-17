// 🐾 Mô hình thú cưng chibi + trứng (GĐ26), dựng từ khối hình cơ bản.
import * as THREE from 'three';
import { sphere, cyl, cone, capsule, rbox, at, torus } from './primitives.js';
import { PET_SPECIES, EGGS } from '../../data/pets.js';

const EYE = '#2a1f1c';

function eyes(head, y, z, spread = 0.1, size = 0.045) {
  for (const x of [-spread, spread]) {
    const e = sphere(size, EYE, 8); e.position.set(x, y, z); e.scale.set(0.9, 1.15, 0.6); head.add(e);
    head.add(at(sphere(size * 0.35, '#ffffff', 6), x + size * 0.3, y + size * 0.35, z + size * 0.4));
  }
  for (const x of [-spread * 1.6, spread * 1.6]) { const c = sphere(0.035, '#ffab9c', 6); c.position.set(x, y - 0.06, z - 0.02); c.scale.set(1, 0.6, 0.4); head.add(c); }
}

/** Thú cưng: trả về { root, body, head, legs: [], tail } — cao khoảng 0,6 */
export function buildPet(sp) {
  const C = PET_SPECIES[sp]?.colors || PET_SPECIES.cat.colors;
  const root = new THREE.Group();
  const body = new THREE.Group(); root.add(body);
  const head = new THREE.Group();
  const legs = [];
  let tail = null;
  const four = (r = 0.06, h = 0.08, col = C.dark) => { for (const [x, z] of [[-0.1, 0.1], [0.1, 0.1], [-0.1, -0.1], [0.1, -0.1]]) { const l = at(capsule(r, h, col), x, 0.08, z); body.add(l); legs.push(l); } };

  if (sp === 'duck') {
    const b = sphere(0.2, C.body, 14); b.scale.set(1, 0.9, 1.15); b.position.y = 0.22; body.add(b);
    for (const x of [-0.19, 0.19]) { const w = sphere(0.1, C.dark, 8); w.scale.set(0.4, 0.8, 1.2); w.position.set(x, 0.24, -0.02); body.add(w); }
    head.position.set(0, 0.46, 0.08); body.add(head);
    head.add(sphere(0.16, C.body, 14));
    const beak = sphere(0.07, '#ff9a3c', 8); beak.scale.set(1.3, 0.5, 1); beak.position.set(0, -0.02, 0.16); head.add(beak);
    eyes(head, 0.03, 0.13, 0.07, 0.035);
    for (const x of [-0.07, 0.07]) { const f = at(sphere(0.05, '#ff9a3c', 6), x, 0.03, 0.04); f.scale.set(1, 0.3, 1.4); body.add(f); legs.push(f); }
  } else if (sp === 'owl') {
    const b = sphere(0.22, C.body, 14); b.scale.set(1, 1.15, 0.95); b.position.y = 0.28; body.add(b);
    const belly = sphere(0.15, C.belly, 10); belly.scale.set(1, 1.2, 0.5); belly.position.set(0, 0.24, 0.13); body.add(belly);
    for (const x of [-0.2, 0.2]) { const w = sphere(0.1, C.dark, 8); w.scale.set(0.45, 1, 0.9); w.position.set(x, 0.28, -0.02); body.add(w); }
    head.position.set(0, 0.52, 0); body.add(head);
    head.add(sphere(0.17, C.body, 14));
    for (const x of [-0.07, 0.07]) { head.add(at(sphere(0.07, '#fff6e0', 10), x, 0.01, 0.12)); }
    eyes(head, 0.01, 0.17, 0.07, 0.04);
    head.add(at(cone(0.03, 0.06, '#f2b31f', 4), 0, -0.06, 0.17).rotateX(Math.PI));
    for (const x of [-0.11, 0.11]) head.add(at(cone(0.05, 0.1, C.dark, 4), x, 0.16, 0));
    for (const x of [-0.07, 0.07]) { const f = at(sphere(0.04, '#f2b31f', 6), x, 0.05, 0.05); body.add(f); legs.push(f); }
  } else if (sp === 'turtle') {
    const shell = sphere(0.26, C.dark, 14); shell.scale.set(1, 0.6, 1.1); shell.position.y = 0.2; body.add(shell);
    for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; body.add(at(sphere(0.05, ['#ff8fb1', '#ffd36e', '#ffffff', '#c9a2ff', '#ff8fb1'][i], 6), Math.cos(a) * 0.12, 0.34, Math.sin(a) * 0.13)); }
    body.add(at(sphere(0.05, '#ffd36e', 6), 0, 0.36, 0));
    const belly = cyl(0.25, 0.25, 0.05, C.belly, 14); belly.position.y = 0.1; belly.scale.z = 1.1; body.add(belly);
    head.position.set(0, 0.2, 0.3); body.add(head);
    head.add(sphere(0.12, C.body, 12));
    eyes(head, 0.03, 0.1, 0.05, 0.03);
    four(0.05, 0.04, C.body);
    for (const l of legs) l.position.set(l.position.x * 1.9, 0.07, l.position.z * 1.9);
  } else {
    // thú bốn chân (mèo, chó, thỏ, cáo, rồng)
    const b = capsule(0.15, 0.2, C.body); b.rotation.x = Math.PI / 2; b.position.y = 0.24; body.add(b);
    const belly = sphere(0.13, C.belly, 10); belly.scale.set(1, 0.7, 1.4); belly.position.set(0, 0.17, 0.02); body.add(belly);
    four();
    head.position.set(0, 0.45, 0.2); body.add(head);
    head.add(sphere(0.19, C.body, 14));
    const muzzle = sphere(0.08, C.belly, 8); muzzle.scale.set(1.2, 0.8, 0.8); muzzle.position.set(0, -0.06, 0.15); head.add(muzzle);
    head.add(at(sphere(0.025, sp === 'calico' ? '#e8964a' : '#3b2a22', 6), 0, -0.03, 0.21));
    eyes(head, 0.03, 0.16, 0.08, 0.04);
    if (sp === 'bunny') {
      for (const x of [-0.07, 0.07]) { const e = capsule(0.045, 0.2, C.body); e.position.set(x, 0.27, -0.02); e.rotation.z = -x * 1.5; head.add(e); const inn = capsule(0.022, 0.15, C.dark); inn.position.set(x, 0.28, 0.02); inn.rotation.z = -x * 1.5; head.add(inn); }
      tail = sphere(0.07, C.belly, 8); tail.position.set(0, 0.28, -0.3); body.add(tail);
    } else if (sp === 'dog') {
      for (const x of [-1, 1]) { const e = sphere(0.08, C.dark, 8); e.scale.set(0.5, 1.2, 0.8); e.position.set(x * 0.17, 0.02, 0); head.add(e); }
      tail = capsule(0.03, 0.12, C.dark); tail.position.set(0, 0.35, -0.3); tail.rotation.x = -0.6; body.add(tail);
    } else {
      const earC = sp === 'calico' ? null : C.dark;
      for (const x of [-1, 1]) { const e = cone(0.07, 0.14, x < 0 && sp === 'calico' ? '#e8964a' : (earC || '#3b2a22'), 4); e.position.set(x * 0.11, 0.17, 0); e.rotation.z = -x * 0.25; head.add(e); }
      if (sp === 'calico') { head.add(at(sphere(0.09, '#e8964a', 8), -0.1, 0.08, 0.02)); body.add(at(sphere(0.09, '#3b2a22', 8), 0.08, 0.32, -0.08)); body.add(at(sphere(0.08, '#e8964a', 8), -0.07, 0.31, 0.06)); }
      const fluffy = sp === 'fox' || sp === 'snowfox';
      tail = fluffy ? sphere(0.11, C.body, 10) : capsule(0.03, 0.18, C.dark);
      if (fluffy) { tail.scale.set(0.8, 0.8, 1.6); tail.position.set(0, 0.32, -0.34); body.add(at(sphere(0.06, '#ffffff', 8), 0, 0.34, -0.46)); }
      else { tail.position.set(0, 0.4, -0.3); tail.rotation.x = -0.4; }
      body.add(tail);
      if (sp === 'dragon') {
        for (const x of [-1, 1]) { const w = sphere(0.12, C.dark, 8); w.scale.set(0.2, 0.9, 1.2); w.position.set(x * 0.16, 0.38, -0.05); w.rotation.z = x * 0.6; body.add(w); }
        for (const x of [-0.06, 0.06]) head.add(at(cone(0.025, 0.1, '#ffd36e', 5), x, 0.2, -0.03));
        for (let i = 0; i < 3; i++) body.add(at(sphere(0.035, '#ff8fb1', 6), 0, 0.4 - i * 0.02, 0.05 - i * 0.12));
      }
    }
  }
  root.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return { root, body, head, legs, tail };
}

/** Quả trứng (kind = common | rare | star) */
export function buildEgg(kind = 'common') {
  const E = EGGS[kind] || EGGS.common;
  const g = new THREE.Group();
  const e = sphere(0.16, E.color, 14); e.scale.set(1, 1.3, 1); e.position.y = 0.21; g.add(e);
  for (let i = 0; i < 5; i++) { const a = i * 1.3; const d = sphere(0.035, E.spots, 6); d.position.set(Math.cos(a) * 0.15, 0.16 + (i % 3) * 0.08, Math.sin(a) * 0.15); d.scale.set(1, 1, 0.4); d.lookAt(0, d.position.y, 0); g.add(d); }
  return g;
}

/** Ổ ấp rơm */
export function buildNest() {
  const g = new THREE.Group();
  const r = torus(0.3, 0.1, '#d9b48a'); r.rotation.x = Math.PI / 2; r.position.y = 0.1; g.add(r);
  g.add(at(cyl(0.3, 0.26, 0.08, '#c9a27a', 14), 0, 0.05, 0));
  return g;
}
