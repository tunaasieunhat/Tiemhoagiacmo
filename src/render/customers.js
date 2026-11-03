// Hiển thị khách hàng 3D: đi vào tiệm, xếp hàng, bong bóng yêu cầu + độ kiên nhẫn, rời đi.
import * as THREE from 'three';
import { FLOWERS } from '../../data/flowers.js';
import { buildCharacter } from '../models/character.js';
import { npcOf } from '../systems/shop.js';
import { ZONES } from './world.js';

const WALK = 3.2;
export const SHOP_ROT = 0.3; // phải khớp với góc xoay tiệm trong world.js
export const CUSTOMER_EXIT = new THREE.Vector3(21, 0, -0.5);

function shopFrame() {
  const c = ZONES.shop.center;
  const front = new THREE.Vector3(Math.sin(SHOP_ROT), 0, Math.cos(SHOP_ROT));
  const side = new THREE.Vector3(front.z, 0, -front.x);
  return { c, front, side, door: c.clone().addScaledVector(front, 2.6) };
}

export function spotPosition(i) {
  const { door, front, side } = shopFrame();
  // 3 chỗ hàng đầu, 2 chỗ hàng sau (khi nâng cấp quầy)
  if (i < 3) return door.clone().addScaledVector(front, 1.5).addScaledVector(side, (i - 1) * 1.35);
  return door.clone().addScaledVector(front, 2.9).addScaledVector(side, (i - 3.5) * 1.35);
}

export class CustomersView {
  constructor(scene) {
    this.scene = scene;
    this.root = new THREE.Group();
    scene.add(this.root);
    this.views = new Map(); // id -> view
    this.t = 0;
  }

  /** Đồng bộ với danh sách khách trong save */
  sync(save, instant = false) {
    const now = save.time.gameMinutes;
    const ids = new Set();
    for (const c of save.shop.customers) {
      ids.add(c.id);
      let v = this.views.get(c.id);
      if (!v) {
        v = this.create(c, instant);
        this.views.set(c.id, v);
      }
      const frac = Math.max(0, 1 - (now - c.arrivedAt) / c.patience);
      if (Math.abs(frac - v.frac) > 0.02) { v.frac = frac; drawBubble(v, c.request, frac); }
    }
    // khách đã bị xóa khỏi save mà chưa có hiệu ứng rời đi => cho rời đi lặng lẽ
    for (const [id, v] of this.views) if (!ids.has(id) && v.state !== 'leaving') this.leave(id, 'neutral');
  }

  create(c, instant) {
    const npc = npcOf(c.npc);
    const model = buildCharacter({ ...npc.look, hat: npc.look.hat ?? null });
    model.root.scale.setScalar(0.92);
    const target = spotPosition(c.spot);
    const start = instant ? target.clone() : CUSTOMER_EXIT.clone();
    model.root.position.copy(start);
    model.root.userData.pick = { kind: 'customer', id: c.id };
    // bong bóng
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 128;
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    const bubble = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }));
    bubble.scale.set(0.95, 0.95, 1);
    bubble.position.y = 2.35;
    bubble.renderOrder = 6;
    model.root.add(bubble);
    // bóng chân
    const sh = new THREE.Mesh(new THREE.CircleGeometry(0.34, 18), new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: 0.12, depthWrite: false }));
    sh.rotation.x = -Math.PI / 2; sh.position.y = 0.03;
    model.root.add(sh);
    this.root.add(model.root);
    const v = { model, bubble, canvas, tex, target, state: instant ? 'wait' : 'walk', frac: 2, phase: Math.random() * 6, heading: 0, emote: null };
    drawBubble(v, c.request, 1);
    return v;
  }

  /** mood: 'happy' | 'sad' | 'angry' | 'neutral' */
  leave(id, mood = 'neutral') {
    const v = this.views.get(id);
    if (!v) return;
    v.state = 'leaving';
    v.target = CUSTOMER_EXIT.clone();
    v.model.root.userData.pick = null;
    drawEmote(v, mood);
  }

  positionOf(id) {
    const v = this.views.get(id);
    return v ? v.model.root.position.clone() : spotPosition(1);
  }

  update(dt) {
    this.t += dt;
    for (const [id, v] of this.views) {
      const m = v.model;
      const pos = m.root.position;
      const d = Math.hypot(v.target.x - pos.x, v.target.z - pos.z);
      if (v.state === 'walk' || v.state === 'leaving') {
        if (d < 0.05) {
          if (v.state === 'leaving') { this.root.remove(m.root); v.tex.dispose(); this.views.delete(id); continue; }
          v.state = 'wait';
        } else {
          const step = Math.min(d, WALK * dt);
          pos.x += ((v.target.x - pos.x) / d) * step;
          pos.z += ((v.target.z - pos.z) / d) * step;
          face(v, v.target.x - pos.x, v.target.z - pos.z, dt);
          const w = this.t * 13 + v.phase;
          m.legL.position.z = Math.sin(w) * 0.1; m.legR.position.z = -Math.sin(w) * 0.1;
          m.armL.rotation.x = -Math.sin(w) * 0.5; m.armR.rotation.x = Math.sin(w) * 0.5;
          m.body.position.y = Math.abs(Math.sin(w)) * 0.06;
        }
      }
      if (v.state === 'wait') {
        // quay mặt về phía cửa tiệm, đứng nhún nhẹ
        const { door } = shopFrame();
        face(v, door.x - pos.x, door.z - pos.z, dt);
        m.legL.position.z *= 0.8; m.legR.position.z *= 0.8;
        m.armL.rotation.x *= 0.85; m.armR.rotation.x *= 0.85;
        m.body.position.y = Math.sin(this.t * 2 + v.phase) * 0.02;
        m.head.rotation.z = v.frac < 0.25 ? Math.sin(this.t * 6) * 0.08 : 0; // sốt ruột
      }
      v.bubble.position.y = 2.35 + Math.sin(this.t * 2.5 + v.phase) * 0.05;
    }
  }
}

