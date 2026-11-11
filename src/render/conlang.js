// 🌫️ Cồn Lặng (GĐ22): làng chài trong sương phía tây đảo chính, nối bằng đường đá.
// Khi chưa mở: cả cồn bị phủ kín sương (chạm vào chỉ báo "sương dày quá"). Sương mỏng dần theo cốt truyện.
// File này cũng vẽ các điểm 🎣 chỗ câu cá trên toàn bản đồ (pick 'fishspot').
import * as THREE from 'three';
import { rbox, sphere, cyl, cone, at, textSprite } from '../models/primitives.js';
import { FISH_SPOTS } from '../../data/fishing.js';

export const CON = { center: [-41, 6], radius: 11, camRadius: 9.5, lighthouse: [-34.5, -1.6], wreck: [-46.6, -7.4], pier: [-41, 17] };

const std = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.9, ...extra });
const WOOD = '#a88a6c', WOOD_D = '#7a6248';

function softSprite(inner, outer, size) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(64, 64, 4, 64, 64, 62);
  g.addColorStop(0, inner); g.addColorStop(0.55, outer); g.addColorStop(1, 'rgba(236,240,242,0)');
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false }));
  s.scale.set(size, size * 0.6, 1);
  return s;
}

function emojiSprite(emoji) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(64, 64, 6, 64, 64, 62);
  g.addColorStop(0, 'rgba(190,236,255,.95)'); g.addColorStop(0.5, 'rgba(160,220,250,.45)'); g.addColorStop(1, 'rgba(160,220,250,0)');
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  x.font = '58px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(emoji, 64, 68);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false, depthTest: false }));
}

