// 🎡 Khu Vui Chơi 3D (GĐ26): đu quay, ngựa gỗ, tàu lượn mini, nhà gương, 5 quầy trò chơi, quầy ăn vặt, quầy đổi quà, cổng, dây đèn.
// sync({ open, festival }) · update(dt, { night }) · rideFx(id, giây) làm trò chơi quay nhanh khi bạn đang chơi.
import * as THREE from 'three';
import { rbox, sphere, cyl, cone, torus, at, textSprite } from '../models/primitives.js';
import { buildCharacter } from '../models/character.js';
import { FUN, RIDES, BOOTHS } from '../../data/fun.js';

const W = '#fffaf3', PINK = '#ff8fb1', YEL = '#ffd36e', BLUE = '#8fd8ff', PURP = '#b9a2ff', MINT = '#9be29b';
const hitBox = (w, h, d, y = h / 2) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ visible: false })); m.position.y = y; return m; };
const pickable = (g, pick) => { g.userData.pick = pick; return g; };

function stripedRoof(color, w = 2.2, d = 1.5) {
  const g = new THREE.Group();
  for (let i = 0; i < 6; i++) g.add(at(rbox(w / 6, 0.1, d, i % 2 ? '#ffffff' : color, 0.03), -w / 2 + w / 12 + (i * w) / 6, 0, 0));
  return g;
}

function booth(B) {
  const g = new THREE.Group();
  g.add(at(rbox(2.0, 0.9, 1.0, W, 0.08), 0, 0.45, 0));
  g.add(at(rbox(2.1, 0.1, 1.1, B.color, 0.04), 0, 0.93, 0));
  for (const x of [-0.95, 0.95]) g.add(at(cyl(0.05, 0.05, 1.6, '#c9a27a', 6), x, 1.7, -0.35));
  const roof = stripedRoof(B.color); roof.position.set(0, 2.5, 0); roof.rotation.x = -0.2; g.add(roof);
  // đồ chơi trên quầy theo từng trò
  const deco = { ringtoss: () => { for (let i = 0; i < 4; i++) g.add(at(cyl(0.05, 0.07, 0.3, '#7cc27f', 6), -0.6 + i * 0.4, 1.1, 0)); }, watergun: () => { for (let i = 0; i < 5; i++) g.add(at(sphere(0.14, [PINK, BLUE, YEL, PURP, MINT][i], 8), -0.7 + i * 0.35, 1.9, -0.3)); }, ducks: () => { g.add(at(cyl(0.6, 0.6, 0.12, '#8fd0e8', 14), 0, 1.0, 0.1)); for (let i = 0; i < 3; i++) g.add(at(sphere(0.1, YEL, 8), -0.3 + i * 0.3, 1.1, 0.1)); }, whack: () => { for (let i = 0; i < 3; i++) g.add(at(sphere(0.12, '#a8845f', 8), -0.5 + i * 0.5, 1.05, 0.1)); }, bouquet: () => { for (let i = 0; i < 3; i++) g.add(at(sphere(0.16, [PINK, YEL, W][i], 8), -0.5 + i * 0.5, 1.15, 0.1)); } }[Object.keys(BOOTHS).find((k) => BOOTHS[k] === B)];
  deco?.();
  const s = textSprite(`${B.icon} ${B.name}`, { scale: 0.48 }); s.position.set(0, 3.1, 0); g.add(s);
  g.add(hitBox(2.4, 3.2, 1.6));
  return g;
}

export class FunPark {
  constructor(scene) {
    this.root = new THREE.Group();
    scene.add(this.root);
    const [cx, cz] = FUN.center;
    this.root.position.set(cx, 0, cz);
    this.t = 0;
    this.fast = {};    // trò đang chạy nhanh vì bạn đang chơi: id → giây còn lại
    this.lights = [];  // vật liệu đèn để bật sáng ban đêm
    this.open = null;
    this.build();
  }

