// Dựng bản đồ tĩnh: đảo cỏ, các khu (Nông trại, Tiệm hoa, Nhà bạn, Công viên, Khu vui chơi, Khu mua bán, Làng), đường đi, cây cối.
// (GĐ24) Đảo chính = hình tròn gốc + các mũi đất mở rộng (data/island.js), rừng bao quanh đổi theo mùa (render/forest.js).
import { buildVillage, inVillageZone } from './village.js';
import { VILLAGE } from '../../data/village.js';
import { PARCELS } from '../../data/land.js';
import { EN_PLOTS } from '../../data/muien.js';
import { REGULARS } from '../../data/regulars.js';
import { NEW_VILLAGERS } from '../../data/village.js';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { rbox, cyl, sphere, cone, torus, at, textSprite, mesh } from '../models/primitives.js';
import { mat } from '../models/materials.js';
import { buildCharacter } from '../models/character.js';
import { HomeModel } from '../models/home.js';
import { ForestView } from './forest.js';
import { LOBES, ISLAND_ZONES, ISLAND_EXITS, FOREST } from '../../data/island.js';
import { FISH_SPOTS } from '../../data/fishing.js';
import { CHAPTERS } from '../../data/story.js';
import {
  tree, bush, rock, grassTuft, fence, lampPost, flowerShop, marketStall, toolShed, crate, pond, scarecrow, signPost, rng, labHouse,
} from '../models/environment.js';

export const ZONES = {
  farm: { center: new THREE.Vector3(0, 0, 2), name: 'Nông Trại' },
  shop: { center: new THREE.Vector3(11, 0, -7), name: 'Tiệm Hoa' },
  market: { center: new THREE.Vector3(ISLAND_ZONES.market.at[0], 0, ISLAND_ZONES.market.at[1]), name: 'Khu Mua Bán' }, // (GĐ24) dời sang mũi đất phía đông
};
// chỗ khu chợ cũ (trước GĐ24) — giữ để cây cũ không đổi chỗ; giờ là nhà của bạn
const OLD_MARKET = new THREE.Vector3(-7, 0, -12);

/** Các hình tròn tạo nên đảo chính (gốc + mũi đất) — dùng cho camera, đặt đồ, rừng */
export const ISLAND_SHAPES = [{ x: 0, z: 0, r: 25 }, ...LOBES.map((l) => ({ x: l.x, z: l.z, r: l.r }))];

/** Vị trí 1 lô: lô mua của dân làng (plot.parcel) nằm ở mảnh đất đó, lô thường theo plot.slot (GĐ13) */
export function plotPosition(plot, idx) {
  const P = plot?.parcel && (PARCELS[plot.parcel] || EN_PLOTS[plot.parcel]); // lô dân làng hoặc bậc thang Mũi Én (GĐ21)
  if (P) return new THREE.Vector3(P.x, 0, P.z);
  return (PLOT_SLOTS[plot?.slot ?? idx] || new THREE.Vector3(idx * 5, 0, 0)).clone();
}

/** Điểm (x, z) nằm trên mảnh đất của dân làng (để bản đồ không trồng cây đè lên) */
function inParcelZone(x, z, pad = 0) {
  return Object.values(PARCELS).some((P) => Math.abs(x - P.x) < 2.6 + pad && Math.abs(z - P.z) < 2.6 + pad);
}

// Vị trí các lô đất trong nông trại (lô 1 mở sẵn, các lô sau mở rộng ở GĐ4)
export const PLOT_SLOTS = [
  new THREE.Vector3(-2.6, 0, 4.5),
  new THREE.Vector3(2.6, 0, 4.5),
  new THREE.Vector3(-2.6, 0, -0.5),
  new THREE.Vector3(2.6, 0, -0.5),
];

const ISLAND_R = 25;

