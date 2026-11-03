// Điều khiển nhân vật chibi: đi tới ô đất rồi làm thao tác (có hàng đợi).
import * as THREE from 'three';
import { PLAYER } from '../../data/config.js';
import { buildCharacter, buildTool } from '../models/character.js';

const MAX_QUEUE = 9;

export class Player {
  constructor(scene, avatar, startPos) {
    this.scene = scene;
    this.model = buildCharacter(avatar);
    this.root = this.model.root;
    this.root.position.copy(startPos);
    scene.add(this.root);
    this.queue = [];       // [{ target, lookAt, tool, run, key }]
    this.job = null;
    this.phase = 'idle';   // idle | walk | act
    this.t = 0;
    this.actT = 0;
    this.heading = 0;
    this.toolMesh = null;
    this.speedMult = 1;  // nâng cấp giày
    this.actionMult = 1; // nâng cấp găng tay
    // bóng tròn dưới chân
    const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.38, 20), new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: 0.12, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.03;
    this.root.add(shadow);
  }

  setAvatar(avatar) {
    const pos = this.root.position.clone();
    const rot = this.root.rotation.y;
    this.scene.remove(this.root);
    const shadow = this.root.children.find((c) => c.geometry?.type === 'CircleGeometry');
    this.model = buildCharacter(avatar);
    this.root = this.model.root;
    if (shadow) this.root.add(shadow);
    this.root.position.copy(pos);
    this.root.rotation.y = rot;
    this.scene.add(this.root);
  }

  /** Thêm việc. key dùng để tránh xếp trùng cùng 1 ô */
  enqueue(job) {
    if (job.key && (this.job?.key === job.key || this.queue.some((j) => j.key === job.key))) return false;
    if (this.queue.length >= MAX_QUEUE) return false;
    this.queue.push(job);
    return true;
  }

  clearQueue() { this.queue.length = 0; }

  get busy() { return !!this.job || this.queue.length > 0; }

  /** Điểm đứng cạnh ô (về phía nhân vật đang đứng) */
  static standPoint(from, tilePos, dist = 0.85) {
    const dir = new THREE.Vector3(from.x - tilePos.x, 0, from.z - tilePos.z);
    if (dir.lengthSq() < 1e-4) dir.set(1, 0, 1);
    dir.normalize();
    // ưu tiên đứng chéo phía camera để không che mất cây
    dir.add(new THREE.Vector3(0.35, 0, 0.35)).normalize();
    return tilePos.clone().addScaledVector(dir, dist).setY(0);
  }

  update(dt) {
    this.t += dt;
    const m = this.model;
    if (!this.job && this.queue.length) {
      this.job = this.queue.shift();
      this.job.target = Player.standPoint(this.root.position, this.job.lookAt);
      this.phase = 'walk';
    }

    if (this.phase === 'walk' && this.job) {
      const pos = this.root.position;
      const to = this.job.target;
      const d = Math.hypot(to.x - pos.x, to.z - pos.z);
      if (d < 0.05) {
        this.startAct();
      } else {
        const step = Math.min(d, PLAYER.walkSpeed * this.speedMult * dt);
        pos.x += ((to.x - pos.x) / d) * step;
        pos.z += ((to.z - pos.z) / d) * step;
        this.faceTowards(to.x - pos.x, to.z - pos.z, dt);
        const w = this.t * 14 * Math.sqrt(this.speedMult);
        m.legL.position.z = Math.sin(w) * 0.1;
        m.legR.position.z = -Math.sin(w) * 0.1;
        m.armL.rotation.x = -Math.sin(w) * 0.6;
        m.armR.rotation.x = Math.sin(w) * 0.6;
        m.body.position.y = Math.abs(Math.sin(w)) * 0.07;
      }
    } else if (this.phase === 'act' && this.job) {
      this.actT += dt;
      const k = this.actT / (PLAYER.actionSeconds / this.actionMult);
      const lp = this.job.lookAt;
      this.faceTowards(lp.x - this.root.position.x, lp.z - this.root.position.z, dt);
      m.armR.rotation.x = -1.2 - Math.sin(k * Math.PI * 2) * 0.5;
      m.body.position.y = Math.sin(k * Math.PI) * 0.06;
      m.head.rotation.x = 0.15;
      if (!this.job.done && k >= 0.5) {
        this.job.done = true;
        try { this.job.run?.(); } catch (e) { console.error(e); }
      }
      if (k >= 1) this.endAct();
    } else {
      // đứng yên: thở nhẹ
      m.body.position.y = Math.sin(this.t * 2.2) * 0.02;
      m.legL.position.z *= 0.8; m.legR.position.z *= 0.8;
      m.armL.rotation.x *= 0.85; m.armR.rotation.x *= 0.85;
      m.head.rotation.x *= 0.9;
      m.head.rotation.y = Math.sin(this.t * 0.7) * 0.15;
    }
  }

  faceTowards(dx, dz, dt) {
    if (Math.abs(dx) + Math.abs(dz) < 1e-4) return;
    const want = Math.atan2(dx, dz);
    let diff = want - this.heading;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    this.heading += diff * Math.min(1, dt * 12);
    this.root.rotation.y = this.heading;
  }

  startAct() {
    this.phase = 'act';
    this.actT = 0;
    this.model.legL.position.z = this.model.legR.position.z = 0;
    if (this.toolMesh) this.model.hand.remove(this.toolMesh);
    this.toolMesh = buildTool(this.job.tool);
    this.model.hand.add(this.toolMesh);
  }

  endAct() {
    if (this.toolMesh) { this.model.hand.remove(this.toolMesh); this.toolMesh = null; }
    this.job = null;
    this.phase = 'idle';
  }
}
