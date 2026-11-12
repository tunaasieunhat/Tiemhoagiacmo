// 🌸 Đảo Ngàn Hương (GĐ23): hòn đảo lớn phía tây bắc, nhiều mũi đất (data/huong.js HG.lobes).
// Nhìn thấy từ đầu game; cây cầu gỗ còn mục cho tới khi sửa trong chương 1. Vật thể tĩnh được gộp (mergeStatic) cho nhẹ.
// Pick: 'hgshop' (Tiệm Hương Nhài), 'gather' (chỗ hái, id), 'hgbridge' (cầu mục, trước khi sửa).
import * as THREE from 'three';
import { rbox, sphere, cyl, cone, torus, at, textSprite } from '../models/primitives.js';
import { mat } from '../models/materials.js';
import { mergeStatic } from './world.js';
import { HG, GATHER } from '../../data/huong.js';

const rng = (seed) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
const WOOD = '#b08a64', WOOD_D = '#7d5f44';

function emojiSprite(emoji, glow = 'rgba(255,236,190,.95)') {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(64, 64, 6, 64, 64, 62);
  g.addColorStop(0, glow); g.addColorStop(0.5, 'rgba(255,220,170,.45)'); g.addColorStop(1, 'rgba(255,220,170,0)');
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  x.font = '58px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(emoji, 64, 68);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false, depthTest: false }));
}

/** Rải n vật trong 1 mũi đất, tránh các vòng tròn cấm. Trả về [[x,z,r]] */
function scatter(rand, lobe, n, avoid, pad = 1.6) {
  const out = [];
  for (let k = 0; k < n * 8 && out.length < n; k++) {
    const a = rand() * Math.PI * 2, d = Math.sqrt(rand()) * (lobe.r - pad);
    const x = lobe.x + Math.cos(a) * d, z = lobe.z + Math.sin(a) * d;
    if (avoid.some((c) => Math.hypot(x - c[0], z - c[1]) < c[2])) continue;
    out.push([x, z, rand()]);
  }
  return out;
}