export function buildWorld(scene) {
  const world = new THREE.Group();
  const lampLights = [];
  const fireflyAnchors = [];
  const rand = rng(42);
  scene.add(world);

  // ----- nước biển & đảo -----
  const sea = mesh(new THREE.CircleGeometry(140, 48), mat('#a6dff2'), { cast: false, receive: false });
  sea.rotation.x = -Math.PI / 2;
  sea.position.y = -1.3;
  world.add(sea);
  const islandSide = mesh(new THREE.CylinderGeometry(ISLAND_R, ISLAND_R - 1.2, 1.4, 56), mat('#e3c39d'), { cast: false, receive: true });
  islandSide.position.y = -0.72;
  world.add(islandSide);
  const grass = mesh(new THREE.CylinderGeometry(ISLAND_R + 0.15, ISLAND_R + 0.15, 0.2, 56), mat('#b5e39a'), { cast: false, receive: true });
  grass.position.y = -0.1;
  world.add(grass);
  // viền cát
  const sand = mesh(new THREE.TorusGeometry(ISLAND_R - 0.4, 0.5, 6, 56), mat('#f3e2c2'), { cast: false, receive: true });
  sand.rotation.x = Math.PI / 2;
  sand.position.y = -0.62;
  sand.scale.z = 0.5;
  world.add(sand);
  // (GĐ24) các mũi đất mở rộng: thân thấp hơn mặt cỏ để mép cát không che cỏ của phần bên cạnh; cỏ dùng chung vật liệu (đổi màu theo mùa)
  for (const l of LOBES) {
    world.add(at(mesh(new THREE.CylinderGeometry(l.r, l.r - 1.2, 1.4, 44), mat('#e3c39d'), { cast: false, receive: true }), l.x, -0.8, l.z));
    world.add(at(mesh(new THREE.CylinderGeometry(l.r + 0.15, l.r + 0.15, 0.2, 44), mat('#b5e39a'), { cast: false, receive: true }), l.x, -0.1, l.z));
    const sd = mesh(new THREE.TorusGeometry(l.r - 0.4, 0.5, 6, 44), mat('#f3e2c2'), { cast: false, receive: true });
    sd.rotation.x = Math.PI / 2; sd.scale.z = 0.5; sd.position.set(l.x, -0.66, l.z); world.add(sd);
  }

  // ----- nền từng khu -----
  const farmGround = rbox(11.6, 0.08, 11.2, '#a5d98a', 0.04, { cast: false, receive: true });
  farmGround.position.set(ZONES.farm.center.x, 0.02, ZONES.farm.center.z);
  world.add(farmGround);
  const plaza = cyl(4.6, 4.6, 0.08, '#f1e4d0', 32, { cast: false, receive: true });
  plaza.position.set(ZONES.shop.center.x, 0.02, ZONES.shop.center.z + 1);
  world.add(plaza);
  const market = cyl(5.2, 5.2, 0.08, '#ead6b8', 32, { cast: false, receive: true });
  market.position.set(ZONES.market.center.x, 0.02, ZONES.market.center.z);
  world.add(market);

  // vùng không được đặt đồ trang trí (GĐ10) — gom dần khi dựng bản đồ
  const decorMap = { islandR: ISLAND_R, islands: ISLAND_SHAPES.map((c) => ({ ...c })), circles: [], rects: [], paths: [] };
  const block = (x, z, r, name = '') => decorMap.circles.push({ x, z, r, name });

  // ----- hàng rào nông trại (cổng ở phía sau, z nhỏ) -----
  const fc = ZONES.farm.center;
  const fx = 5.6, fz = 5.4;
  decorMap.rects.push({ x: fc.x, z: fc.z, hx: fx + 0.15, hz: fz + 0.15, name: 'nông trại' });
  world.add(fence(fc.x - fx, fc.z - fz, fc.x - fx, fc.z + fz));
  world.add(fence(fc.x + fx, fc.z - fz, fc.x + fx, fc.z + fz));
  world.add(fence(fc.x - fx, fc.z + fz, fc.x + fx, fc.z + fz));
  world.add(fence(fc.x - fx, fc.z - fz, fc.x - 1.2, fc.z - fz));
  world.add(fence(fc.x + 1.2, fc.z - fz, fc.x + fx, fc.z - fz));
  // cổng vòm
  const gate = new THREE.Group();
  gate.add(at(rbox(0.25, 2.2, 0.25, '#f3dcc0', 0.08), -1.25, 1.1, 0));
  gate.add(at(rbox(0.25, 2.2, 0.25, '#f3dcc0', 0.08), 1.25, 1.1, 0));
  gate.add(at(rbox(3.0, 0.45, 0.3, '#f6a6b9', 0.15), 0, 2.3, 0));
  for (let i = 0; i < 7; i++) gate.add(at(sphere(0.12, ['#ffd34e', '#ffffff', '#c79cf2'][i % 3], 8), -1.2 + i * 0.4, 2.55, 0.1));
  gate.position.set(fc.x, 0, fc.z - fz);
  world.add(gate);

  // bù nhìn + biển báo lô bị khóa
  const sc = scarecrow();
  sc.position.set(fc.x - fx - 1.0, 0, fc.z + 3.6); // bên ngoài hàng rào phía tây
  sc.rotation.y = 1.2;
  world.add(sc);
  block(sc.position.x, sc.position.z, 0.6, 'bù nhìn');

  const lockedSlots = [];
  PLOT_SLOTS.forEach((p, i) => {
    if (i === 0) return;
    const g = new THREE.Group();
    const patch = rbox(4.2, 0.06, 4.2, '#9ccf82', 0.05, { cast: false, receive: true });
    patch.position.y = 0.04;
    g.add(patch);
    const r2 = rng(100 + i);
    for (let k = 0; k < 8; k++) {
      const t = grassTuft('#86c47a');
      t.position.set((r2() - 0.5) * 3.6, 0.06, (r2() - 0.5) * 3.6);
      g.add(t);
    }
    const sign = signPost('#fff3e6');
    sign.position.set(0, 0, 0.6);
    g.add(sign);
    g.add(at(sphere(0.12, '#f6a6b9', 8), 0, 1.02, 0.65));
    g.position.copy(p);
    g.userData.pick = { kind: 'lockedPlot', slot: i };
    world.add(g);
    lockedSlots.push(g);
  });

  // ----- tiệm hoa -----
  const shop = flowerShop();
  shop.position.copy(ZONES.shop.center);
  shop.rotation.y = 0.3; // khớp SHOP_ROT trong customers.js
  shop.userData.pick = { kind: 'zone', zone: 'shop' };
  world.add(shop);

  // ----- khu chợ: tiệm dụng cụ + sạp hạt giống + sạp phân bón -----
  const marketG = new THREE.Group();
  const shed = toolShed();
  shed.position.set(0, 0, -1.6);
  marketG.add(shed);
  const stallA = marketStall('#9fd6f0', '#fffaf3', ['#f4b25a', '#e9dcc5', '#a6dd94']);
  stallA.position.set(-3.2, 0, 0.6);
  stallA.rotation.y = 0.5;
  marketG.add(stallA);
  const stallB = marketStall('#c8b4f0', '#fffaf3', ['#c9a27e', '#bba08a', '#f6d67a']);
  stallB.position.set(3.0, 0, 0.8);
  stallB.rotation.y = -0.5;
  marketG.add(stallB);
  [[-1.6, 1.8], [-1.0, 2.2], [1.5, 2.1]].forEach(([x, z]) => { const c = crate(); c.position.set(x, 0, z); c.rotation.y = rand(); marketG.add(c); });
  // người bán hàng chibi
  const vendor = (look, parent, x, z) => {
    const v = buildCharacter(look).root;
    v.position.set(x, 0, z);
    v.scale.setScalar(0.92);
    parent.add(v);
  };
  vendor({ skin: '#f8cfae', hair: '#6b4433', outfit: '#9fd6f0', hat: '#ffffff' }, stallA, 0, -0.95);
  vendor({ skin: '#ffe0c7', hair: '#2f2a2a', outfit: '#c8b4f0', hat: null, bun: true }, stallB, 0, -0.95);
  vendor({ skin: '#e8b48f', hair: '#3b3b3b', outfit: '#a6dd94', hat: '#c9a27e' }, shed, -0.2, 1.9);
  marketG.position.copy(ZONES.market.center);
  marketG.rotation.y = -Math.PI / 2; // mặt quầy quay về phía tây (về tiệm hoa)
  marketG.userData.pick = { kind: 'zone', zone: 'market' };
  world.add(marketG);

  // ----- nhà lai tạo (GĐ6) -----
  const lab = labHouse();
  lab.position.set(-8.8, 0, -1.6);
  lab.rotation.y = 0.7;
  lab.userData.pick = { kind: 'zone', zone: 'lab' };
  world.add(lab);
  block(lab.position.x, lab.position.z, 2.3, 'nhà lai tạo');
  block(ZONES.shop.center.x, ZONES.shop.center.z, 3.4, 'tiệm hoa');
  block(ZONES.market.center.x, ZONES.market.center.z, 4.3, 'khu mua bán');
  // ----- (GĐ24) nhà của bạn: đặt ở chỗ khu chợ cũ -----
  const home = new HomeModel();
  const HZ = ISLAND_ZONES.home;
  home.root.position.set(HZ.at[0], 0, HZ.at[1]);
  home.root.rotation.y = Math.atan2(HZ.face[0] - HZ.at[0], HZ.face[1] - HZ.at[1]);
  world.add(home.root);
  block(HZ.at[0], HZ.at[1], 3.6, 'nhà của bạn');

  // ----- đường đá -----
  const junction = new THREE.Vector3(0, 0, -6.2);
  const paths = [
    [new THREE.Vector3(fc.x, 0, fc.z - fz + 0.3), junction],
    [junction, new THREE.Vector3(ZONES.shop.center.x - 1.5, 0, ZONES.shop.center.z + 3.6)],
    [junction, new THREE.Vector3(ZONES.market.center.x + 1.5, 0, ZONES.market.center.z + 3.4)],
    [new THREE.Vector3(fc.x - fx - 0.4, 0, fc.z + 1), new THREE.Vector3(-11, 0, 4)],
    // lối khách đi vào tiệm từ phía đông
    [new THREE.Vector3(ZONES.shop.center.x + 2.2, 0, ZONES.shop.center.z + 4.4), new THREE.Vector3(21, 0, -0.5)],
  ];
  for (const [a, b] of paths) decorMap.paths.push([{ x: a.x, z: a.z }, { x: b.x, z: b.z }]);
  for (const [a, b] of paths) {
    const len = a.distanceTo(b);
    const n = Math.floor(len / 0.85);
    for (let i = 0; i <= n; i++) {
      const p = a.clone().lerp(b, i / n);
      const s = cyl(0.36 + rand() * 0.08, 0.38, 0.07, rand() > 0.5 ? '#efe4d6' : '#e6d8c6', 9, { cast: false, receive: true });
      s.position.set(p.x + (rand() - 0.5) * 0.35, 0.04, p.z + (rand() - 0.5) * 0.35);
      world.add(s);
    }
  }

  // ----- đèn đường -----
  const lampPos = [[-1.8, -3.0], [1.8, -3.0], [4.5, -8.5], [-3.5, -8.5], [8.2, -3.6], [-4.8, -9.2]];
  lampPos.forEach(([x, z], i) => {
    const l = lampPost();
    l.position.set(x, 0, z);
    world.add(l);
    block(x, z, 0.35, 'đèn đường');
    if (i < 3) {
      const pl = new THREE.PointLight('#ffcf7a', 0, 8, 1.6);
      pl.position.set(x, 2.0, z);
      world.add(pl);
      lampLights.push(pl);
    }
  });

  // ----- ao nước -----
  const pd = pond(2.4);
  pd.position.set(-12.5, 0, 5);
  world.add(pd);
  block(pd.position.x, pd.position.z, 2.9, 'ao nước');
  fireflyAnchors.push(pd.position.clone());

  // ----- Làng Hoa (GĐ11) -----
  const village = buildVillage(world, decorMap);

  // ----- đất của dân làng (GĐ13): cỏ dại + hàng rào dây + biển tên; mua rồi thì ẩn -----
  const parcels = {};
  for (const [id, P] of Object.entries(PARCELS)) {
    const g = new THREE.Group();
    g.position.set(P.x, 0, P.z);
    const patch = rbox(4.4, 0.05, 4.4, '#a9d98c', 0.05, { cast: false, receive: true });
    patch.position.y = 0.03;
    g.add(patch);
    const r3 = rng(300 + id.length * 7 + Math.round(P.x * 10));
    for (let k = 0; k < 10; k++) { const t = grassTuft(k % 2 ? '#86c47a' : '#9bd38a'); t.position.set((r3() - 0.5) * 3.8, 0.05, (r3() - 0.5) * 3.8); g.add(t); }
    // cọc góc + dây thừng
    const H = 2.3;
    for (const [x, z] of [[-H, -H], [H, -H], [H, H], [-H, H]]) g.add(at(cyl(0.06, 0.07, 0.7, '#a87458', 6), x, 0.35, z));
    for (const [ax, az, bx, bz] of [[-H, -H, H, -H], [H, -H, H, H], [H, H, -H, H], [-H, H, -H, -H]]) {
      const len = Math.hypot(bx - ax, bz - az);
      const rope = cyl(0.015, 0.015, len, '#e6d3b0', 4, { cast: false });
      rope.rotation.z = Math.PI / 2;
      rope.rotation.y = -Math.atan2(bz - az, bx - ax);
      rope.position.set((ax + bx) / 2, 0.55, (az + bz) / 2);
      g.add(rope);
    }
    const sign = signPost('#fff3e6');
    sign.position.set(H - 0.5, 0, H + 0.1);
    g.add(sign);
    const owner = REGULARS[P.owner]?.name || NEW_VILLAGERS[P.owner]?.name || '';
    const label = textSprite(`Đất của ${owner}`, { sub: 'Chạm để hỏi mua', scale: 0.62 });
    label.position.set(H - 0.5, 1.75, H + 0.1);
    g.add(label);
    g.userData.pick = { kind: 'parcel', id };
    world.add(g);
    parcels[id] = g;
    decorMap.rects.push({ x: P.x, z: P.z, hx: 2.35, hz: 2.35, name: `đất của ${owner}` });
  }
  fireflyAnchors.push(new THREE.Vector3(VILLAGE.center.x, 0, VILLAGE.center.z));
  fireflyAnchors.push(new THREE.Vector3(0, 0, 2));

  // =============== (GĐ24) các khu mới ===============
  const zone = buildZones(world, decorMap, block, rng(2424)); // dùng chuỗi ngẫu nhiên riêng ⇒ cây cũ không đổi chỗ
  const newPaths = zone.paths;
  const onNew = (x, z, pad = 0) => newPaths.some(([a, b]) => distToSeg(x, z, a, b) < 1.3 + pad) || zone.spots.some((c) => Math.hypot(x - c[0], z - c[1]) < c[2] + pad);
  fireflyAnchors.push(new THREE.Vector3(ISLAND_ZONES.park.fountain[0], 0, ISLAND_ZONES.park.fountain[1]));

  // ----- cây & bụi trang trí (tránh các khu chính) -----
  const avoid = [
    { c: ZONES.farm.center, r: 8.2 },
    { c: ZONES.shop.center, r: 5.5 },
    { c: OLD_MARKET, r: 6.2 }, // (GĐ24) giữ như cũ để cây cũ không đổi chỗ
    { c: pd.position, r: 3.6 },
    { c: junction, r: 2.2 },
    { c: new THREE.Vector3(-8.8, 0, -1.6), r: 2.8 },
  ];
  const free = (x, z, pad = 0) => {
    if (Math.hypot(x, z) > ISLAND_R - 2) return false;
    for (const a of avoid) if (Math.hypot(x - a.c.x, z - a.c.z) < a.r + pad) return false;
    // tránh các đường đi
    for (const [a, b] of paths) if (distToSeg(x, z, a, b) < 1.3 + pad) return false;
    return true;
  };
  const kinds = ['green', 'green', 'blossom', 'mint'];
  let placed = 0, tries = 0;
  while (placed < 34 && tries < 1200) {
    tries++;
    const ang = rand() * Math.PI * 2;
    const rad = 6 + rand() * (ISLAND_R - 7);
    const x = Math.cos(ang) * rad, z = Math.sin(ang) * rad;
    if (!free(x, z, 0.5)) continue;
    const t = tree(kinds[Math.floor(rand() * kinds.length)], 0.8 + rand() * 0.45);
    t.position.set(x, 0, z);
    t.rotation.y = rand() * 6;
    avoid.push({ c: t.position, r: 1.6 });
    // giữ nguyên thứ tự ngẫu nhiên như bản cũ (cây cũ không đổi chỗ); chỉ bỏ cây nằm trên đường / đất làng mới
    if (!inVillageZone(x, z) && !inParcelZone(x, z, 0.4) && !onNew(x, z, 0.4)) { world.add(t); block(x, z, 0.95, 'cây'); }
    placed++;
  }
  const flowerColors = [null, '#ffc4d6', '#fff0a8', '#d9c4ff', '#ffffff'];
  for (let i = 0; i < 40; i++) {
    const x = (rand() - 0.5) * 2 * (ISLAND_R - 2), z = (rand() - 0.5) * 2 * (ISLAND_R - 2);
    if (!free(x, z)) continue;
    const b = rand() > 0.35 ? bush('#93d48d', flowerColors[Math.floor(rand() * flowerColors.length)], 0.7 + rand() * 0.6) : rock(0.6 + rand() * 0.8);
    b.position.x = x; b.position.z = z;
    b.rotation.y = rand() * 6;
    if (!inVillageZone(x, z, -0.3) && !inParcelZone(x, z) && !onNew(x, z)) { world.add(b); block(x, z, 0.45, 'bụi cây'); }
  }
  for (let i = 0; i < 90; i++) {
    const x = (rand() - 0.5) * 2 * (ISLAND_R - 1), z = (rand() - 0.5) * 2 * (ISLAND_R - 1);
    if (Math.hypot(x, z) > ISLAND_R - 1.2) continue;
    if (Math.abs(x - fc.x) < fx + 0.5 && Math.abs(z - fc.z) < fz + 0.5) continue;
    const t = grassTuft(rand() > 0.5 ? '#86c47a' : '#9bd38a');
    t.position.set(x, 0, z);
    if (!inVillageZone(x, z, -0.8) && !inParcelZone(x, z, -0.3)) world.add(t);
  }
  // bụi hoa ven hàng rào nông trại
  for (let i = 0; i < 6; i++) {
    const b = bush('#8fd18b', ['#ffc4d6', '#fff0a8', '#d9c4ff'][i % 3], 0.6);
    b.position.set(fc.x - fx + 0.2 + i * 2.1, 0, fc.z + fz + 0.9);
    world.add(b);
  }

  // ----- biển tên khu vực -----
  const labels = [
    { text: 'Nông Trại', sub: '', pos: new THREE.Vector3(fc.x - fx, 2.6, fc.z - fz) },
    { text: 'Tiệm Hoa Giấc Mơ', sub: 'Chạm để mở quầy bán hoa', pos: ZONES.shop.center.clone().setY(5.6) },
    { text: 'Khu Mua Bán', sub: 'Chạm để mua hạt giống, vật tư, nâng cấp', pos: ZONES.market.center.clone().setY(4.4) },
    { text: ISLAND_ZONES.home.name, sub: ISLAND_ZONES.home.sub, pos: new THREE.Vector3(ISLAND_ZONES.home.at[0], 5.4, ISLAND_ZONES.home.at[1]), scale: 0.8 },
    { text: ISLAND_ZONES.park.name, sub: ISLAND_ZONES.park.sub, pos: new THREE.Vector3(ISLAND_ZONES.park.at[0] - 1, 4.2, ISLAND_ZONES.park.at[1] - 3), scale: 0.9 },
    { text: ISLAND_ZONES.fun.name, sub: ISLAND_ZONES.fun.sub, pos: new THREE.Vector3(ISLAND_ZONES.fun.at[0], 6.6, ISLAND_ZONES.fun.at[1]), scale: 1.0 },
    { text: 'Nhà Lai Tạo', sub: 'Lai ra màu hoa mới', pos: new THREE.Vector3(-8.8, 3.6, -1.6), scale: 0.8 },
  ];
  for (const l of labels) {
    const sp = textSprite(l.text, { sub: l.sub, scale: l.scale || 1.1 });
    sp.position.copy(l.pos);
    world.add(sp);
  }

  // ----- (GĐ24) rừng bao quanh: rải theo lưới dọc bờ + 2 khu rừng, tránh lối ra / đường / công trình -----
  const forestSpots = forestLayout(decorMap, [...paths.map(([a, b]) => [a, b]), ...newPaths], zone.spots);
  for (const [x, z] of forestSpots) block(x, z, 0.9, 'rừng');
  const forest = new ForestView(scene, forestSpots);

  mergeStatic(world);

  return { world, lampLights, fireflyAnchors, lockedSlots, shop, market: marketG, lab, decorMap, village, parcels, home, forest };
}

