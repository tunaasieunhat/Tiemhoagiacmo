// 🏡 Ngôi nhà của người chơi (GĐ24): dựng từ khối hình, màu tường/mái/cửa và các vật phẩm bật/tắt được.
// Mặt tiền hướng về +z (trong hệ tọa độ của nhà). Vật liệu tường/mái/cửa là vật liệu riêng (đổi màu không ảnh hưởng nhà khác).
import * as THREE from 'three';
import { rbox, sphere, cyl, cone, torus, at } from './primitives.js';
import { mat } from './materials.js';

const own = (color) => { const m = mat(color).clone(); return m; };
const WOOD = '#a87a56', WOOD_D = '#7d5a40';

export class HomeModel {
  constructor() {
    const g = new THREE.Group();
    this.root = g;
    this.mWall = own('#fff3e4'); this.mRoof = own('#f08a7e'); this.mDoor = own('#9a6a4c');
    // nền + bậc thềm
    g.add(at(rbox(5.4, 0.3, 4.6, '#e8dccb', 0.06), 0, 0.15, 0));
    g.add(at(rbox(1.6, 0.18, 0.7, '#d9ccb8', 0.05), 0, 0.09, 2.6));
    // tường
    g.add(at(rbox(4.8, 2.5, 3.8, this.mWall, 0.1), 0, 1.55, 0));
    // mái (lăng trụ tam giác = hình nón 4 cạnh dẹt)
    const roof = cone(3.9, 1.9, this.mRoof, 4); roof.rotation.y = Math.PI / 4; roof.scale.set(1.0, 1, 0.82); roof.position.y = 3.75; g.add(roof);
    g.add(at(rbox(5.3, 0.16, 4.3, this.mRoof, 0.05), 0, 2.86, 0));
    // cửa + cửa sổ
    g.add(at(rbox(1.0, 1.7, 0.1, this.mDoor, 0.04), 0, 1.15, 1.92));
    g.add(at(sphere(0.06, '#f6d36e', 6), 0.32, 1.1, 1.99));
    for (const x of [-1.55, 1.55]) {
      g.add(at(rbox(0.95, 0.85, 0.08, '#cfe8f2', 0.03), x, 1.7, 1.92));
      g.add(at(rbox(1.1, 0.1, 0.14, '#ffffff', 0.02), x, 1.25, 1.96));
    }
    // ---- vật phẩm (bật / tắt) ----
    const it = (id, ...parts) => { const p = new THREE.Group(); parts.forEach((x) => p.add(x)); p.visible = false; g.add(p); this.items[id] = p; return p; };
    this.items = {};
    it('mailbox', at(cyl(0.05, 0.05, 1.0, WOOD_D, 6), 1.9, 0.5, 3.9), at(rbox(0.45, 0.32, 0.6, '#d9506f', 0.08), 1.9, 1.1, 3.9), at(rbox(0.08, 0.22, 0.04, '#ffd34e', 0.02), 2.14, 1.25, 3.7));
    const fb = [];
    for (const x of [-1.55, 1.55]) { fb.push(at(rbox(1.0, 0.22, 0.3, WOOD, 0.04), x, 1.18, 2.08)); for (let k = 0; k < 4; k++) fb.push(at(sphere(0.1, ['#ff8fb1', '#ffd36e', '#c9a2ff', '#ffffff'][k], 6), x - 0.36 + k * 0.24, 1.36, 2.1)); }
    it('flowerbox', ...fb);
    const wr = torus(0.28, 0.07, '#6fae5f'); wr.position.set(0, 1.75, 2.0);
    it('wreath', wr, at(sphere(0.07, '#e8384f', 6), 0, 1.5, 2.04));
    this.lanternBulb = sphere(0.14, new THREE.MeshBasicMaterial({ color: '#ffd98a' }), 8);
    it('lantern', at(rbox(0.06, 0.4, 0.06, '#5a4a3a', 0.02), 0.85, 2.35, 2.05), at(this.lanternBulb, 0.85, 2.05, 2.08));
    this.smoke = [];
    const ch = it('chimney', at(rbox(0.6, 1.4, 0.6, '#c2735a', 0.06), 1.4, 3.9, -0.6));
    for (let i = 0; i < 3; i++) { const s = sphere(0.22, new THREE.MeshBasicMaterial({ color: '#f2efe9', transparent: true, opacity: 0.6 }), 8); s.position.set(1.4, 4.8 + i * 0.5, -0.6); ch.add(s); this.smoke.push(s); }
    it('bench', at(rbox(1.3, 0.1, 0.45, WOOD, 0.04), -1.7, 0.62, 2.7), at(rbox(1.3, 0.45, 0.08, WOOD, 0.03), -1.7, 0.9, 2.5), at(rbox(0.08, 0.3, 0.4, WOOD_D, 0.02), -2.25, 0.42, 2.7), at(rbox(0.08, 0.3, 0.4, WOOD_D, 0.02), -1.15, 0.42, 2.7));
    it('mat', at(rbox(1.1, 0.04, 0.55, '#c98f5a', 0.02), 0, 0.2, 3.0));
    const pots = [];
    [[0.95, 2.75], [1.3, 2.95], [-0.95, 2.75]].forEach(([x, z], i) => { pots.push(at(cyl(0.18, 0.14, 0.3, '#d98a6a', 8), x, 0.33, z)); pots.push(at(sphere(0.25 + i * 0.03, '#6fae5f', 8), x, 0.65, z)); });
    it('pots', ...pots);
    const fence = [];
    for (let i = 0; i <= 12; i++) { const x = -3.3 + i * 0.55; if (Math.abs(x) < 0.8) continue; fence.push(at(rbox(0.12, 0.7, 0.08, '#ffffff', 0.03), x, 0.35, 4.4)); }
    fence.push(at(rbox(2.6, 0.08, 0.05, '#ffffff', 0.02), -2.0, 0.5, 4.4), at(rbox(2.6, 0.08, 0.05, '#ffffff', 0.02), 2.0, 0.5, 4.4));
    for (const x of [-3.3, 3.3]) for (let k = 0; k <= 7; k++) fence.push(at(rbox(0.08, 0.7, 0.12, '#ffffff', 0.03), x, 0.35, 4.4 - k * 0.6));
    it('fence', ...fence);
    const arc = torus(0.95, 0.07, '#7fb36a'); arc.position.set(0, 1.0, 4.4);
    const ar = [arc];
    for (let k = 0; k < 9; k++) { const a = (k / 8) * Math.PI; ar.push(at(sphere(0.11, k % 2 ? '#ff8fb1' : '#ffffff', 6), Math.cos(a) * 0.95, 1.0 + Math.sin(a) * 0.95, 4.4)); }
    it('arch', ...ar);
    this.bulbs = [];
    const li = [];
    for (let k = 0; k < 11; k++) { const b = sphere(0.07, new THREE.MeshBasicMaterial({ color: ['#ffd36e', '#ff8fb1', '#8fd8ff'][k % 3] }), 6); b.position.set(-2.5 + k * 0.5, 2.78 - Math.sin((k / 10) * Math.PI) * 0.15, 2.18); li.push(b); this.bulbs.push(b); }
    it('lights', ...li);
    it('birdhouse', at(cyl(0.05, 0.05, 1.6, WOOD_D, 6), -3.0, 0.8, 1.2), at(rbox(0.4, 0.4, 0.4, '#9fd6f0', 0.05), -3.0, 1.75, 1.2), at(cone(0.38, 0.3, '#d9506f', 4), -3.0, 2.1, 1.2));
    it('swing', at(cyl(0.07, 0.08, 2.2, WOOD_D, 6), 3.4, 1.1, -0.6), at(cyl(0.07, 0.08, 2.2, WOOD_D, 6), 3.4, 1.1, 1.0), at(rbox(0.12, 0.12, 1.8, WOOD_D, 0.03), 3.4, 2.2, 0.2), at(rbox(0.55, 0.07, 0.4, WOOD, 0.02), 3.4, 0.55, 0.2), at(cyl(0.01, 0.01, 1.6, '#d9c4a0', 4), 3.25, 1.4, 0.2), at(cyl(0.01, 0.01, 1.6, '#d9c4a0', 4), 3.55, 1.4, 0.2));
    const cat = [];
    const body = sphere(0.22, '#e6a05a', 8); body.scale.set(1.4, 0.75, 1); body.position.set(0.55, 0.4, 2.55); cat.push(body);
    cat.push(at(sphere(0.15, '#e6a05a', 8), 0.85, 0.48, 2.6), at(cone(0.05, 0.1, '#e6a05a', 4), 0.8, 0.62, 2.6), at(cone(0.05, 0.1, '#e6a05a', 4), 0.92, 0.62, 2.6));
    this.catTail = at(cyl(0.035, 0.03, 0.4, '#e6a05a', 5), 0.22, 0.45, 2.55); this.catTail.rotation.z = 1.1; cat.push(this.catTail);
    it('cat', ...cat);
    // vùng chạm
    const hit = new THREE.Mesh(new THREE.BoxGeometry(6, 4.5, 6), new THREE.MeshBasicMaterial({ visible: false })); hit.position.set(0, 2, 1);
    g.add(hit);
    g.userData.pick = { kind: 'home' };
    this.t = 0;
  }

  /** look: { wall, roof, door (mã màu), items: [id] } */
  apply(look) {
    this.mWall.color.set(look.wall); this.mRoof.color.set(look.roof); this.mDoor.color.set(look.door);
    for (const [id, p] of Object.entries(this.items)) p.visible = look.items.includes(id);
  }

  update(dt, night = 0) {
    this.t += dt;
    const t = this.t;
    if (this.items.chimney.visible) this.smoke.forEach((s, i) => { const k = (t * 0.22 + i / 3) % 1; s.position.y = 4.7 + k * 1.8; s.material.opacity = 0.55 * (1 - k); s.scale.setScalar(0.7 + k * 1.3); });
    if (this.items.lantern.visible) this.lanternBulb.material.color.setHSL(0.11, 1, 0.55 + night * 0.25);
    if (this.items.lights.visible) this.bulbs.forEach((b, i) => { b.visible = night > 0.2 || Math.sin(t * 2 + i) > 0.3; });
    if (this.items.cat.visible) this.catTail.rotation.x = Math.sin(t * 1.6) * 0.3;
  }
}
