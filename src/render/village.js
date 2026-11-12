// Dựng Làng Hoa (GĐ11) trên bản đồ: vùng đất mới phía nam, đường đá, quảng trường, nhà, cầu tàu, cây.
// Gọi trong buildWorld (trước khi gộp vật tĩnh). Nhà được gộp vào khối tĩnh; vùng chạm của nhà là khối vô hình riêng.
import * as THREE from 'three';
import { VILLAGE, HOUSES, NODES, EDGES, SPOTS } from '../../data/village.js';
import { cyl, mesh, textSprite } from '../models/primitives.js';
import { mat } from '../models/materials.js';
import { tree, bush, rock, lampPost, rng, grassTuft } from '../models/environment.js';
import { buildHouse, well, cafeTable, pier, flowerBed } from '../models/village.js';
import { buildDecor } from '../models/decor.js';

const C = VILLAGE.center;

function distToSeg(x, z, a, b) {
  const dx = b.x - a.x, dz = b.z - a.z;
  const L = dx * dx + dz * dz || 1;
  const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / L));
  return Math.hypot(x - (a.x + dx * t), z - (a.z + dz * t));
}

/** Đường đá của làng: [[{x,z},{x,z}], ...] */
export const VILLAGE_PATHS = EDGES.filter((e) => e[2]).map(([a, b]) => [NODES[a], NODES[b]]);

/** Điểm (x, z) có nằm trong vùng làng / trên đường đá mới không (để bản đồ cũ không trồng cây đè lên) */
export function inVillageZone(x, z, pad = 0) {
  if (Math.hypot(x - C.x, z - C.z) < VILLAGE.radius + 0.5 + pad) return true;
  for (const [a, b] of VILLAGE_PATHS) if (distToSeg(x, z, a, b) < 1.3 + pad) return true;
  return false;
}