function distToSeg(x, z, a, b) {
  const abx = b.x - a.x, abz = b.z - a.z;
  const t = Math.max(0, Math.min(1, ((x - a.x) * abx + (z - a.z) * abz) / (abx * abx + abz * abz)));
  return Math.hypot(x - (a.x + abx * t), z - (a.z + abz * t));
}

/**
 * Gộp các vật thể tĩnh cùng vật liệu thành 1 khối để giảm số lệnh vẽ (chạy mượt hơn trên điện thoại).
 * Bỏ qua những nhóm có thể chạm vào (userData.pick), chữ (sprite) và đèn.
 */
export function mergeStatic(world) {
  world.updateMatrixWorld(true);
  const buckets = new Map();
  const victims = [];
  const visit = (o) => {
    if (o.userData?.pick) return;
    for (const c of o.children) {
      if (c.isMesh && !c.isSprite && c.material && !Array.isArray(c.material)) {
        const key = `${c.material.uuid}|${c.castShadow}|${c.receiveShadow}`;
        if (!buckets.has(key)) buckets.set(key, { mat: c.material, cast: c.castShadow, receive: c.receiveShadow, geos: [] });
        let g = c.geometry.index ? c.geometry.toNonIndexed() : c.geometry.clone();
        for (const name of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(name)) g.deleteAttribute(name);
        g.applyMatrix4(c.matrixWorld);
        buckets.get(key).geos.push(g);
        victims.push(c);
      } else if (!c.isLight && !c.isSprite) {
        visit(c);
      }
    }
  };
  visit(world);
  for (const v of victims) v.parent.remove(v);
  // xóa các nhóm rỗng
  const prune = (o) => { [...o.children].forEach(prune); if (o !== world && o.type === 'Group' && o.children.length === 0 && !o.userData?.pick) o.parent?.remove(o); };
  prune(world);
  const inv = new THREE.Matrix4().copy(world.matrixWorld).invert();
  for (const b of buckets.values()) {
    const merged = mergeGeometries(b.geos, false);
    b.geos.forEach((g) => g.dispose());
    if (!merged) continue;
    merged.applyMatrix4(inv);
    const m = new THREE.Mesh(merged, b.mat);
    m.castShadow = b.cast;
    m.receiveShadow = b.receive;
    world.add(m);
  }
}

