// Dân làng đi lại theo giờ (GĐ11): đi theo đường đá tới chỗ làm việc, vào nhà thì ẩn; cửa sổ sáng khi chủ nhà ở nhà.
import * as THREE from 'three';
import { buildCharacter, buildTool } from '../models/character.js';
import { cyl, sphere, rbox, at } from '../models/primitives.js';
import { glow } from '../models/environment.js';
import { VILLAGE, ACTIVITIES, HOUSES } from '../../data/village.js';
import { VILLAGER_IDS, villagerInfo, desiredState, routeTo, spotPos, homeOf } from '../systems/village.js';
import { todaysFavor } from '../systems/favors.js';

const iconCache = new Map();
function iconMaterial(emoji) {
  if (iconCache.has(emoji)) return iconCache.get(emoji);
  const c = document.createElement('canvas');
  c.width = c.height = 96;
  const x = c.getContext('2d');
  x.fillStyle = 'rgba(255,250,243,.95)'; x.strokeStyle = '#f2d5c8'; x.lineWidth = 5;
  x.beginPath(); x.arc(48, 48, 40, 0, Math.PI * 2); x.fill(); x.stroke();
  x.font = '48px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(emoji, 48, 52);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false });
  iconCache.set(emoji, m);
  return m;
}

function buildProp(kind) {
  const g = new THREE.Group();
  if (kind === 'rod') {
    const rod = cyl(0.015, 0.025, 1.6, '#7a5238', 5); rod.rotation.x = -0.9; rod.position.set(0, 0.25, 0.55); g.add(rod);
    g.add(at(cyl(0.004, 0.004, 1.2, '#ffffff', 3), 0, 0.15, 1.15));
    g.add(at(sphere(0.04, '#e8384f', 6), 0, -0.45, 1.15));
  } else if (kind === 'can') g.add(buildTool('water'));
  else if (kind === 'book') g.add(at(rbox(0.22, 0.16, 0.05, '#6fb7e0', 0.01), 0, 0.02, 0.08));
  else if (kind === 'yarn') { g.add(at(sphere(0.09, '#f78fa7', 8), 0, 0, 0.1)); g.add(at(cyl(0.008, 0.008, 0.3, '#d9b48a', 3), 0.1, 0.05, 0.1)); }
  else if (kind === 'cup') g.add(at(cyl(0.06, 0.05, 0.1, '#ffffff', 8), 0, 0.03, 0.06));
  else if (kind === 'hammer') { g.add(at(cyl(0.02, 0.02, 0.32, '#a87458', 5), 0, -0.1, 0.05)); g.add(at(rbox(0.16, 0.07, 0.07, '#8d88a0', 0.02), 0, -0.25, 0.05)); }
  return g;
}
const PROP_OF = { fish: 'rod', water: 'can', read: 'book', knit: 'yarn', coffee: 'cup', work: 'hammer' };