function face(v, dx, dz, dt) {
  if (Math.abs(dx) + Math.abs(dz) < 1e-4) return;
  const want = Math.atan2(dx, dz);
  let diff = Math.atan2(Math.sin(want - v.heading), Math.cos(want - v.heading));
  v.heading += diff * Math.min(1, dt * 10);
  v.model.root.rotation.y = v.heading;
}

// ---------- vẽ bong bóng ----------
function drawBubble(v, req, frac) {
  const x = v.canvas.getContext('2d');
  x.clearRect(0, 0, 128, 128);
  // vòng kiên nhẫn
  const col = frac > 0.5 ? '#7cc27f' : frac > 0.25 ? '#f6c84a' : '#ec6b6b';
  x.fillStyle = '#ffffff';
  x.beginPath(); x.arc(64, 58, 48, 0, Math.PI * 2); x.fill();
  x.beginPath(); x.moveTo(54, 100); x.lineTo(64, 122); x.lineTo(74, 100); x.closePath(); x.fill();
  x.strokeStyle = '#f2d5c8'; x.lineWidth = 8;
  x.beginPath(); x.arc(64, 58, 48, 0, Math.PI * 2); x.stroke();
  x.strokeStyle = col; x.lineWidth = 8; x.lineCap = 'round';
  x.beginPath(); x.arc(64, 58, 48, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, frac)); x.stroke();
  // biểu tượng yêu cầu
  if (req.type === 'bouquet') {
    const fl = req.mustInclude ? FLOWERS[req.mustInclude.flower].colors.petal : '#f47a93';
    x.fillStyle = '#d9b48a';
    x.beginPath(); x.moveTo(40, 52); x.lineTo(88, 52); x.lineTo(64, 96); x.closePath(); x.fill();
    [[50, 44, fl], [64, 38, '#ffd34e'], [78, 44, '#c79cf2'], [57, 52, '#ffffff'], [71, 52, fl]].forEach(([cx, cy, c]) => flower(x, cx, cy, 9, c));
    x.fillStyle = '#f47a93'; x.beginPath(); x.ellipse(64, 76, 9, 5, 0, 0, Math.PI * 2); x.fill();
  } else {
    const c = FLOWERS[req.flower].colors.petal;
    if (req.type === 'single') {
      stem(x, 64, 62, 92); flower(x, 64, 48, 16, c);
    } else {
      stem(x, 50, 64, 92); stem(x, 78, 64, 92); flower(x, 50, 52, 11, c); flower(x, 78, 52, 11, c);
      x.fillStyle = '#6b4a3c'; x.font = 'bold 26px sans-serif'; x.textAlign = 'center'; x.fillText('×' + req.count, 64, 92);
    }
  }
  if (req.minQuality > 1) {
    x.fillStyle = '#f4b42a'; x.font = 'bold 20px sans-serif'; x.textAlign = 'center';
    x.fillText('★'.repeat(req.minQuality), 64, 30);
  }
  v.tex.needsUpdate = true;
}

function drawEmote(v, mood) {
  const x = v.canvas.getContext('2d');
  x.clearRect(0, 0, 128, 128);
  x.fillStyle = '#ffffff';
  x.beginPath(); x.arc(64, 58, 40, 0, Math.PI * 2); x.fill();
  if (mood === 'happy') {
    x.fillStyle = '#f4708c';
    x.beginPath(); x.moveTo(64, 82); x.bezierCurveTo(30, 58, 40, 30, 64, 46); x.bezierCurveTo(88, 30, 98, 58, 64, 82); x.fill();
  } else if (mood === 'angry' || mood === 'sad') {
    x.strokeStyle = mood === 'angry' ? '#ec6b6b' : '#6fbbe8'; x.lineWidth = 7; x.lineCap = 'round';
    x.beginPath(); x.arc(64, 74, 16, Math.PI * 1.15, Math.PI * 1.85); x.stroke();
    x.fillStyle = x.strokeStyle; x.beginPath(); x.arc(52, 50, 5, 0, 7); x.arc(76, 50, 5, 0, 7); x.fill();
  } else {
    x.fillStyle = '#9b7b6c'; [48, 64, 80].forEach((cx) => { x.beginPath(); x.arc(cx, 58, 5, 0, 7); x.fill(); });
  }
  v.tex.needsUpdate = true;
}

function flower(x, cx, cy, r, color) {
  x.fillStyle = color;
  x.strokeStyle = 'rgba(120,90,70,.35)'; x.lineWidth = 1.5;
  for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; x.beginPath(); x.arc(cx + Math.cos(a) * r * 0.6, cy + Math.sin(a) * r * 0.6, r * 0.55, 0, 7); x.fill(); x.stroke(); }
  x.fillStyle = '#ffe17a'; x.beginPath(); x.arc(cx, cy, r * 0.35, 0, 7); x.fill();
}
function stem(x, cx, y1, y2) { x.strokeStyle = '#5fae63'; x.lineWidth = 5; x.beginPath(); x.moveTo(cx, y1); x.lineTo(cx, y2); x.stroke(); }