// =============================================================
//  (GĐ24) Công viên, khu vui chơi (sắp mở), khu mua bán mở rộng, cầu tàu đông, đường nối các khu
//  Trả về { paths: [[a, b]], spots: [[x, z, r]] } để cây cũ / rừng tránh ra
// =============================================================
function buildZones(world, decorMap, block, rand) {
  const V = (x, z) => new THREE.Vector3(x, 0, z);
  const spots = [];
  const solid = (x, z, r, name) => { block(x, z, r, name); spots.push([x, z, r]); };
  // ---- đường nối ----
  const P = ISLAND_ZONES.park, F = ISLAND_ZONES.fun, M = ISLAND_ZONES.market;
  const paths = [
    [V(-11, 4), V(-15, -1)], [V(-15, -1), V(P.fountain[0] + 1.6, P.fountain[1] + 2.2)],          // nông trại → công viên
    [V(0, -6.2), V(5, -13)], [V(5, -13), V(F.at[0] - F.fence - 0.4, F.at[1] + 2.4)],           // → khu vui chơi
    [V(21, -0.5), V(M.at[0] - 4.6, M.at[1] + 0.2)],                                              // tiệm hoa → khu mua bán
    [V(5, -13), V(3, -22)],                                                                      // → cầu lên Đồi Mộng
    [V(P.fountain[0] - 1.6, P.fountain[1] - 2.2), V(-21.4, -19.6)],                              // công viên → cầu Ngàn Hương
    [V(M.at[0] + 4.2, M.at[1]), V(M.pier[0] - 2.6, M.pier[1])],                                  // khu mua bán → cầu tàu đông
  ];
  // vòng đá quanh đài phun nước
  const [fx, fz] = P.fountain;
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2, b = ((i + 1) / 12) * Math.PI * 2; paths.push([V(fx + Math.cos(a) * 3.3, fz + Math.sin(a) * 3.3), V(fx + Math.cos(b) * 3.3, fz + Math.sin(b) * 3.3)]); }
  for (const [a, b] of paths) {
    decorMap.paths.push([{ x: a.x, z: a.z }, { x: b.x, z: b.z }]);
    const n = Math.max(1, Math.floor(a.distanceTo(b) / 0.85));
    for (let i = 0; i <= n; i++) {
      const p = a.clone().lerp(b, i / n);
      world.add(at(cyl(0.36 + rand() * 0.08, 0.38, 0.07, rand() > 0.5 ? '#efe4d6' : '#e6d8c6', 9, { cast: false, receive: true }), p.x + (rand() - 0.5) * 0.3, 0.04, p.z + (rand() - 0.5) * 0.3));
    }
  }
  // ---- 🌳 công viên ----
  const fountain = new THREE.Group();
  fountain.add(at(cyl(1.7, 1.8, 0.5, '#e8e0d4', 24), 0, 0.25, 0));
  fountain.add(at(cyl(1.45, 1.45, 0.08, '#9fd6f0', 24, { cast: false }), 0, 0.48, 0));
  fountain.add(at(cyl(0.25, 0.35, 1.3, '#e8e0d4', 10), 0, 0.9, 0));
  fountain.add(at(cyl(0.75, 0.6, 0.18, '#e8e0d4', 16), 0, 1.5, 0));
  fountain.add(at(sphere(0.32, '#bfe8ff', 10), 0, 1.75, 0));
  fountain.position.set(fx, 0, fz);
  world.add(fountain);
  solid(fx, fz, 2.3, 'đài phun nước');
  // bồn hoa + ghế quanh đài phun nước
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const bx = fx + Math.cos(a) * 5, bz = fz + Math.sin(a) * 5;
    world.add(at(cyl(0.9, 0.95, 0.3, '#d9c4a8', 14), bx, 0.15, bz));
    for (let k = 0; k < 6; k++) world.add(at(sphere(0.2, ['#ff8fb1', '#ffd36e', '#c9a2ff', '#ffffff', '#ffb36e', '#8fd8ff'][k], 6), bx + Math.cos(k) * 0.5, 0.42, bz + Math.sin(k) * 0.5));
    solid(bx, bz, 1.1, 'bồn hoa');
    const ba = a + Math.PI / 4, sx = fx + Math.cos(ba) * 4.6, sz = fz + Math.sin(ba) * 4.6;
    const bench = new THREE.Group();
    bench.add(at(rbox(1.3, 0.1, 0.45, '#a87a56', 0.04), 0, 0.5, 0));
    bench.add(at(rbox(1.3, 0.4, 0.08, '#a87a56', 0.03), 0, 0.78, -0.2));
    for (const dx of [-0.55, 0.55]) bench.add(at(rbox(0.08, 0.5, 0.4, '#7d5a40', 0.02), dx, 0.25, 0));
    bench.position.set(sx, 0, sz); bench.rotation.y = Math.atan2(fx - sx, fz - sz);
    world.add(bench);
    solid(sx, sz, 0.85, 'ghế công viên');
  }
  // chòi nghỉ lục giác
  const [gx, gz] = P.gazebo;
  const gaz = new THREE.Group();
  gaz.add(at(cyl(2.1, 2.2, 0.25, '#e8dccb', 6), 0, 0.12, 0));
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; gaz.add(at(cyl(0.09, 0.1, 2.3, '#ffffff', 6), Math.cos(a) * 1.8, 1.35, Math.sin(a) * 1.8)); }
  gaz.add(at(cone(2.6, 1.4, '#7fb3c9', 6), 0, 3.15, 0));
  gaz.add(at(sphere(0.18, '#ffd36e', 8), 0, 3.95, 0));
  gaz.position.set(gx, 0, gz);
  world.add(gaz);
  solid(gx, gz, 2.6, 'chòi nghỉ');
  // ---- 🎡 khu vui chơi (sắp khai trương): hàng rào + vòng quay & đu quay đang dựng ----
  const [ux, uz] = F.at;
  for (let i = 0; i < 40; i++) {
    const a = (i / 40) * Math.PI * 2;
    if (Math.abs(Math.atan2(Math.sin(a - Math.PI * 0.86), Math.cos(a - Math.PI * 0.86))) < 0.22) continue; // cổng phía tây nam
    world.add(at(rbox(0.12, 0.8, 0.12, i % 2 ? '#ffd36e' : '#ff8fb1', 0.03), ux + Math.cos(a) * F.fence, 0.4, uz + Math.sin(a) * F.fence));
  }
  decorMap.circles.push({ x: ux, z: uz, r: F.fence + 0.6, name: 'khu vui chơi (sắp mở)' });
  spots.push([ux, uz, F.fence + 0.4]);
  const wheel = new THREE.Group();
  for (const dz of [-0.6, 0.6]) {
    for (const s of [-1, 1]) { const leg = rbox(0.18, 4.6, 0.18, '#c9c3bb', 0.04); leg.position.set(s * 1.3, 2.2, dz); leg.rotation.z = -s * 0.28; wheel.add(leg); }
  }
  const ring = torus(3.2, 0.1, '#ff8fb1'); ring.position.y = 4.3; wheel.add(ring);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2, sp = rbox(0.08, 6.4, 0.08, '#ffffff', 0.02); sp.position.y = 4.3; sp.rotation.z = a; wheel.add(sp);
    if (i % 2 === 0) wheel.add(at(rbox(0.6, 0.55, 0.6, ['#8fd8ff', '#ffd36e', '#c9a2ff', '#9be29b'][i / 2], 0.1), Math.cos(a) * 3.2, 4.3 + Math.sin(a) * 3.2 - 0.4, 0));
  }
  wheel.position.set(ux + 3.5, 0, uz - 3.5); wheel.rotation.y = 0.8;
  world.add(wheel);
  const caro = new THREE.Group();
  caro.add(at(cyl(2.3, 2.4, 0.35, '#ffe6ef', 16), 0, 0.17, 0));
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; caro.add(at(cyl(0.05, 0.05, 2.2, '#ffd36e', 6), Math.cos(a) * 1.7, 1.4, Math.sin(a) * 1.7)); if (i % 2 === 0) caro.add(at(rbox(0.3, 0.4, 0.7, ['#ffffff', '#ffc6d6'][i % 4 ? 1 : 0], 0.1), Math.cos(a) * 1.7, 1.0, Math.sin(a) * 1.7)); }
  caro.add(at(cone(2.7, 1.2, '#ff8fb1', 16), 0, 3.0, 0));
  caro.position.set(ux - 3.6, 0, uz + 2.6);
  world.add(caro);
  // giàn giáo + thùng gỗ (đang xây)
  for (const [dx, dz] of [[1.2, 3.6], [-0.4, -4.6], [4.6, 1.8]]) world.add(at(rbox(0.9, 0.7, 0.9, '#c9a27a', 0.05), ux + dx, 0.35, uz + dz));
  for (let k = 0; k < 3; k++) world.add(at(rbox(0.1, 3 - k * 0.6, 0.1, '#9a8a7a', 0.02), ux - 5.6 + k * 0.7, 1.5 - k * 0.3, uz - 2.2));
  // ---- 🏪 khu mua bán: sạp mở rộng + cầu tàu đông ----
  const [mx, mz] = M.at;
  const extra = [['#ffd36e', ['#ff9a2e', '#ffd36e', '#9be29b'], mx - 1.2, mz - 5.6, 0.2], ['#f6a6b9', ['#ffc6d6', '#c9a2ff', '#ffffff'], mx - 1.6, mz + 5.4, Math.PI - 0.2]];
  for (const [roofC, goods, x, z, ry] of extra) { const st = marketStall(roofC, '#fffaf3', goods); st.position.set(x, 0, z); st.rotation.y = ry; world.add(st); solid(x, z, 1.6, 'sạp hàng'); }
  for (const [dx, dz] of [[2.6, -3.2], [3.2, 3.6], [-3.6, 3.2]]) { const c = crate(); c.position.set(mx + dx, 0, mz + dz); c.rotation.y = rand() * 3; world.add(c); solid(mx + dx, mz + dz, 0.6, 'thùng hàng'); }
  world.add(at(cyl(5.4, 5.4, 0.08, '#ead6b8', 32, { cast: false, receive: true }), mx, 0.02, mz));
  const [px, pz] = M.pier;
  for (let i = 0; i < 9; i++) world.add(at(rbox(0.46, 0.1, 1.6, i % 2 ? '#b08a64' : '#c29c74', 0.03), px - 2.6 + i * 0.52, 0.04, pz));
  for (const dx of [-1.6, 1.6]) for (const dz of [-0.7, 0.7]) world.add(at(cyl(0.08, 0.1, 1.6, '#7d5f44', 6), px + dx, -0.4, pz + dz));
  decorMap.rects.push({ x: px, z: pz, hx: 2.8, hz: 1, name: 'cầu tàu' });
  spots.push([px, pz, 2.4]);
  return { paths, spots };
}