export class VillagerView {
  constructor(scene, houses = {}) {
    this.root = new THREE.Group();
    scene.add(this.root);
    this.houses = houses; // { houseId: { windowMat } }
    this.list = VILLAGER_IDS.map((id) => {
      const info = villagerInfo(id);
      const ch = buildCharacter(info.look);
      const g = new THREE.Group();
      g.add(ch.root);
      const kid = id === 'be_su';
      ch.root.scale.setScalar(kid ? 0.78 : 0.92);
      g.userData.pick = { kind: 'villager', id };
      // vùng chạm rộng hơn người cho dễ bấm
      const hit = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1.9, 8), new THREE.MeshBasicMaterial({ visible: false }));
      hit.position.y = 0.95;
      g.add(hit);
      const icon = new THREE.Sprite(iconMaterial('💬'));
      icon.scale.set(0.55, 0.55, 1);
      icon.position.y = kid ? 1.75 : 2.05;
      icon.renderOrder = 6;
      icon.visible = false;
      g.add(icon);
      g.visible = false;
      this.root.add(g);
      return { id, info, ch, g, icon, kid, x: 0, z: 0, heading: 0, route: [], key: '', mode: 'absent', act: null, spot: null, prop: null, propKind: null, phase: Math.random() * 6 };
    });
    this.t = 0;
    this.lastHour = null;
  }

  /** ctx: { hour, weather, festivalId, save } */
  update(dt, ctx) {
    this.t += dt;
    // nhảy thời gian lớn (vắng mặt lâu, tua nhanh) => dịch chuyển thẳng tới nơi
    const dH = this.lastHour == null ? 0 : (((ctx.hour - this.lastHour) % 24) + 24) % 24;
    const jump = this.lastHour == null || (dH > 1 && dH < 23.9);
    this.lastHour = ctx.hour;
    for (const v of this.list) this.step(v, dt, ctx, jump);
    this.updateWindows(ctx);
  }

  step(v, dt, ctx, jump) {
    // 🎬 đang đóng cảnh truyện (GĐ20): đứng yên ở chỗ đạo diễn xếp, quay mặt theo hướng được giao
    if (v.stage) {
      const st = v.stage;
      v.x = st.x; v.z = st.z;
      if (st.heading != null) v.heading = st.heading;
      v.g.visible = !st.hidden;
      v.g.position.set(v.x, 0, v.z);
      let dh = v.heading - v.g.rotation.y;
      dh = Math.atan2(Math.sin(dh), Math.cos(dh));
      v.g.rotation.y += dh * Math.min(1, dt * 8);
      v.icon.visible = false;
      if (v.mode === 'at') this.animateActivity(v);
      else { const m = v.ch; m.legL.position.z = m.legR.position.z = 0; m.armL.rotation.x = m.armR.rotation.x = 0; m.body.position.y = Math.sin(this.t * 1.6 + v.phase) * 0.015; }
      return;
    }
    if (v.snap) { jump = true; v.snap = false; }
    const d = desiredState(v.id, ctx);
    const key = d.absent ? `absent:${d.reason}` : `${d.spot}|${d.act}`;
    if (key !== v.key) {
      v.key = key;
      v.state = d;
      if (d.absent) { v.mode = 'absent'; v.route = []; }
      else {
        const target = spotPos(d.spot);
        if (v.mode === 'absent' || v.mode === 'inside') {
          // ra khỏi nhà: xuất hiện ở cửa nhà mình
          const home = spotPos(`door_${homeOf(v.id)}`) || target;
          v.x = home.x; v.z = home.z;
        }
        // nhiều người cùng 1 chỗ (giếng, hàng rào...) => người đến sau đứng lệch sang bên
        v.off = null;
        if (!target.door && this.list.some((o) => o !== v && o.spot === d.spot && o.mode !== 'absent' && o.mode !== 'inside')) {
          const i = this.list.indexOf(v);
          v.off = { x: Math.cos(i * 1.9) * 0.75, z: Math.sin(i * 1.9) * 0.75 };
        }
        const tx = target.x + (v.off?.x || 0), tz = target.z + (v.off?.z || 0);
        if (jump || !target) { v.x = tx; v.z = tz; v.route = []; }
        else {
          v.route = routeTo(v.x, v.z, d.spot);
          if (v.route.length) v.route[v.route.length - 1] = { x: tx, z: tz };
        }
        v.mode = v.route.length ? 'walk' : (target.door ? 'inside' : 'at');
        v.act = d.act;
        v.spot = d.spot;
        this.setProp(v, null);
      }
    }
    const m = v.ch;
    if (v.mode === 'walk') {
      let move = VILLAGE.walkSpeed * dt;
      while (move > 0 && v.route.length) {
        const p = v.route[0];
        const dx = p.x - v.x, dz = p.z - v.z;
        const dist = Math.hypot(dx, dz);
        if (dist <= move) { v.x = p.x; v.z = p.z; v.route.shift(); move -= dist; }
        else { v.x += (dx / dist) * move; v.z += (dz / dist) * move; v.heading = Math.atan2(dx, dz); move = 0; }
      }
      const w = this.t * 9 + v.phase;
      this.setProp(v, null);
      m.legL.rotation.x = 0; m.legR.rotation.x = 0; m.armL.rotation.z = 0; m.armR.rotation.z = 0;
      m.body.position.y = Math.abs(Math.sin(w)) * 0.06;
      m.legL.position.z = Math.sin(w) * 0.1; m.legR.position.z = -Math.sin(w) * 0.1;
      m.armL.rotation.x = Math.sin(w) * 0.5; m.armR.rotation.x = -Math.sin(w) * 0.5;
      if (!v.route.length) {
        const target = spotPos(v.spot);
        v.mode = target?.door ? 'inside' : 'at';
      }
    } else if (v.mode === 'at') {
      const target = spotPos(v.spot);
      // đứng lệch để tán gẫu => quay mặt vào người kia; còn lại nhìn theo hướng của chỗ đó
      if (target && v.off && v.act === 'chat') v.heading = Math.atan2(-v.off.x, -v.off.z);
      else if (target) v.heading = THREE.MathUtils.degToRad(target.rot);
      this.animateActivity(v);
    }
    v.g.visible = v.mode === 'walk' || v.mode === 'at';
    v.g.position.set(v.x, 0, v.z);
    // quay mặt mượt
    let dh = v.heading - v.g.rotation.y;
    dh = Math.atan2(Math.sin(dh), Math.cos(dh));
    v.g.rotation.y += dh * Math.min(1, dt * 8);
    v.icon.visible = v.mode === 'at' || v.mode === 'walk';
    if (v.icon.visible) {
      const a = ACTIVITIES[v.act];
      // có việc muốn nhờ hôm nay => hiện 🙏 thay cho biểu tượng việc đang làm
      const favor = ctx.save && ctx.day && todaysFavor(ctx.save, v.id, ctx.day);
      // 📜 có chuyện của cốt truyện chính muốn nói => ưu tiên hiện 📜
      const story = ctx.storyWho?.has(v.id);
      if (v.mode === 'walk' && !favor && !story) v.icon.visible = false;
      const mat = iconMaterial(story ? '📜' : favor ? '🙏' : a?.icon || '💬');
      if (v.icon.material !== mat) v.icon.material = mat;
      v.icon.position.y = (v.kid ? 1.75 : 2.05) + Math.sin(this.t * 2 + v.phase) * 0.06 + (a?.anim === 'sit' ? -0.2 : 0);
    }
  }

  setProp(v, kind) {
    if (v.propKind === kind) return;
    if (v.prop) { v.prop.parent?.remove(v.prop); v.prop = null; }
    v.propKind = kind;
    if (kind) { v.prop = buildProp(kind); v.ch.hand.add(v.prop); }
  }

  animateActivity(v) {
    const m = v.ch;
    const a = ACTIVITIES[v.act] || {};
    const t = this.t + v.phase;
    this.setProp(v, PROP_OF[v.act] && (v.act !== 'work' || v.id === 'ong_ba') ? PROP_OF[v.act] : null);
    m.legL.position.z = 0; m.legR.position.z = 0;
    m.armL.rotation.x = 0; m.armR.rotation.x = 0;
    m.legL.rotation.x = 0; m.legR.rotation.x = 0;
    m.armL.rotation.z = 0; m.armR.rotation.z = 0;
    switch (a.anim) {
      case 'sit':
        m.body.position.y = -0.2;
        m.legL.rotation.x = -1.3; m.legR.rotation.x = -1.3;
        m.armR.rotation.x = -0.7 + Math.sin(t * 3) * 0.08;
        break;
      case 'fish':
        m.body.position.y = 0;
        m.armR.rotation.x = -0.6 + Math.sin(t * 0.8) * 0.05;
        break;
      case 'water':
        m.body.position.y = 0;
        m.armR.rotation.x = -0.9 + Math.sin(t * 1.5) * 0.15;
        break;
      case 'work':
        m.body.position.y = 0;
        m.armR.rotation.x = -1.2 + Math.abs(Math.sin(t * 4)) * 0.9;
        break;
      case 'play':
        m.body.position.y = Math.abs(Math.sin(t * 5)) * 0.25;
        m.armL.rotation.z = 0.4 + Math.sin(t * 5) * 0.3; m.armR.rotation.z = -0.4 - Math.sin(t * 5) * 0.3;
        break;
      default:
        m.body.position.y = Math.sin(t * 1.6) * 0.015;
        m.armR.rotation.x = v.act === 'chat' ? -0.4 + Math.sin(t * 2.5) * 0.25 : 0;
    }
  }

  /** Đèn cửa sổ: sáng khi có người ở trong và còn thức (theo độ tối của trời, giống đèn đường) */
  updateWindows(ctx) {
    const lamp = (glow.window.emissiveIntensity || 0) / 1.1; // 0 ban ngày … 1 ban đêm (do DayNight đặt)
    const inside = {};
    for (const v of this.list) {
      if (v.mode !== 'inside' || !v.state || v.state.absent) continue;
      const door = spotPos(v.spot)?.door;
      if (door && v.act !== 'sleep') inside[door] = true;
    }
    // quán cà phê sáng đèn khi đang mở bán
    if (this.list.some((v) => v.id === 'co_ngan' && v.act === 'serve' && !v.state?.absent)) inside.cafe = true;
    for (const [id, h] of Object.entries(this.houses)) {
      if (!h.windowMat) continue;
      h.windowMat.emissiveIntensity = lamp * (inside[id] ? 1.25 : 0.06);
    }
  }

  /** Người đang ở đâu, làm gì (cho bảng thông tin) */
  stateOf(id) {
    const v = this.list.find((q) => q.id === id);
    if (!v) return null;
    return { mode: v.mode, act: v.act, spot: v.spot, state: v.state, walking: v.mode === 'walk' };
  }

  housePick() { return Object.values(this.houses).map((h) => h.hit).filter(Boolean); }
}

export { HOUSES };
