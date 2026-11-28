// 🎬 "Đạo diễn" cảnh truyện (GĐ20): lia máy quay, xếp chỗ diễn viên, bong bóng cảm xúc, cảnh hồi ức.
// Được gọi từ src/ui/cinema.js theo từng dòng kịch bản trong data/story.js.
import * as THREE from 'three';
import { ZONES } from './world.js';
import { SHOP_ROT } from './customers.js';
import { STORY_RULES } from '../../data/story.js';
import { EN } from '../../data/muien.js';
import { spotPos, homeOf } from '../systems/village.js';

// hướng "bên phải màn hình" và "về phía máy quay" trên mặt đất (camera nhìn từ góc +x +z)
const RIGHT = new THREE.Vector3(1, 0, -1).normalize();
const NEAR = new THREE.Vector3(1, 0, 1).normalize();

export class Director {
  constructor(game) {
    this.g = game;
    this.saved = null;
  }

  villager(id) { return this.g.villagers.list.find((v) => v.id === id) || null; }

  begin() {
    const g = this.g;
    g.setCine(true);
    g.select(null);
    const p = g.player;
    p.clearQueue();
    if (p.job) p.endAct();
    this.saved = { target: g.controls.target.clone(), zoom: g.controls.zoom, pos: p.root.position.clone(), heading: p.heading };
  }

  end() {
    const g = this.g;
    for (const v of g.villagers.list) if (v.stage) { v.stage = null; v.key = ''; v.snap = true; }
    g.storyView.reset();
    this.flashback(false);
    const p = g.player;
    if (this.saved) {
      p.root.position.copy(this.saved.pos);
      p.heading = this.saved.heading;
      p.root.rotation.y = this.saved.heading;
      g.controls.focusOn(this.saved.target, this.saved.zoom);
    }
    p.root.visible = true;
    g.setCine(false);
  }

  /** Vị trí trên mặt đất của 1 mục tiêu: 'shop' | 'you' | mã dân làng | mã diễn viên | [x, z] */
  posOf(t) {
    const g = this.g;
    if (Array.isArray(t)) return new THREE.Vector3(t[0], 0, t[1]);
    if (t === 'you') return g.player.root.position.clone().setY(0);
    if (t === 'shop') return ZONES.shop.center.clone().add(new THREE.Vector3(Math.sin(SHOP_ROT), 0, Math.cos(SHOP_ROT)).multiplyScalar(2.2));
    if (t === 'village') return new THREE.Vector3(0, 0, 34);
    if (t === 'shelf') return g.dreamWorld.shelfPos();
    if (t === 'lighthouse') return new THREE.Vector3(EN.lighthouse[0] - 2, 0, EN.lighthouse[1] + 2);
    const v = this.villager(t);
    if (v) return new THREE.Vector3(v.stage?.x ?? v.x, 0, v.stage?.z ?? v.z);
    return g.storyView.actorPos(t);
  }

  /** Lia máy quay tới p — đẩy tâm nhìn xuống một chút để nhân vật nằm phía trên khung thoại */
  focus(p, zoom = 1.8) {
    const z = zoom || this.g.controls.zoom;
    this.g.controls.focusOn(p.clone().addScaledVector(NEAR, 1.5 / z), z);
  }

  cam(target, zoom) {
    const p = this.posOf(target);
    if (p) this.focus(p, zoom);
  }

  /** Người chơi tới đứng nói chuyện với ai đó; cả hai quay mặt vào nhau */
  meet(id) {
    const g = this.g;
    let p;
    const v = this.villager(id);
    if (v) {
      // người đang ở trong nhà / đi vắng (khi xem lại cảnh) thì cho đứng trước cửa nhà mình
      if (!v.stage) {
        const out = v.mode === 'at' || v.mode === 'walk';
        const door = spotPos(`door_${homeOf(id)}`);
        v.stage = out || !door ? { x: v.x, z: v.z } : { x: door.x + 0.6, z: door.z + 0.6 };
      }
      p = new THREE.Vector3(v.stage.x, 0, v.stage.z);
    } else if (id === 'mo') {
      g.storyView.place('mo', STORY_RULES.moSpot[0], STORY_RULES.moSpot[1]);
      p = g.storyView.actorPos('mo');
    } else p = this.posOf(id);
    if (!p) return;
    // đứng chếch sang phải màn hình, lùi ra xa máy quay một chút để không che mất người kia
    const me = p.clone().addScaledVector(RIGHT, id === 'mo' ? 1.5 : 1.35).addScaledVector(NEAR, -0.15);
    const toMe = Math.atan2(me.x - p.x, me.z - p.z);
    if (v) v.stage.heading = toMe; else g.storyView.face(id, toMe);
    const pl = g.player;
    pl.root.position.copy(me);
    pl.root.visible = true;
    pl.heading = toMe + Math.PI;
    pl.root.rotation.y = pl.heading;
    this.focus(p.clone().lerp(me, 0.5), id === 'mo' ? 2.15 : 2.0);
  }

  /** face: quay mặt về phía ai ('mã') hoặc điểm nào ([x, z]) */
  place(id, x, z, face = null) {
    const g = this.g;
    let heading = null;
    if (face) { const f = this.posOf(face); if (f) heading = Math.atan2(f.x - x, f.z - z); }
    if (id === 'you') {
      const pl = g.player;
      pl.root.position.set(x, 0, z); pl.root.visible = !g.flash;
      if (heading != null) { pl.heading = heading; pl.root.rotation.y = heading; }
      return;
    }
    const v = this.villager(id);
    if (v) { v.stage = { ...(v.stage || {}), x, z, hidden: false }; if (heading != null) v.stage.heading = heading; return; }
    g.storyView.place(id, x, z, heading);
  }

  walk(id, x, z) {
    const v = this.villager(id);
    if (v || id === 'you') { this.place(id, x, z); return; }
    this.g.storyView.walk(id, x, z);
  }

  hide(id) {
    const g = this.g;
    if (id === 'you') { g.player.root.visible = false; return; }
    const v = this.villager(id);
    if (v) { v.stage = { ...(v.stage || { x: v.x, z: v.z }), hidden: true }; return; }
    g.storyView.hide(id);
  }

  emote(id, emoji) {
    const p = this.posOf(id);
    if (!p) return;
    const v = this.villager(id);
    p.y = id === 'mo' ? 1.75 : v?.kid ? 1.9 : 2.25;
    this.g.storyView.emote(p, emoji);
  }

  /** Ai đang nói: người chơi quay mặt về phía người đó */
  speaking(id) {
    const p = this.posOf(id);
    const pl = this.g.player;
    if (!p || !pl.root.visible) return;
    const d = p.sub(pl.root.position);
    if (d.lengthSq() < 0.01 || d.lengthSq() > 16) return;
    pl.heading = Math.atan2(d.x, d.z);
    pl.root.rotation.y = pl.heading;
  }

  /** Cảnh hồi ức: ẩn khách, dân làng, người chơi, sâu — chỉ còn diễn viên của hồi ức */
  flashback(on) {
    const g = this.g;
    g.flash = on;
    g.customers.root.visible = !on;
    g.villagers.root.visible = !on;
    g.player.root.visible = !on;
    g.storyView.flash = on;
  }
}