  lamp(color) { const m = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.1, roughness: 0.5 }); this.lights.push(m); return m; }

  build() {
    const R = this.root, at2 = (o, [x, z]) => { o.position.set(x, 0, z); return o; };
    // nền lát gạch hồng nhạt
    R.add(at(cyl(FUN.fence - 0.3, FUN.fence - 0.3, 0.06, '#f6e6d8', 40, { cast: false, receive: true }), 0, 0.02, 0));
    R.add(at(cyl(3.0, 3.0, 0.07, '#ffe6ef', 28, { cast: false, receive: true }), 0, 0.04, 0));
    // ----- 🎡 đu quay -----
    const W1 = RIDES.wheel;
    const wheel = new THREE.Group();
    for (const dz of [-0.55, 0.55]) for (const s of [-1, 1]) { const leg = rbox(0.18, 5.0, 0.18, '#d8d2ca', 0.04); leg.position.set(s * 1.4, 2.4, dz); leg.rotation.z = -s * 0.27; wheel.add(leg); }
    const spin = new THREE.Group(); spin.position.y = 4.7; wheel.add(spin);
    spin.add(torus(3.4, 0.1, PINK)); spin.add(torus(2.2, 0.06, YEL));
    this.gondolas = [];
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const sp = rbox(0.07, 6.8, 0.07, '#ffffff', 0.02); sp.rotation.z = a; spin.add(sp);
      const gd = new THREE.Group(); gd.position.set(Math.cos(a) * 3.4, Math.sin(a) * 3.4, 0);
      gd.add(at(rbox(0.7, 0.6, 0.7, [BLUE, YEL, PURP, MINT][i % 4], 0.12), 0, -0.45, 0));
      gd.add(at(cone(0.45, 0.25, '#ffffff', 8), 0, -0.02, 0));
      spin.add(gd); this.gondolas.push(gd);
    }
    for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; const b = sphere(0.07, '#fff', 6); b.material = this.lamp(i % 2 ? PINK : YEL); b.position.set(Math.cos(a) * 3.5, Math.sin(a) * 3.5, 0.12); spin.add(b); }
    spin.add(at(sphere(0.35, YEL, 12), 0, 0, 0));
    wheel.rotation.y = Math.PI / 4;
    this.wheelSpin = spin;
    wheel.add(hitBox(7.4, 8.6, 2.4, 4.3));
    R.add(pickable(at2(wheel, W1.at), { kind: 'ride', id: 'wheel' }));
    // ----- 🎠 ngựa gỗ -----
    const caro = new THREE.Group();
    caro.add(at(cyl(2.3, 2.4, 0.35, '#ffe6ef', 18), 0, 0.17, 0));
    const plat = new THREE.Group(); caro.add(plat);
    this.horses = [];
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      plat.add(at(cyl(0.04, 0.04, 2.4, YEL, 6), Math.cos(a) * 1.7, 1.5, Math.sin(a) * 1.7));
      const h = new THREE.Group(); h.position.set(Math.cos(a) * 1.7, 0.9, Math.sin(a) * 1.7); h.rotation.y = -a;
      const col = [W, '#ffc6d6', '#c9e8ff'][i % 3];
      h.add(at(rbox(0.22, 0.3, 0.62, col, 0.1), 0, 0, 0));
      h.add(at(rbox(0.18, 0.34, 0.2, col, 0.08), 0, 0.22, 0.3));
      h.add(at(rbox(0.06, 0.2, 0.26, '#d9a65a', 0.03), 0, 0.3, 0.16));
      plat.add(h); this.horses.push(h);
    }
    plat.add(at(cyl(0.25, 0.25, 2.6, '#ffffff', 10), 0, 1.4, 0));
    caro.add(at(cone(2.7, 1.2, PINK, 18), 0, 3.0, 0));
    caro.add(at(sphere(0.25, YEL, 8), 0, 3.7, 0));
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; const b = sphere(0.08, '#fff', 6); b.material = this.lamp(i % 3 ? YEL : PINK); b.position.set(Math.cos(a) * 2.55, 2.45, Math.sin(a) * 2.55); caro.add(b); }
    this.caroPlat = plat;
    caro.add(hitBox(5, 4, 5, 2));
    R.add(pickable(at2(caro, RIDES.carousel.at), { kind: 'ride', id: 'carousel' }));
    // ----- 🎢 tàu lượn mini (đường ray hình bầu dục trên cột) -----
    const co = new THREE.Group();
    const rx = 2.6, rz = 3.4;
    for (let i = 0; i < 28; i++) {
      const a = (i / 28) * Math.PI * 2, a2 = ((i + 1) / 28) * Math.PI * 2;
      const p1 = new THREE.Vector3(Math.cos(a) * rx, 1.3 + Math.sin(a * 2) * 0.5, Math.sin(a) * rz), p2 = new THREE.Vector3(Math.cos(a2) * rx, 1.3 + Math.sin(a2 * 2) * 0.5, Math.sin(a2) * rz);
      const seg = cyl(0.06, 0.06, p1.distanceTo(p2) + 0.05, '#ff9a5c', 5); seg.position.copy(p1).lerp(p2, 0.5); seg.lookAt(p2); seg.rotateX(Math.PI / 2); co.add(seg);
      if (i % 4 === 0) co.add(at(cyl(0.05, 0.06, p1.y, '#d8d2ca', 5), p1.x, p1.y / 2, p1.z));
    }
    this.train = [];
    for (let k = 0; k < 3; k++) { const car = new THREE.Group(); car.add(at(rbox(0.5, 0.32, 0.38, k === 0 ? YEL : '#ffb36e', 0.1), 0, 0.2, 0)); if (k === 0) car.add(at(sphere(0.1, '#3b2a22', 6), 0.25, 0.3, 0)); co.add(car); this.train.push(car); }
    this.coasterR = [rx, rz];
    co.add(at(rbox(1.0, 0.3, 0.8, '#fff3e3', 0.05), -rx - 0.6, 0.15, 0));
    co.add(hitBox(6.4, 2.8, 7.8, 1.2));
    R.add(pickable(at2(co, RIDES.coaster.at), { kind: 'ride', id: 'coaster' }));
    // ----- 🪞 nhà gương -----
    const mh = new THREE.Group();
    mh.add(at(rbox(3.0, 2.2, 2.4, '#e9e2ff', 0.1), 0, 1.1, 0));
    mh.add(at(cone(2.2, 1.2, PURP, 4), 0, 2.8, 0).rotateY(Math.PI / 4));
    const mirrorMat = new THREE.MeshStandardMaterial({ color: '#dff4ff', metalness: 0.9, roughness: 0.08 });
    for (const x of [-0.8, 0, 0.8]) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.3, 0.05), mirrorMat); m.position.set(x, 1.0, 1.22); mh.add(m); }
    mh.add(at(rbox(0.7, 1.4, 0.05, '#7c6a8f', 0.03), 0, 0.7, -1.22));
    mh.rotation.y = Math.PI * 0.35;
    mh.add(hitBox(3.4, 3.4, 2.8, 1.7));
    R.add(pickable(at2(mh, RIDES.mirror.at), { kind: 'ride', id: 'mirror' }));
    // ----- 🎯 quầy trò chơi -----
    for (const [id, B] of Object.entries(BOOTHS)) {
      const b = booth(B);
      b.rotation.y = Math.atan2(-B.at[0], -B.at[1]); // quay mặt vào giữa khu
      R.add(pickable(at2(b, B.at), { kind: 'booth', id }));
    }
    // ----- 🍡 quầy ăn vặt (xe đẩy + dù) -----
    const sn = new THREE.Group();
    sn.add(at(rbox(1.8, 0.9, 0.9, '#fff3e3', 0.08), 0, 0.6, 0));
    for (const x of [-0.7, 0.7]) sn.add(at(cyl(0.2, 0.2, 0.08, '#7d5a40', 12), x, 0.2, 0.5).rotateX(Math.PI / 2));
    sn.add(at(cyl(0.04, 0.04, 2.0, '#c9a27a', 6), 0, 1.5, 0));
    sn.add(at(cone(1.4, 0.6, PINK, 12), 0, 2.6, 0));
    for (let i = 0; i < 4; i++) sn.add(at(sphere(0.13, [PINK, '#fff', YEL, BLUE][i], 8), -0.55 + i * 0.37, 1.15, 0.2));
    const ss = textSprite('🍡 Quầy ăn vặt', { scale: 0.5 }); ss.position.set(0, 3.3, 0); sn.add(ss);
    sn.add(hitBox(2.2, 3.2, 1.6));
    sn.rotation.y = 0.9;
    R.add(pickable(at2(sn, [-8.0, 0.8]), { kind: 'snack' }));
    // ----- 🎁 quầy đổi quà (gấu bông) -----
    const pz = new THREE.Group();
    pz.add(at(rbox(2.2, 1.0, 1.0, W, 0.08), 0, 0.5, 0));
    pz.add(at(rbox(2.3, 1.6, 0.1, '#ffe6ef', 0.04), 0, 1.8, -0.45));
    for (let i = 0; i < 3; i++) { const c = ['#c9925a', '#f2c6d0', '#bfe0ff'][i]; pz.add(at(sphere(0.2, c, 10), -0.6 + i * 0.6, 1.25, -0.2)); pz.add(at(sphere(0.15, c, 10), -0.6 + i * 0.6, 1.55, -0.2)); }
    const roof = stripedRoof(YEL, 2.4, 1.4); roof.position.set(0, 2.75, 0); roof.rotation.x = -0.2; pz.add(roof);
    const ps = textSprite('🎁 Đổi quà 🪙', { scale: 0.5 }); ps.position.set(0, 3.4, 0); pz.add(ps);
    pz.add(hitBox(2.6, 3.4, 1.6));
    pz.rotation.y = Math.atan2(-1.8, 1.2);
    R.add(pickable(at2(pz, [1.8, -1.6]), { kind: 'prize' }));
    // ----- cổng chào -----
    const ga = FUN.gateAngle, gr = FUN.fence;
    const gate = new THREE.Group();
    for (const s of [-1, 1]) { gate.add(at(cyl(0.18, 0.2, 3.2, PINK, 10), s * 1.6, 1.6, 0)); gate.add(at(sphere(0.28, YEL, 10), s * 1.6, 3.3, 0)); }
    const arch = torus(1.6, 0.12, YEL); arch.position.y = 3.2; arch.scale.y = 0.45; gate.add(arch);
    this.gateSign = textSprite('🎡 Khu Vui Chơi', { scale: 0.7, sub: 'Mở cửa 8:00 – 22:00' }); this.gateSign.position.set(0, 4.3, 0); gate.add(this.gateSign);
    gate.add(hitBox(3.6, 4.4, 1.2));
    gate.position.set(Math.cos(ga) * gr, 0, Math.sin(ga) * gr);
    gate.rotation.y = Math.atan2(-Math.cos(ga), -Math.sin(ga)) + Math.PI / 2;
    R.add(pickable(gate, { kind: 'fungate' }));
    this.gate = gate;
    // ----- dây đèn quanh khu -----
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + 0.3;
      if (Math.abs(Math.atan2(Math.sin(a - ga), Math.cos(a - ga))) < 0.35) continue;
      const x = Math.cos(a) * (gr - 0.8), z = Math.sin(a) * (gr - 0.8);
      R.add(at(cyl(0.05, 0.06, 2.6, '#7c6a8f', 6), x, 1.3, z));
      const lt = sphere(0.16, '#fff', 8); lt.material = this.lamp([PINK, YEL, BLUE, PURP][i % 4]); lt.position.set(x, 2.7, z); R.add(lt);
    }
    // ----- đang sửa (chưa mở): giàn giáo + thùng gỗ -----
    this.repair = new THREE.Group();
    for (const [x, z] of [[1.2, 3.6], [-0.4, -2.6], [3.8, -1.4]]) this.repair.add(at(rbox(0.9, 0.7, 0.9, '#c9a27a', 0.05), x, 0.35, z));
    for (let k = 0; k < 3; k++) this.repair.add(at(rbox(0.1, 3 - k * 0.6, 0.1, '#9a8a7a', 0.02), 2.6 + k * 0.7, 1.5 - k * 0.3, -3.2));
    const rs = textSprite('🚧 Đang sửa', { scale: 0.5, sub: 'Hỏi Ông Ba' }); rs.position.set(0, 2.4, 0); this.repair.add(rs);
    R.add(this.repair);
    // ----- khách đi chơi -----
    this.visitors = [];
    const looks = [{ skin: '#f8d4b8', hair: '#3b2a2a', outfit: PINK, hat: null, bun: true }, { skin: '#e8b48f', hair: '#2f2a2a', outfit: BLUE, hat: YEL }, { skin: '#ffe0c7', hair: '#8a5a3a', outfit: MINT, hat: null }, { skin: '#f3c9a5', hair: '#1f1a18', outfit: PURP, hat: null, hairStyle: 'twin' }];
    looks.forEach((lk, i) => { const c = buildCharacter(lk); c.root.scale.setScalar(0.8); R.add(c.root); this.visitors.push({ c, a: (i / 4) * Math.PI * 2, r: 2.4 + (i % 2) * 0.6, s: (i % 2 ? -1 : 1) * 0.25 }); });
    R.traverse((o) => { if (o.isMesh) { o.castShadow = true; } });
  }

  /** st = { open: khu đã mở (cốt truyện), festival: đang lễ hội tối Thứ Bảy, hours: đang trong giờ mở } */
  sync(st) {
    this.open = !!st.open;
    this.hours = st.hours !== false;
    this.festival = !!st.festival;
    this.repair.visible = !this.open;
    for (const v of this.visitors) v.c.root.visible = this.open && this.hours;
  }

  rideFx(id, seconds) { this.fast[id] = seconds; }

  update(dt, { night = 0, cine = false } = {}) {
    this.t += dt;
    for (const v of this.visitors) v.c.root.visible = !cine && this.open && this.hours; // đang chiếu cảnh truyện thì khách đi chơi tạm vắng
    const run = this.open && this.hours;
    for (const k of Object.keys(this.fast)) { this.fast[k] -= dt; if (this.fast[k] <= 0) delete this.fast[k]; }
    const sp = (id, base) => (run ? base : 0) * (this.fast[id] ? 3 : 1);
    this.wheelSpin.rotation.z += dt * sp('wheel', 0.12);
    for (const g of this.gondolas) g.rotation.z = -this.wheelSpin.rotation.z;
    this.caroPlat.rotation.y += dt * sp('carousel', 0.5);
    this.horses.forEach((h, i) => { h.position.y = 0.9 + (run ? Math.sin(this.t * 2.4 + i) * 0.18 : 0); });
    // tàu lượn chạy vòng
    const [rx, rz] = this.coasterR;
    this.trainT = (this.trainT || 0) + dt * sp('coaster', 0.35);
    this.train.forEach((car, k) => {
      const a = this.trainT - k * 0.24, a2 = a + 0.05;
      car.position.set(Math.cos(a) * rx, 1.42 + Math.sin(a * 2) * 0.5, Math.sin(a) * rz);
      car.lookAt(Math.cos(a2) * rx, 1.42 + Math.sin(a2 * 2) * 0.5, Math.sin(a2) * rz);
      car.rotateY(-Math.PI / 2);
    });
    // khách đi dạo quanh quảng trường
    for (const v of this.visitors) {
      if (!v.c.root.visible) continue;
      v.a += dt * v.s;
      const x = Math.cos(v.a) * v.r, z = Math.sin(v.a) * v.r;
      v.c.root.position.set(x, Math.abs(Math.sin(this.t * 8 + v.a)) * 0.04, z);
      v.c.root.rotation.y = Math.atan2(-Math.sin(v.a) * Math.sign(v.s), Math.cos(v.a) * Math.sign(v.s));
      v.c.legL.position.z = Math.sin(this.t * 8 + v.a) * 0.08; v.c.legR.position.z = -v.c.legL.position.z;
    }
    // đèn: ban đêm sáng, lễ hội nhấp nháy
    const glow = (this.open ? 0.15 + night * 1.6 : 0.05) * (this.festival ? 1.4 + Math.sin(this.t * 6) * 0.4 : 1);
    this.lights.forEach((m, i) => { m.emissiveIntensity = glow * (this.festival ? 0.7 + 0.3 * Math.sin(this.t * 4 + i) : 1); });
  }

  /** Điểm thế giới của 1 trò / quầy (để lia camera, đặt nhân vật) */
  worldPos(rel) { const [cx, cz] = FUN.center; return new THREE.Vector3(cx + rel[0], 0, cz + rel[1]); }
}