/** Vị trí cây rừng: dải sát bờ + 2 khu rừng đông nam / tây nam. Trả về [[x, z, loại, cỡ]] */
function forestLayout(decorMap, allPaths, zoneSpots) {
  const rand = rng(777001);
  const shapes = [...ISLAND_SHAPES, { x: VILLAGE.center.x, z: VILLAGE.center.z, r: VILLAGE.radius }];
  const edge = (x, z) => Math.max(...shapes.map((c) => c.r - Math.hypot(x - c.x, z - c.z)));
  const groves = LOBES.filter((l) => l.zone === 'forest');
  // các điểm cốt truyện / câu cá trên đảo chính: chừa trống
  const keep = [
    ...CHAPTERS.flatMap((c) => c.steps.flatMap((sp) => sp.triggers)).filter((t) => t.at).map((t) => [t.at[0], t.at[2], 1.8]),
    ...Object.values(FISH_SPOTS).map((f) => [f.at[0], f.at[1], 2.2]),
    ...ISLAND_EXITS, ...zoneSpots,
  ];
  const out = [];
  const S = FOREST.spacing;
  for (let x = -40; x <= 50; x += S) {
    for (let z = -40; z <= 46; z += S) {
      const px = x + (rand() - 0.5) * S * 0.8, pz = z + (rand() - 0.5) * S * 0.8;
      const e = edge(px, pz);
      if (e < 0.9) continue;
      const inGrove = groves.some((g) => Math.hypot(px - g.x, pz - g.z) < g.r - 1.2);
      if (!(e < FOREST.band || (inGrove && rand() < FOREST.groveFill))) continue;
      if (inVillageZone(px, pz, 0.5) || inParcelZone(px, pz, 0.6)) continue;
      if (keep.some(([kx, kz, r]) => Math.hypot(px - kx, pz - kz) < r)) continue;
      if (allPaths.some(([a, b]) => distToSeg(px, pz, a, b) < 1.4)) continue;
      if (decorMap.circles.some((c) => c.name !== 'rừng' && c.name !== 'cây' && c.name !== 'bụi cây' && Math.hypot(px - c.x, pz - c.z) < c.r + 0.8)) continue;
      if (decorMap.rects.some((r) => Math.abs(px - r.x) < r.hx + 0.8 && Math.abs(pz - r.z) < r.hz + 0.8)) continue;
      out.push([px, pz, rand() < FOREST.pineRatio ? 1 : 0, 0.8 + rand() * 0.5]);
    }
  }
  return out;
}