export class HuongView {
  constructor(scene) {
    this.root = new THREE.Group();
    scene.add(this.root);
    this.t = 0;
    this.key = '';
    const st = new THREE.Group(); // vật tĩnh (sẽ gộp)
    const add = (o) => { st.add(o); return o; };
    const rand = rng(2323);
    const L = Object.fromEntries(HG.lobes.map((l) => [l.id, l]));
    // vùng không rải cây
    const avoid = [
      [...HG.shop, 4.2], [...HG.workshop, 3], [...HG.fair, 4.6], [...HG.banyan, 6.5], [...HG.pond, 8.6], [...HG.hill, 9],
      [-33.5, -36.5, 3], [-84, -46, 3.5], [-62.5, -68.5, 3], [-29.5, -26.5, 3],
      ...Object.values(GATHER).map((g) => [g.at[0], g.at[1], 2.2]),
    ];
    // ----- các mũi đất -----
    HG.lobes.forEach((l, i) => {
      // thân đảo thấp hơn mặt cỏ (mặt trên ở y = -0.1) để mép cát của mũi này không che cỏ của mũi bên cạnh
      add(at(cyl(l.r, l.r - 1.2, 1.4, '#e3c9a2', 40, { cast: false, receive: true }), l.x, -0.8, l.z));
      add(at(cyl(l.r + 0.15, l.r + 0.15, 0.2, mat('#bfe19c'), 40, { cast: false, receive: true }), l.x, -0.08 - i * 0.001, l.z));
    });
    // ----- cây cầu gỗ -----
    const [bx0, bz0] = HG.bridge.from, [bx1, bz1] = HG.bridge.to;
    const blen = Math.hypot(bx1 - bx0, bz1 - bz0), ang = Math.atan2(bx1 - bx0, bz1 - bz0);
    this.bridgeOk = new THREE.Group(); this.bridgeBroken = new THREE.Group();
    const nP = Math.round(blen / 0.55);
    for (let i = 0; i <= nP; i++) {
      const k = i / nP, x = bx0 + (bx1 - bx0) * k, z = bz0 + (bz1 - bz0) * k;
      const p = rbox(1.7, 0.1, 0.42, i % 2 ? WOOD : '#c29c74', 0.03); p.position.set(x, 0.06, z); p.rotation.y = ang;
      this.bridgeOk.add(p);
      // cầu mục: thiếu một đoạn giữa + vài tấm lệch
      if (k < 0.38 || k > 0.62) { const q = p.clone(); q.material = mat(i % 2 ? '#8f7a62' : '#9c876c'); q.rotation.z = (rand() - 0.5) * 0.25; q.position.y = -0.02 - rand() * 0.06; this.bridgeBroken.add(q); }
    }
    for (let i = 0; i <= 6; i++) {
      const k = i / 6, x = bx0 + (bx1 - bx0) * k, z = bz0 + (bz1 - bz0) * k;
      for (const s of [-1, 1]) {
        const px = x + Math.cos(ang) * 0.85 * s, pz = z - Math.sin(ang) * 0.85 * s;
        this.bridgeOk.add(at(cyl(0.07, 0.08, 1.4, WOOD_D, 6), px, 0.1, pz));
        if (k < 0.38 || k > 0.62) this.bridgeBroken.add(at(cyl(0.07, 0.08, 1.2, '#6d5a48', 6), px, 0.0, pz));
      }
    }
    // dây vịn
    for (const s of [-1, 1]) {
      const r = cyl(0.03, 0.03, blen, '#d9c4a0', 5); r.rotation.order = 'YXZ'; r.rotation.y = ang; r.rotation.x = Math.PI / 2;
      r.position.set((bx0 + bx1) / 2 + Math.cos(ang) * 0.85 * s, 0.75, (bz0 + bz1) / 2 - Math.sin(ang) * 0.85 * s);
      this.bridgeOk.add(r);
    }
    this.root.add(this.bridgeOk, this.bridgeBroken);
    const bhit = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2, blen), new THREE.MeshBasicMaterial({ visible: false }));
    this.bridgeHit = new THREE.Group(); this.bridgeHit.add(bhit);
    this.bridgeHit.position.set((bx0 + bx1) / 2, 0.6, (bz0 + bz1) / 2); this.bridgeHit.rotation.y = ang;
    this.bridgeHit.userData.pick = { kind: 'hgbridge' };
    this.root.add(this.bridgeHit);

    // ----- Tiệm Hương Nhài -----
    const [sx, sz] = HG.shop;
    const shop = new THREE.Group(); shop.position.set(sx, 0, sz);
    shop.rotation.y = Math.atan2(bx1 - sx, bz1 - sz); // mặt tiền nhìn về phía cầu
    shop.add(at(rbox(4.4, 2.6, 3.4, '#fff3e4', 0.12), 0, 1.3, 0));
    const roof = cone(3.5, 1.7, '#d98a6a', 4); roof.rotation.y = Math.PI / 4; roof.position.y = 3.45; roof.scale.set(1.0, 1, 0.8); shop.add(roof);
    shop.add(at(rbox(1.0, 1.7, 0.1, '#9a6a4c', 0.04), 0, 0.85, 1.72));
    for (const x of [-1.45, 1.45]) shop.add(at(rbox(0.9, 0.8, 0.08, '#cfe8f2', 0.03), x, 1.5, 1.72));
    // mái hiên sọc
    for (let i = 0; i < 6; i++) { const a = rbox(0.74, 0.08, 1.0, i % 2 ? '#ffffff' : '#f2a3b5', 0.02); a.position.set(-1.85 + i * 0.74, 2.35, 2.2); a.rotation.x = 0.35; shop.add(a); }
    // kệ lọ trước tiệm
    shop.add(at(rbox(1.6, 0.7, 0.5, WOOD, 0.04), -1.5, 0.35, 2.4));
    ['#ffd36e', '#f6a6b9', '#a8e0c8', '#c9a2ff', '#ffb36e'].forEach((c, i) => shop.add(at(cyl(0.12, 0.12, 0.26, c, 8), -2.1 + i * 0.3, 0.84, 2.4)));
    this.root.add(shop);
    const shopHit = new THREE.Group(); shopHit.position.copy(shop.position); shopHit.rotation.y = shop.rotation.y;
    const sh = new THREE.Mesh(new THREE.BoxGeometry(5, 4, 4.6), new THREE.MeshBasicMaterial({ visible: false })); sh.position.y = 1.8; shopHit.add(sh);
    shopHit.userData.pick = { kind: 'hgshop' };
    this.root.add(shopHit);
    this.shopHit = shopHit;
    this.saleSign = at(textSprite('Sang nhượng', { scale: 0.55, bg: '#fffbe6', border: '#d9c08a' }), sx + 0.4, 2.0, sz + 1.6);
    this.root.add(this.saleSign);
    this.shopLabel = null;
    // Xưởng Hương: lán nhỏ + nồi chưng đồng + ống khói
    const [wx, wz] = HG.workshop;
    add(at(rbox(2.6, 1.8, 2.2, '#f0dcc0', 0.1), wx, 0.9, wz));
    const wr = cone(2.2, 1.0, '#a8724f', 4); wr.rotation.y = Math.PI / 4; add(at(wr, wx, 2.3, wz));
    add(at(cyl(0.18, 0.2, 1.4, '#8a8a8a', 8), wx + 0.8, 2.6, wz - 0.4));
    add(at(sphere(0.55, '#d08a4a', 12), wx - 1.7, 0.7, wz + 0.8));
    add(at(cyl(0.06, 0.06, 1.2, '#d08a4a', 6), wx - 1.7, 1.4, wz + 0.8));
    this.smoke = [];
    for (let i = 0; i < 4; i++) { const s = sphere(0.22, new THREE.MeshBasicMaterial({ color: '#f4f0ea', transparent: true, opacity: 0.6 }), 8); s.position.set(wx + 0.8, 3.4 + i * 0.5, wz - 0.4); this.root.add(s); this.smoke.push(s); }

    // ----- quảng trường chợ phiên -----
    const [fx, fz] = HG.fair;
    add(at(cyl(3.6, 3.6, 0.08, '#efe4d6', 28, { cast: false, receive: true }), fx, 0.02, fz));
    [0, 1, 2, 3].forEach((i) => {
      const a = (i / 4) * Math.PI * 2 + 0.4, x = fx + Math.cos(a) * 4.4, z = fz + Math.sin(a) * 4.4;
      add(at(rbox(1.5, 0.12, 0.8, WOOD, 0.03), x, 0.8, z));
      for (const dx of [-0.6, 0.6]) add(at(cyl(0.05, 0.05, 1.8, WOOD_D, 5), x + dx, 0.9, z));
      const top = rbox(1.8, 0.08, 1.1, ['#f2a3b5', '#ffd36e', '#a8e0c8', '#c9a2ff'][i], 0.03); top.position.set(x, 1.8, z); add(top);
    });
    this.lanterns = [];
    for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; const l = sphere(0.16, new THREE.MeshBasicMaterial({ color: '#ffcf7a' }), 8); l.position.set(fx + Math.cos(a) * 3.2, 2.5 + Math.sin(i * 1.7) * 0.1, fz + Math.sin(a) * 3.2); this.root.add(l); this.lanterns.push(l); }

    // ----- Đồng Hoa Sương: bụi nhài + hoa dại -----
    const bushes = scatter(rand, L.meadow, 70, avoid, 1.4).concat(scatter(rand, L.neck, 12, avoid, 1.4));
    bushes.forEach(([x, z, k]) => {
      const b = sphere(0.45 + k * 0.25, k > 0.5 ? '#6fae5f' : '#7fbd69', 8, { cast: false }); b.scale.y = 0.7; b.position.set(x, 0.25, z); add(b);
      for (let j = 0; j < 4; j++) add(at(sphere(0.09, k > 0.25 ? '#ffffff' : '#ffe6f0', 6, { cast: false }), x + (rand() - 0.5) * 0.7, 0.5 + rand() * 0.15, z + (rand() - 0.5) * 0.7));
    });
    scatter(rand, L.meadow, 120, avoid, 0.8).forEach(([x, z, k]) => add(at(sphere(0.08, ['#ffd36e', '#f6a6b9', '#c9a2ff', '#ffffff'][Math.floor(k * 4)], 5, { cast: false }), x, 0.08, z)));

    // ----- Đồi Trà bậc thang -----
    const [hx, hz] = HG.hill;
    for (let i = 0; i < 4; i++) {
      const r = 8.5 - i * 2.1, y = i * 0.45;
      add(at(cyl(r, r + 0.15, 0.45, i % 2 ? '#d6c39a' : '#cdb88e', 32, { cast: false, receive: true }), hx, y + 0.12, hz));
      const ring = torus(r - 0.45, 0.32, '#4f9a4a'); ring.rotation.x = Math.PI / 2; ring.scale.z = 0.8; ring.position.set(hx, y + 0.45, hz); ring.castShadow = false; add(ring);
    }
    add(at(sphere(0.9, '#5fa857', 10), hx, 2.2, hz));
    scatter(rand, L.tea, 16, [...avoid.filter((c) => c !== avoid[5]), [hx, hz, 9.4]], 1.2).forEach(([x, z]) => { const b = sphere(0.5, '#4f9a4a', 8, { cast: false }); b.scale.y = 0.6; b.position.set(x, 0.22, z); add(b); });

    // ----- Rừng Ong -----
    scatter(rand, L.forest, 34, avoid, 1.4).forEach(([x, z, k]) => {
      add(at(cyl(0.16, 0.22, 1.4 + k, '#8a6446', 6, { cast: false }), x, 0.7 + k / 2, z));
      const c = cone(1.0 + k * 0.4, 2.2 + k, k > 0.5 ? '#4f8f52' : '#5ea35c', 7); c.position.set(x, 2.2 + k * 1.2, z); add(c);
    });
    // thùng ong & tổ ong
    [[-79.5, -37], [-78.2, -36.2], [-80.8, -36.4], [-77.6, -40.6]].forEach(([x, z], i) => {
      add(at(rbox(0.8, 0.5, 0.6, i % 2 ? '#f0d9a0' : '#e8c27a', 0.05), x, 0.25, z));
      add(at(rbox(0.8, 0.45, 0.6, '#e8c27a', 0.05), x, 0.72, z));
      add(at(rbox(0.9, 0.08, 0.7, '#a8724f', 0.02), x, 0.98, z));
    });
    // lán quay mật
    add(at(rbox(2.2, 0.1, 1.8, WOOD, 0.03), -75.5, 1.8, -46));
    for (const [dx, dz] of [[-1, -0.8], [1, -0.8], [-1, 0.8], [1, 0.8]]) add(at(cyl(0.06, 0.06, 1.8, WOOD_D, 5), -75.5 + dx, 0.9, -46 + dz));
    add(at(cyl(0.45, 0.4, 0.9, '#c9c9c9', 12), -75.5, 0.45, -46));
    this.bees = [];
    for (let i = 0; i < 6; i++) { const b = sphere(0.07, new THREE.MeshBasicMaterial({ color: '#ffcf3a' }), 6); this.root.add(b); this.bees.push({ m: b, c: [-79.3, -38.2], ph: i * 1.1, r: 0.8 + (i % 3) * 0.4 }); }

    // ----- Đầm Sen -----
    const [px, pz] = HG.pond;
    add(at(cyl(8, 8, 0.06, mat('#8ec9c0'), 40, { cast: false, receive: true }), px, 0.03, pz));
    for (let i = 0; i < 26; i++) {
      const a = rand() * Math.PI * 2, d = Math.sqrt(rand()) * 7.2, x = px + Math.cos(a) * d, z = pz + Math.sin(a) * d;
      add(at(cyl(0.45 + rand() * 0.25, 0.45, 0.04, '#5fae6a', 10, { cast: false }), x, 0.08, z));
      if (rand() < 0.55) { const f = cone(0.18, 0.3, '#ff9fb5', 6); f.position.set(x + 0.15, 0.25, z); add(f); }
    }
    this.boat = new THREE.Group();
    const hull = sphere(0.6, '#9a7452', 10); hull.scale.set(1, 0.35, 1); this.boat.add(hull);
    this.boat.position.set(px + 4, 0.08, pz + 3); this.root.add(this.boat);

    // ----- Vườn Quế & Cam -----
    scatter(rand, L.orchard, 18, avoid, 1.5).forEach(([x, z, k], i) => {
      if (i % 3 === 2) { add(at(cyl(0.1, 0.14, 2.4, '#9a5e38', 6, { cast: false }), x, 1.2, z)); add(at(sphere(0.7, '#5e9a52', 8), x, 2.6, z)); return; }
      add(at(cyl(0.14, 0.2, 1.1, '#8a6446', 6, { cast: false }), x, 0.55, z));
      add(at(sphere(1.0 + k * 0.2, '#5aa257', 10), x, 1.7, z));
      for (let j = 0; j < 5; j++) { const a = j * 1.3 + k; add(at(sphere(0.14, '#ff9a2e', 6, { cast: false }), x + Math.cos(a) * 0.85, 1.5 + (j % 2) * 0.5, z + Math.sin(a) * 0.85)); }
    });

    // ----- Suối & Cây Đa Cổ -----
    const [ax, az] = HG.banyan;
    add(at(cyl(1.6, 2.2, 3.4, '#7a5a42', 10), ax, 1.7, az));
    for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; add(at(cyl(0.08, 0.1, 3.4, '#8a6a50', 5, { cast: false }), ax + Math.cos(a) * (2.4 + (i % 3) * 0.6), 1.7, az + Math.sin(a) * (2.4 + (i % 3) * 0.6))); }
    [[0, 0, 3.6], [2.4, 1.2, 2.6], [-2.4, 0.8, 2.6], [0.8, -2.4, 2.4], [-1.2, 2.2, 2.4]].forEach(([dx, dz, r]) => { const c = sphere(r, '#4f8f52', 12); c.scale.y = 0.62; c.position.set(ax + dx, 4.4 + r * 0.25, az + dz); add(c); });
    this.banyanTop = [ax, 6.4, az];
    // suối chảy từ gốc đa ra biển
    const stream = [[-38, -60], [-40.5, -57.5], [-41.5, -54], [-40, -50.5], [-37.5, -48.5], [-33.5, -47.6]];
    for (let i = 0; i < stream.length - 1; i++) {
      const [x0, z0] = stream[i], [x1, z1] = stream[i + 1];
      const len = Math.hypot(x1 - x0, z1 - z0), s = rbox(1.2, 0.05, len + 0.4, mat('#8ec9e0'), 0.02, { cast: false, receive: true });
      s.position.set((x0 + x1) / 2, 0.03, (z0 + z1) / 2); s.rotation.y = Math.atan2(x1 - x0, z1 - z0); add(s);
    }
    // cối nước
    this.mill = new THREE.Group(); this.mill.position.set(-42.6, 0.9, -55.6);
    this.mill.add(torus(0.85, 0.08, WOOD_D));
    for (let i = 0; i < 8; i++) { const sp = rbox(0.12, 1.6, 0.3, WOOD, 0.02); sp.rotation.z = (i / 8) * Math.PI; this.mill.add(sp); }
    this.mill.rotation.y = 0.6;
    this.root.add(this.mill);
    add(at(rbox(1.4, 1.0, 1.4, '#e0d2bf', 0.08), -43.8, 0.5, -56.6));

    // ----- cây rải rác ở các mũi khác -----
    for (const id of ['ben', 'neck', 'banyan']) scatter(rand, L[id], id === 'banyan' ? 10 : 5, avoid, 1.6).forEach(([x, z, k]) => { add(at(cyl(0.14, 0.2, 1.0, '#8a6446', 6, { cast: false }), x, 0.5, z)); add(at(sphere(0.9 + k * 0.3, '#6fb56a', 9), x, 1.6, z)); });

    mergeStatic(st);
    this.root.add(st);

    // ----- biển tên các vùng -----
    this.labels = HG.lobes.filter((l) => l.name && l.id !== 'ben').map((l) => {
      const s = textSprite(l.name, { sub: l.sub, scale: l.id === 'ben' ? 0.9 : 0.75 });
      s.position.set(l.x, l.id === 'tea' ? 6.2 : 4.8, l.z - l.r * 0.35);
      this.root.add(s);
      return s;
    });
    this.islandLabel = textSprite('Đảo Ngàn Hương', { sub: 'Gió tây bắc mang mùi hoa nhài', scale: 1.1 });
    this.islandLabel.position.set(-46, 7.5, -44);
    this.root.add(this.islandLabel);

    // ----- chỗ hái (chạm được) -----
    this.spots = {};
    Object.entries(GATHER).forEach(([id, g], i) => {
      const grp = new THREE.Group();
      const s = emojiSprite(g.icon); s.scale.set(1.6, 1.6, 1); s.renderOrder = 7; grp.add(s);
      grp.add(new THREE.Mesh(new THREE.SphereGeometry(0.9, 8, 6), new THREE.MeshBasicMaterial({ visible: false })));
      grp.position.set(g.at[0], g.story ? 6.0 : 1.3, g.at[1]);
      grp.userData = { pick: { kind: 'gather', id }, sprite: s, phase: i, baseY: grp.position.y };
      grp.visible = false;
      this.spots[id] = grp; this.root.add(grp);
    });

    // ----- cổng hoa cưới (kết ẩn) -----
    this.arch = new THREE.Group();
    const arc = torus(1.3, 0.1, '#f6d2dc'); arc.position.y = 1.0; this.arch.add(arc);
    for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI; this.arch.add(at(sphere(0.14, i % 2 ? '#ffffff' : '#ffc6d6', 6), Math.cos(a) * 1.3, 1.0 + Math.sin(a) * 1.3, 0)); }
    this.arch.position.set(bx1 + 0.4, 0, bz1 - 0.4); this.arch.rotation.y = ang + Math.PI / 2;
    this.arch.visible = false;
    this.root.add(this.arch);
    // chiếc ghế trống trước tiệm (vĩ thanh)
    this.chair = new THREE.Group();
    this.chair.add(at(rbox(0.7, 0.08, 0.7, WOOD, 0.03), 0, 0.5, 0));
    this.chair.add(at(rbox(0.7, 0.8, 0.08, WOOD, 0.03), 0, 0.9, -0.32));
    for (const [dx, dz] of [[-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3], [0.3, 0.3]]) this.chair.add(at(cyl(0.04, 0.04, 0.5, WOOD_D, 5), dx, 0.25, dz));
    this.chair.position.set(-35.4, 0, -33.9); this.chair.rotation.y = 2.2;
    this.root.add(this.chair);
  }

  /** st: { open, bridge, gather: { id: true/false }, shop: 'sale'|'open'|'sen', fair, wed, chair } */
  sync(st) {
    const key = JSON.stringify(st);
    if (key === this.key) return;
    this.key = key;
    this.open = !!st.bridge;
    this.bridgeOk.visible = !!st.bridge;
    this.bridgeBroken.visible = !st.bridge;
    this.bridgeHit.visible = !st.bridge && !!st.bridgeSpot;
    this.saleSign.visible = st.shop === 'sale';
    const name = st.shop === 'sen' ? 'Tiệm Nhài & Sen' : 'Tiệm Hương Nhài';
    if (this.shopLabelName !== name) {
      if (this.shopLabel) { this.root.remove(this.shopLabel); this.shopLabel.material.map.dispose(); this.shopLabel.material.dispose(); }
      this.shopLabel = textSprite(name, { sub: 'trà · mứt · nến · nước hoa', scale: 0.8 });
      this.shopLabel.position.set(HG.shop[0], 5.1, HG.shop[1]);
      this.root.add(this.shopLabel);
      this.shopLabelName = name;
    }
    this.fairOn = !!st.fair;
    this.arch.visible = !!st.wed;
    this.chair.visible = !!st.chair;
    for (const [id, g] of Object.entries(this.spots)) g.visible = !!st.bridge && !!st.gather?.[id];
  }

  /** Chạm gần biểu tượng chỗ hái (dò theo màn hình) */
  spotNear(toScreen, x, y, radius = 42) {
    let best = null, bd = radius;
    for (const g of Object.values(this.spots)) {
      if (!g.visible) continue;
      const p = toScreen(g.position);
      const d = Math.hypot(p.x - x, p.y - y);
      if (d < bd) { bd = d; best = g.userData.pick; }
    }
    return best;
  }

  update(dt, { night = 0, hide = false } = {}) {
    this.t += dt;
    const t = this.t;
    const show = !hide;
    for (const l of this.labels) l.visible = show && this.open;
    this.islandLabel.visible = show;
    if (this.shopLabel) this.shopLabel.visible = show && this.open;
    for (const g of Object.values(this.spots)) {
      if (!g.visible) continue;
      g.userData.sprite.visible = show;
      g.position.y = g.userData.baseY + Math.sin(t * 2 + g.userData.phase) * 0.12;
    }
    this.mill.rotation.x = t * 0.8;
    this.smoke.forEach((s, i) => { const k = (t * 0.25 + i / 4) % 1; s.position.y = 3.3 + k * 2.2; s.material.opacity = 0.55 * (1 - k); s.scale.setScalar(0.8 + k * 1.4); });
    for (const b of this.bees) { const a = t * 3 + b.ph; b.m.position.set(b.c[0] + Math.cos(a) * b.r, 1.2 + Math.sin(a * 1.7) * 0.3, b.c[1] + Math.sin(a) * b.r); }
    this.boat.position.y = 0.1 + Math.sin(t * 1.2) * 0.03;
    for (const [i, l] of this.lanterns.entries()) { l.visible = this.fairOn || night > 0.3; l.material.color.setHSL(0.1, 1, 0.6 + 0.12 * Math.sin(t * 2 + i)); }
  }
}