export class ConLangView {
  constructor(scene) {
    this.root = new THREE.Group();
    scene.add(this.root);
    this.t = 0;
    this.key = '';
    const [cx, cz] = CON.center, R = CON.radius;
    // ----- cồn -----
    this.root.add(at(cyl(R, R - 1.2, 1.4, '#cfc3ad', 44, { cast: false, receive: true }), cx, -0.72, cz));
    this.root.add(at(cyl(R + 0.15, R + 0.15, 0.2, std('#b9c4ae'), 44, { cast: false, receive: true }), cx, -0.1, cz));
    // ----- đường đá nối đảo chính -----
    this.stones = new THREE.Group();
    for (let i = 0; i < 12; i++) {
      const k = i / 11, s = cyl(0.55 + (i % 3) * 0.08, 0.65, 0.5, '#aaa59c', 7, { cast: false, receive: true });
      s.position.set(-24.6 + (-30.4 + 24.6) * k, -0.3, 5.3 + 0.8 * k + Math.sin(i * 1.7) * 0.25);
      s.rotation.y = i; this.stones.add(s);
    }
    this.root.add(this.stones);
    // ----- cầu tàu + thuyền của chú Lưới -----
    const [px, pz] = CON.pier;
    for (let i = 0; i < 10; i++) this.root.add(at(rbox(1.5, 0.1, 0.46, i % 2 ? WOOD : '#b89a7a', 0.03), px, 0.02, pz - 0.6 + i * 0.5));
    for (const z of [pz + 0.8, pz + 3.6]) for (const x of [px - 0.7, px + 0.7]) this.root.add(at(cyl(0.08, 0.1, 1.6, WOOD_D, 6), x, -0.4, z));
    this.luoiBoat = new THREE.Group();
    const hull = rbox(2.2, 0.42, 0.9, '#8c7660', 0.2); hull.position.y = 0.36; this.luoiBoat.add(hull);
    this.luoiBoat.add(at(rbox(1.8, 0.1, 0.6, '#c9b596', 0.03), 0, 0.54, 0));
    this.luoiBoat.position.set(px + 2.0, -1.0, pz + 2.6); this.luoiBoat.rotation.y = 1.2;
    this.root.add(this.luoiBoat);
    // áo tơi vắt trên cọc (kết "Ở lại trong sương")
    this.coat = at(cone(0.28, 0.6, '#b8a888', 7), px + 0.7, 0.75, pz + 3.6); this.coat.visible = false; this.root.add(this.coat);
    // ----- đầm nước lợ -----
    this.root.add(at(cyl(2.5, 2.5, 0.06, std('#8fb8b0', { roughness: 0.4 }), 24, { cast: false, receive: true }), -46.5, 0.03, 3.6));
    for (let i = 0; i < 9; i++) { const r = cyl(0.03, 0.03, 0.8 + (i % 3) * 0.2, '#8fa77a', 4); r.position.set(-46.5 + Math.cos(i * 0.7) * 2.6, 0.4, 3.6 + Math.sin(i * 0.7) * 2.6); this.root.add(r); }
    // ----- rặng đá + xác thuyền -----
    for (const [x, z, s] of [[-44.6, -5.6, 0.9], [-46.2, -6.4, 1.2], [-47.6, -7.8, 1.0], [-45.4, -8.2, 0.8], [-48.4, -6.0, 0.7], [-43.6, -6.8, 0.6]]) {
      const r = sphere(1, '#5f6268', 7); r.scale.set(s * 1.2, s * 0.7, s); r.position.set(x, -0.5, z); this.root.add(r);
    }
    this.wreck = new THREE.Group();
    const wh = rbox(2.4, 0.4, 0.9, '#5d5348', 0.18); wh.rotation.z = 0.35; wh.position.y = 0.1; this.wreck.add(wh);
    for (let i = 0; i < 5; i++) { const rib = rbox(0.08, 0.7, 0.9, '#4d443b', 0.02); rib.position.set(-0.9 + i * 0.45, 0.45 + i * 0.14, 0); rib.rotation.z = 0.35; this.wreck.add(rib); }
    this.wreck.position.set(CON.wreck[0], -0.45, CON.wreck[1]); this.wreck.rotation.y = 0.7;
    this.wreck.visible = false;
    this.root.add(this.wreck);
    this.wreckFlower = at(sphere(0.14, new THREE.MeshBasicMaterial({ color: '#ffffff' }), 8), CON.wreck[0] + 0.3, 0.35, CON.wreck[1] + 0.2); this.wreckFlower.visible = false; this.root.add(this.wreckFlower);
    // ----- hải đăng đổ nát -----
    const [lx, lz] = CON.lighthouse;
    const lh = new THREE.Group(); lh.position.set(lx, 0, lz);
    lh.add(at(cyl(0.85, 1.15, 2.6, '#d9d4c8', 10), 0, 1.3, 0));
    const broken = cyl(0.75, 0.85, 0.9, '#cfc9bc', 10); broken.position.set(0.12, 2.9, 0); broken.rotation.z = 0.18; lh.add(broken);
    for (const [x, z] of [[1.4, 0.6], [-1.2, 1.0], [0.8, -1.3]]) lh.add(at(rbox(0.6, 0.4, 0.5, '#c9c3b6', 0.1), x, 0.2, z));
    this.lampBulb = at(sphere(0.26, new THREE.MeshBasicMaterial({ color: '#fff3b8' }), 10), 0.1, 3.55, 0); lh.add(this.lampBulb);
    this.lampGlow = softSprite('rgba(255,243,184,.9)', 'rgba(255,233,160,.4)', 9); this.lampGlow.material.blending = THREE.AdditiveBlending; this.lampGlow.scale.set(9, 9, 1); this.lampGlow.position.set(0.1, 3.55, 0); lh.add(this.lampGlow);
    this.root.add(lh);
    // ----- quầy cá của Nhum -----
    const stall = new THREE.Group(); stall.position.set(-35.9, 0, 3.4); stall.rotation.y = -0.5;
    stall.add(at(rbox(2.0, 0.1, 0.9, WOOD, 0.03), 0, 0.8, 0));
    for (const x of [-0.9, 0.9]) { stall.add(at(cyl(0.05, 0.05, 0.8, WOOD_D, 5), x, 0.4, 0.35)); stall.add(at(cyl(0.05, 0.05, 2.0, WOOD_D, 5), x, 1.0, -0.35)); }
    stall.add(at(rbox(2.2, 0.08, 1.1, '#8fb7b0', 0.03), 0, 2.0, 0));
    ['#9fc3d9', '#c9d6dd', '#f0b38a', '#a8c8b8'].forEach((c, i) => { const f = sphere(0.16, c, 7); f.scale.set(1.6, 0.6, 0.8); f.position.set(-0.6 + i * 0.4, 0.92, 0.05); stall.add(f); });
    stall.add(at(cyl(0.3, 0.26, 0.4, '#6f8fa8', 10), 1.35, 0.2, 0.3));
    const hit = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.4, 1.6), new THREE.MeshBasicMaterial({ visible: false })); hit.position.y = 1.2; stall.add(hit);
    stall.userData.pick = { kind: 'fishstall' };
    this.stall = stall; this.root.add(stall);
    // lưới phơi
    for (const [x, z] of [[-44.9, 10.4], [-46.2, 9.0]]) { this.root.add(at(cyl(0.04, 0.05, 1.5, WOOD_D, 5), x, 0.75, z)); }
    const net = rbox(1.9, 0.9, 0.04, new THREE.MeshStandardMaterial({ color: '#d9d2c2', transparent: true, opacity: 0.55 }), 0.02); net.position.set(-45.55, 0.95, 9.7); net.rotation.y = 0.82; this.root.add(net);
    // ----- sương -----
    this.fogs = [];
    for (let i = 0; i < 26; i++) {
      const f = softSprite('rgba(244,247,248,.98)', 'rgba(236,241,243,.62)', 13 + (i % 4) * 3);
      const a = i * 2.399, r = (i % 5) * 2.6;
      f.userData = { x: cx + Math.cos(a) * r, z: cz + Math.sin(a) * r, y: 1.2 + (i % 4) * 1.1, ph: i * 1.1 };
      f.renderOrder = 8;
      this.fogs.push(f); this.root.add(f);
    }
    // vùng chạm khi cồn còn bị sương phủ kín
    this.wall = new THREE.Mesh(new THREE.SphereGeometry(R + 1.5, 12, 8), new THREE.MeshBasicMaterial({ visible: false }));
    this.wall.position.set(cx, 1, cz);
    this.wall.userData.pick = { kind: 'fogwall' };
    this.root.add(this.wall);
    this.label = textSprite('Cồn Lặng', { sub: 'Làng chài trong sương', scale: 0.9 });
    this.label.position.set(cx, 6.2, cz - 5);
    this.root.add(this.label);
    // ----- điểm câu cá 🎣 (toàn bản đồ) -----
    this.spots = {};
    for (const [id, sp] of Object.entries(FISH_SPOTS)) {
      const g = new THREE.Group();
      const s = emojiSprite('🎣'); s.scale.set(1.3, 1.3, 1); s.renderOrder = 7; g.add(s);
      const h = new THREE.Mesh(new THREE.SphereGeometry(0.9, 8, 6), new THREE.MeshBasicMaterial({ visible: false })); g.add(h);
      g.position.set(sp.at[0], 1.25, sp.at[1]);
      g.userData.pick = { kind: 'fishspot', id };
      g.userData.sprite = s; g.userData.phase = Object.keys(this.spots).length;
      g.visible = false;
      this.spots[id] = g; this.root.add(g);
    }
  }

  /**
   * st: { open (đã vào sương), fog 0..1 độ dày sương, fishing (đã biết câu), spots: { id: bật/tắt },
   *       wreck, lamp, luoiGone, flower }
   */
  sync(st) {
    const key = JSON.stringify(st);
    if (key === this.key) return;
    this.key = key;
    this.fogAmt = st.fog;
    this.wall.visible = !st.open;
    this.label.visible = !!st.open;
    this.stall.visible = !!st.open;
    this.wreck.visible = !!st.wreck;
    this.wreckFlower.visible = !!st.flower;
    this.lampOn = !!st.lamp;
    this.luoiBoat.visible = !st.luoiGone;
    this.coat.visible = !!st.luoiGone;
    for (const [id, g] of Object.entries(this.spots)) g.visible = !!st.fishing && !!st.spots[id];
  }

  /** Danh sách điểm câu đang hiện (để dò chạm theo màn hình) */
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
    for (const f of this.fogs) {
      f.position.set(f.userData.x + Math.sin(t * 0.1 + f.userData.ph) * 1.8, f.userData.y, f.userData.z + Math.cos(t * 0.08 + f.userData.ph) * 1.4);
      f.material.opacity = (this.fogAmt ?? 1) * (0.82 + 0.18 * Math.sin(t * 0.25 + f.userData.ph));
      f.visible = f.material.opacity > 0.02;
    }
    this.lampBulb.visible = this.lampOn;
    this.lampGlow.visible = this.lampOn;
    if (this.lampOn) this.lampGlow.material.opacity = 0.4 + 0.5 * night + Math.sin(t * 2) * 0.05;
    if (this.luoiBoat.visible) this.luoiBoat.position.y = -1.0 + Math.sin(t * 1.3) * 0.05;
    for (const g of Object.values(this.spots)) {
      if (!g.visible) continue;
      g.userData.sprite.visible = !hide;
      g.position.y = 1.25 + Math.sin(t * 2 + g.userData.phase) * 0.12;
    }
  }
}