export function buildVillage(world, decorMap) {
  const rand = rng(777);
  const block = (x, z, r, name = '') => decorMap.circles.push({ x, z, r, name });
  const R = VILLAGE.radius;

  // ----- vùng đất mới (nối liền đảo cũ) -----
  const side = mesh(new THREE.CylinderGeometry(R, R - 1.0, 1.4, 48), mat('#e3c39d'), { cast: false, receive: true });
  side.position.set(C.x, -0.73, C.z);
  world.add(side);
  const grass = mesh(new THREE.CylinderGeometry(R + 0.15, R + 0.15, 0.2, 48), mat('#b5e39a'), { cast: false, receive: true });
  grass.position.set(C.x, -0.111, C.z); // thấp hơn cỏ đảo cũ 1 chút để không nhấp nháy chỗ chồng nhau
  world.add(grass);
  decorMap.islands.push({ x: C.x, z: C.z, r: R });

  // ----- quảng trường -----
  const plaza = cyl(VILLAGE.plazaRadius + 0.9, VILLAGE.plazaRadius + 0.9, 0.08, '#efe4d6', 32, { cast: false, receive: true });
  plaza.position.set(C.x, 0.02, C.z);
  world.add(plaza);
  const w = well(); w.position.set(C.x, 0, C.z); world.add(w);
  block(C.x, C.z, 1.0, 'giếng nước');
  for (const id of ['bench_w', 'bench_e']) {
    const s = SPOTS[id];
    const b = buildDecor('bench');
    b.position.set(s.x, 0, s.z);
    b.rotation.y = THREE.MathUtils.degToRad(s.rot);
    world.add(b);
    block(s.x, s.z, 0.85, 'ghế đá');
  }
  [[-3.3, 31.6], [3.2, 36.6], [-3.2, 36.6], [3.4, 31.4]].forEach(([x, z], i) => {
    if (i < 2) { const fb = flowerBed(0.55, i ? ['#c79cf2', '#ffffff', '#ffd34e'] : ['#f6a6b9', '#ffd34e', '#ffffff']); fb.position.set(x, 0, z); world.add(fb); block(x, z, 0.65, 'bồn hoa'); }
    else { const l = lampPost(); l.position.set(x, 0, z); world.add(l); block(x, z, 0.35, 'đèn đường'); }
  });

  // ----- đường đá -----
  for (const [a, b] of VILLAGE_PATHS) {
    decorMap.paths.push([{ x: a.x, z: a.z }, { x: b.x, z: b.z }]);
    const len = Math.hypot(b.x - a.x, b.z - a.z);
    const n = Math.max(1, Math.floor(len / 0.85));
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const x = a.x + (b.x - a.x) * t, z = a.z + (b.z - a.z) * t;
      if (Math.hypot(x - C.x, z - C.z) < VILLAGE.plazaRadius + 0.6) continue; // trên quảng trường đã lát
      const s = cyl(0.34 + rand() * 0.08, 0.36, 0.07, rand() > 0.5 ? '#efe4d6' : '#e6d8c6', 9, { cast: false, receive: true });
      s.position.set(x + (rand() - 0.5) * 0.3, 0.04, z + (rand() - 0.5) * 0.3);
      world.add(s);
    }
  }
  // cổng làng
  const sign = textSprite('Làng Hoa', { sub: 'Dân làng sống & làm việc theo giờ', scale: 0.9 });
  sign.position.set(NODES.m1.x + 1.6, 2.4, NODES.m1.z + 1.0);
  world.add(sign);

  // ----- nhà -----
  const houses = {};
  for (const [id, h] of Object.entries(HOUSES)) {
    const { group, windowMat } = buildHouse(h.style);
    group.position.set(h.x, 0, h.z);
    group.rotation.y = h.face ? Math.atan2(h.face[0] - h.x, h.face[1] - h.z) : Math.atan2(C.x - h.x, C.z - h.z); // cửa hướng về quảng trường (hoặc về điểm face)
    world.add(group);
    const big = h.style.cafe || h.style.school;
    block(h.x, h.z, big ? 2.4 : 2.2, h.name.toLowerCase());
    if (h.style.workshop || h.style.swing) {
      const side = new THREE.Vector3(1.5 + 1.0, 0, h.style.swing ? 1.6 : 0.2).applyAxisAngle(new THREE.Vector3(0, 1, 0), group.rotation.y);
      block(h.x + side.x, h.z + side.z, 1.3, h.style.swing ? 'xích đu' : 'xưởng mộc');
    }
    // vùng chạm vô hình (không bị gộp vào khối tĩnh)
    const hit = new THREE.Mesh(new THREE.BoxGeometry(big ? 3.8 : 3.2, 3.4, big ? 3.2 : 3.0), new THREE.MeshBasicMaterial({ visible: false }));
    const hg = new THREE.Group(); // nhóm có pick => mergeStatic bỏ qua
    hg.position.set(h.x, 1.7, h.z);
    hg.rotation.y = group.rotation.y;
    hg.userData.pick = { kind: 'house', id };
    hg.add(hit);
    world.add(hg);
    houses[id] = { windowMat, hit: hg };
  }
  // bàn cà phê trước quán Mây
  [[3.9, 40.6], [4.9, 42.3]].forEach(([x, z], i) => { const t = cafeTable(i ? '#f6a6b9' : '#9fd6f0'); t.position.set(x, 0, z); world.add(t); block(x, z, 0.85, 'bàn cà phê'); });

  // ----- cầu tàu -----
  const pr = pier(5.6);
  pr.position.set(0, 0, C.z + R - 1.6);
  world.add(pr);
  decorMap.rects.push({ x: 0, z: C.z + R + 1.2, hx: 0.9, hz: 3.2, name: 'cầu tàu' });

  // ----- cây, bụi, đá quanh làng -----
  const taken = [...Object.values(HOUSES).map((h) => ({ x: h.x, z: h.z, r: 3.2 })), { x: C.x, z: C.z, r: VILLAGE.plazaRadius + 1.6 }, { x: 4.4, z: 41.4, r: 2 }];
  const freeSpot = (x, z, r) => {
    if (Math.hypot(x - C.x, z - C.z) > R - 1.4) return false;
    if (Math.hypot(x, z) < 23.5) return false; // phần đảo cũ đã có cây
    for (const t of taken) if (Math.hypot(x - t.x, z - t.z) < t.r + r) return false;
    for (const [a, b] of VILLAGE_PATHS) if (distToSeg(x, z, a, b) < 1.1 + r) return false;
    for (const s of Object.values(SPOTS)) if (s.x != null && Math.hypot(x - s.x, z - s.z) < 1.0 + r) return false;
    return true;
  };
  const kinds = ['green', 'blossom', 'mint', 'green'];
  let placed = 0;
  for (let tries = 0; tries < 600 && placed < 16; tries++) {
    const a = rand() * Math.PI * 2, rr = 5 + rand() * (R - 6);
    const x = C.x + Math.cos(a) * rr, z = C.z + Math.sin(a) * rr;
    if (!freeSpot(x, z, 1.0)) continue;
    const t = tree(kinds[Math.floor(rand() * kinds.length)], 0.8 + rand() * 0.4);
    t.position.set(x, 0, z); t.rotation.y = rand() * 6;
    world.add(t);
    taken.push({ x, z, r: 1.6 });
    block(x, z, 0.95, 'cây');
    placed++;
  }
  for (let i = 0; i < 70; i++) {
    const a = rand() * Math.PI * 2, rr = rand() * (R - 1.2);
    const x = C.x + Math.cos(a) * rr, z = C.z + Math.sin(a) * rr;
    if (Math.hypot(x, z) < 24) continue;
    if (i < 22) {
      if (!freeSpot(x, z, 0.5)) continue;
      const b = rand() > 0.3 ? bush('#93d48d', ['#ffc4d6', '#fff0a8', '#d9c4ff', null][Math.floor(rand() * 4)], 0.7 + rand() * 0.5) : rock(0.6 + rand() * 0.6);
      b.position.set(x, 0, z); b.rotation.y = rand() * 6;
      world.add(b);
      taken.push({ x, z, r: 0.6 });
      block(x, z, 0.45, 'bụi cây');
    } else {
      if (Math.hypot(x - C.x, z - C.z) < VILLAGE.plazaRadius + 1) continue;
      const t = grassTuft(rand() > 0.5 ? '#86c47a' : '#9bd38a');
      t.position.set(x, 0, z);
      world.add(t);
    }
  }

  return { houses };
}
