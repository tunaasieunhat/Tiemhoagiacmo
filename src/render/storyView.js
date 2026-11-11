// 📜 Phần 3D của cốt truyện (GĐ20): điểm sáng chạm được trên bản đồ, bé Mơ, diễn viên hồi ức, bong bóng cảm xúc.
import * as THREE from 'three';
import { buildCharacter } from '../models/character.js';
import { CAST, STORY_RULES } from '../../data/story.js';

const texCache = new Map();
function emojiMaterial(emoji, { bubble = false } = {}) {
  const key = emoji + (bubble ? '|b' : '');
  if (texCache.has(key)) return texCache.get(key);
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const x = c.getContext('2d');
  if (bubble) {
    x.fillStyle = 'rgba(255,255,255,.96)'; x.strokeStyle = '#f2b6a0'; x.lineWidth = 6;
    x.beginPath(); x.arc(64, 58, 48, 0, Math.PI * 2); x.fill(); x.stroke();
    x.beginPath(); x.moveTo(52, 100); x.lineTo(64, 124); x.lineTo(78, 100); x.closePath(); x.fill();
  } else {
    const g = x.createRadialGradient(64, 64, 6, 64, 64, 62);
    g.addColorStop(0, 'rgba(255,246,190,.95)'); g.addColorStop(0.5, 'rgba(255,236,150,.4)'); g.addColorStop(1, 'rgba(255,236,150,0)');
    x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  }
  x.font = `${bubble ? 58 : 60}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(emoji, 64, bubble ? 62 : 68);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false, depthTest: false });
  texCache.set(key, m);
  return m;
}

function haloMaterial(color = '#bff5e6') {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(64, 64, 4, 64, 64, 62);
  g.addColorStop(0, 'rgba(255,255,255,.5)'); g.addColorStop(0.4, color + '66'); g.addColorStop(1, color + '00');
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
}

/** Bé Mơ: nhân vật chibi nhỏ xíu, phát sáng, lơ lửng */
function buildMo() {
  const g = new THREE.Group();
  const ch = buildCharacter(CAST.mo.look);
  ch.root.scale.setScalar(0.5);
  ch.root.traverse((o) => {
    if (!o.isMesh) return;
    o.castShadow = false;
    o.material = o.material.clone();
    o.material.emissive = o.material.color.clone();
    o.material.emissiveIntensity = 0.55;
    o.material.transparent = true;
    o.material.opacity = 0.9;
  });
  // bông hoa cài tóc
  const pin = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), new THREE.MeshBasicMaterial({ color: '#fff7c8' }));
  pin.position.set(0.3, 1.42, 0.2);
  ch.root.add(pin);
  g.add(ch.root);
  const halo = new THREE.Sprite(haloMaterial('#bff5e6'));
  halo.scale.set(1.9, 1.9, 1);
  halo.position.y = 0.42;
  g.add(halo);
  // vùng chạm rộng
  const hit = new THREE.Mesh(new THREE.SphereGeometry(0.75, 8, 6), new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.y = 0.45;
  g.add(hit);
  g.userData.pick = { kind: 'mo' };
  return { g, ch, halo };
}

export class StoryView {
  constructor(scene) {
    this.root = new THREE.Group();
    scene.add(this.root);
    this.markers = new Map(); // scene id -> sprite group
    this.key = '';
    this.t = 0;
    this.emotes = [];
    this.actors = {}; // diễn viên chỉ có trong cảnh (vd bà Diệp trong hồi ức)
    const mo = buildMo();
    this.mo = { ...mo, x: STORY_RULES.moSpot[0], z: STORY_RULES.moSpot[1], tx: null, tz: null, heading: 0.6, shown: false, forced: false, alpha: 0 };
    this.mo.g.visible = false;
    this.root.add(this.mo.g);
  }

  /** trig: các điểm kích hoạt đang mở; moOn: Mơ có hiện không */
  sync(trig, moOn) {
    const spots = trig.filter((t) => t.via === 'spot');
    const key = spots.map((t) => t.scene).join(',');
    if (key !== this.key) {
      this.key = key;
      for (const [id, m] of this.markers) if (!spots.some((t) => t.scene === id)) { this.root.remove(m); this.markers.delete(id); }
      for (const t of spots) {
        if (this.markers.has(t.scene)) continue;
        const g = new THREE.Group();
        const s = new THREE.Sprite(emojiMaterial(t.icon || '✨'));
        s.scale.set(1.6, 1.6, 1);
        s.renderOrder = 7;
        g.add(s);
        const hit = new THREE.Mesh(new THREE.SphereGeometry(0.8, 8, 6), new THREE.MeshBasicMaterial({ visible: false }));
        g.add(hit);
        g.position.set(t.at[0], t.at[1], t.at[2]);
        g.userData.pick = { kind: 'story', scene: t.scene };
        g.userData.baseY = t.at[1];
        g.userData.phase = this.markers.size * 1.3;
        g.userData.sprite = s;
        this.root.add(g);
        this.markers.set(t.scene, g);
      }
    }
    this.mo.shown = !!moOn;
  }

  /** Vị trí 1 diễn viên của cốt truyện (mo, diep...) hoặc null */
  actorPos(id) {
    if (id === 'mo') return new THREE.Vector3(this.mo.x, 0, this.mo.z);
    const a = this.actors[id];
    return a ? new THREE.Vector3(a.x, 0, a.z) : null;
  }

  has(id) { return id === 'mo' || !!CAST[id]?.look; }

  /** Đặt diễn viên vào chỗ (tạo mới nếu chưa có) */
  place(id, x, z, heading = null) {
    if (id === 'mo') {
      Object.assign(this.mo, { x, z, tx: null, tz: null, forced: true });
      if (heading != null) this.mo.heading = heading;
      return;
    }
    let a = this.actors[id];
    if (!a) {
      const look = CAST[id]?.look;
      if (!look) return;
      const ch = buildCharacter(look);
      ch.root.scale.setScalar(0.94);
      this.root.add(ch.root);
      a = this.actors[id] = { ch, x, z, heading: 0.6, tx: null, tz: null };
    }
    Object.assign(a, { x, z, tx: null, tz: null });
    if (heading != null) a.heading = heading;
    a.ch.root.visible = true;
  }

  walk(id, x, z) {
    const a = id === 'mo' ? this.mo : this.actors[id];
    if (a) { a.tx = x; a.tz = z; }
  }

  face(id, heading) {
    const a = id === 'mo' ? this.mo : this.actors[id];
    if (a) a.heading = heading;
  }

  hide(id) {
    if (id === 'mo') { this.mo.forced = false; return; }
    const a = this.actors[id];
    if (a) a.ch.root.visible = false;
  }

  /** Hết cảnh: dọn diễn viên tạm, Mơ về chỗ cũ */
  reset() {
    for (const a of Object.values(this.actors)) this.root.remove(a.ch.root);
    this.actors = {};
    Object.assign(this.mo, { x: STORY_RULES.moSpot[0], z: STORY_RULES.moSpot[1], tx: null, tz: null, forced: false, heading: 0.6 });
  }

  /** Bong bóng cảm xúc bay lên trên đầu (pos: THREE.Vector3 chỗ đầu nhân vật) */
  emote(pos, emoji) {
    const s = new THREE.Sprite(emojiMaterial(emoji, { bubble: true }).clone());
    s.position.copy(pos);
    s.scale.set(0.01, 0.01, 1);
    s.renderOrder = 9;
    this.root.add(s);
    this.emotes.push({ s, t: 0, y: pos.y });
  }

  update(dt, night = 1) {
    this.t += dt;
    for (const g of this.markers.values()) {
      g.visible = !this.hideMarkers; // đang chiếu cảnh thì ẩn điểm sáng
      g.position.y = g.userData.baseY + Math.sin(this.t * 2.2 + g.userData.phase) * 0.14;
      const k = 1.6 + Math.sin(this.t * 3.1 + g.userData.phase) * 0.18;
      g.userData.sprite.scale.set(k, k, 1);
    }
    // Mơ
    const m = this.mo;
    const want = (m.shown || m.forced) && !this.flash ? 1 : 0;
    m.alpha += (want - m.alpha) * Math.min(1, dt * 3);
    m.g.visible = m.alpha > 0.03;
    if (m.g.visible) {
      this.moveActor(m, dt, 2.4);
      m.g.position.set(m.x + Math.sin(this.t * 0.7) * 0.12, 0.75 + Math.sin(this.t * 1.8) * 0.12, m.z + Math.cos(this.t * 0.55) * 0.1);
      this.turn(m.g, m.heading, dt);
      m.g.scale.setScalar(0.4 + 0.6 * m.alpha);
      const hs = 1.75 + Math.sin(this.t * 2.6) * 0.18;
      m.halo.scale.set(hs, hs, 1);
      m.halo.material.opacity = m.alpha * (0.45 + 0.35 * Math.max(night, 0.35));
      m.ch.armL.rotation.z = 0.5 + Math.sin(this.t * 2) * 0.15;
      m.ch.armR.rotation.z = -0.5 - Math.sin(this.t * 2) * 0.15;
      m.ch.legL.rotation.x = 0.25; m.ch.legR.rotation.x = 0.1;
    }
    for (const a of Object.values(this.actors)) {
      if (!a.ch.root.visible) continue;
      const moving = this.moveActor(a, dt, 1.7);
      a.ch.root.position.set(a.x, 0, a.z);
      this.turn(a.ch.root, a.heading, dt);
      const w = this.t * 9;
      a.ch.body.position.y = moving ? Math.abs(Math.sin(w)) * 0.06 : Math.sin(this.t * 1.8) * 0.015;
      a.ch.legL.position.z = moving ? Math.sin(w) * 0.1 : 0; a.ch.legR.position.z = moving ? -Math.sin(w) * 0.1 : 0;
      a.ch.armR.rotation.x = moving ? -Math.sin(w) * 0.5 : -0.5 + Math.sin(this.t * 1.4) * 0.12;
    }
    // bong bóng cảm xúc: bật ra, đứng 1,2 giây rồi tan
    for (const e of [...this.emotes]) {
      e.t += dt;
      const k = e.t < 0.18 ? e.t / 0.18 : 1;
      const out = e.t > 1.3 ? Math.max(0, 1 - (e.t - 1.3) / 0.3) : 1;
      const sc = 0.72 * (k < 1 ? 0.4 + 0.75 * k : 1 + Math.sin(Math.min(1, (e.t - 0.18) * 6) * Math.PI) * 0.12);
      e.s.scale.set(sc, sc, 1);
      e.s.position.y = e.y + Math.min(0.25, e.t * 0.5);
      e.s.material.opacity = out;
      if (e.t > 1.6) { this.root.remove(e.s); e.s.material.dispose(); this.emotes.splice(this.emotes.indexOf(e), 1); }
    }
  }

  moveActor(a, dt, speed) {
    if (a.tx == null) return false;
    const dx = a.tx - a.x, dz = a.tz - a.z, d = Math.hypot(dx, dz);
    if (d < 0.05) { a.tx = a.tz = null; return false; }
    const st = Math.min(d, speed * dt);
    a.x += (dx / d) * st; a.z += (dz / d) * st;
    a.heading = Math.atan2(dx, dz);
    return true;
  }

  turn(obj, heading, dt) {
    let dh = heading - obj.rotation.y;
    dh = Math.atan2(Math.sin(dh), Math.cos(dh));
    obj.rotation.y += dh * Math.min(1, dt * 8);
  }
}
