// Hiển thị các lô đất + cây hoa, đồng bộ theo dữ liệu save.
import * as THREE from 'three';
import { FARM, SEE_THROUGH } from '../../data/config.js';
import { rbox, mesh } from '../models/primitives.js';
import { mat } from '../models/materials.js';
import { grassTuft } from '../models/environment.js';
import { buildPlant } from '../models/flowers.js';
import { stageOf, isThirsty, isWilted, isSick } from '../systems/farming.js';
import { uniqueMat } from '../models/materials.js';
import { PLOT_SLOTS } from './world.js';
import { iconMaterial } from './icons.js';
import { buildSprinkler, buildFeeder } from '../models/decor.js';

const SOIL = {
  untilled: '#cfae86',
  dry: '#a7714f', dryRidge: '#94603f',
  wet: '#7a4f3a', wetRidge: '#69432f',
};
const TILE_H = 0.22;
const PLANT_SCALE = 1.25; // phóng to cây cho dễ nhìn kiểu chibi
const PLANT_TOP = { rose: 2.0, tulip: 1.95, sunflower: 2.75, daisy: 1.8, lavender: 1.95, hydrangea: 1.85 };

export class FarmView {
  constructor(scene) {
    this.scene = scene;
    this.root = new THREE.Group();
    scene.add(this.root);
    this.plots = []; // [{ group, tiles: [{...view}] }]
    this.time = 0;
    this.wind = 0; // 0..1 (bão = 1)

    this.hoverCursor = makeCursor('#ffffff', 0.55);
    this.selectCursor = makeCursor('#ffd34e', 0.95);
    this.root.add(this.hoverCursor, this.selectCursor);
  }

  step() { return FARM.tileSize + FARM.tileGap; }

  tileLocal(plot, idx) {
    const col = idx % plot.cols, row = Math.floor(idx / plot.cols);
    const s = this.step();
    return new THREE.Vector3((col - (plot.cols - 1) / 2) * s, 0, (row - (plot.rows - 1) / 2) * s);
  }

  tileWorldPos(plotIdx, tileIdx) {
    const v = this.plots[plotIdx];
    return v.tiles[tileIdx].group.getWorldPosition(new THREE.Vector3());
  }

  /** Dựng lại toàn bộ khi số lô thay đổi */
  build(save) {
    this.plots.forEach((p) => this.root.remove(p.group));
    this.plots = [];
    save.farm.plots.forEach((plot, pi) => {
      const g = new THREE.Group();
      g.position.copy(PLOT_SLOTS[pi] ?? new THREE.Vector3(pi * 5, 0, 0));
      const s = this.step();
      const w = plot.cols * s + 0.3, d = plot.rows * s + 0.3;
      // khung gỗ
      const wood = '#e2b98f';
      const frame = [
        [w + 0.2, 0.3, 0.22, 0, -d / 2], [w + 0.2, 0.3, 0.22, 0, d / 2],
        [0.22, 0.3, d, -w / 2, 0], [0.22, 0.3, d, w / 2, 0],
      ];
      for (const [fw, fh, fd, x, z] of frame) {
        const b = rbox(fw, fh, fd, wood, 0.08, { cast: true, receive: true });
        b.position.set(x, 0.15, z);
        g.add(b);
      }
      const bed = rbox(w, 0.12, d, '#b98a64', 0.05, { cast: false, receive: true });
      bed.position.y = 0.06;
      g.add(bed);

      const tiles = plot.tiles.map((tile, ti) => {
        const tg = new THREE.Group();
        tg.position.copy(this.tileLocal(plot, ti));
        const soil = rbox(FARM.tileSize, TILE_H, FARM.tileSize, SOIL.untilled, 0.1, { cast: false, receive: true });
        soil.position.y = TILE_H / 2 + 0.04;
        tg.add(soil);
        const ridges = new THREE.Group();
        for (const z of [-0.36, 0, 0.36]) {
          const r = rbox(FARM.tileSize * 0.82, 0.08, 0.2, SOIL.dryRidge, 0.04, { cast: false, receive: true });
          r.position.set(0, TILE_H + 0.06, z);
          ridges.add(r);
        }
        tg.add(ridges);
        const tufts = new THREE.Group();
        [[-0.3, -0.25], [0.32, 0.1], [-0.05, 0.35]].forEach(([x, z]) => { const t = grassTuft('#8cc47c'); t.position.set(x, TILE_H + 0.02, z); t.scale.setScalar(0.8); tufts.add(t); });
        tg.add(tufts);
        const plantHolder = new THREE.Group();
        plantHolder.position.y = TILE_H + 0.06;
        tg.add(plantHolder);
        const icon = new THREE.Sprite(iconMaterial('thirsty'));
        icon.scale.set(0.58, 0.58, 1);
        icon.visible = false;
        icon.renderOrder = 5;
        tg.add(icon);
        tg.userData.pick = { kind: 'tile', plot: pi, tile: ti };
        g.add(tg);
        return { group: tg, soil, ridges, tufts, plantHolder, icon, key: '', iconKey: '', plant: null, pop: 0, phase: Math.random() * 6 };
      });

      g.userData.pick = null;
      // nhà kính & bạt che
      const greenhouse = makeGreenhouse(w, d);
      greenhouse.visible = !!plot.greenhouse;
      g.add(greenhouse);
      const cover = makeCover(w, d);
      cover.visible = false;
      g.add(cover);
      // máy móc tự động (GĐ8)
      const sprinkler = buildSprinkler();
      sprinkler.position.set(-w / 2 - 0.05, 0, -d / 2 - 0.05);
      sprinkler.visible = false;
      g.add(sprinkler);
      const feeder = buildFeeder();
      feeder.position.set(w / 2 + 0.3, 0, -d / 2 + 0.3);
      feeder.visible = false;
      g.add(feeder);
      this.root.add(g);
      this.plots.push({ group: g, tiles, greenhouse, cover, sprinkler, feeder });
    });
    this.sync(save, true);
  }

  /**
   * Mái che (bạt / kính nhà kính) mờ dần khi phóng to, và mờ hẳn ở lô đang chọn ô — để thấy hoa bên dưới.
   * Gọi mỗi khung hình với mức zoom hiện tại của camera.
   */
  updateSeeThrough(dt, zoom, selectedPlot = -1) {
    const S = SEE_THROUGH;
    const t = THREE.MathUtils.smoothstep(zoom, S.zoomFar, S.zoomNear);
    const k = Math.min(1, dt * 6);
    this.plots.forEach((pv, pi) => {
      const near = S.whenSelected && pi === selectedPlot;
      for (const obj of [pv.cover, pv.greenhouse]) {
        if (!obj.visible) continue;
        const glass = obj.userData.seeKind === 'glass';
        const far = glass ? S.glassFar : S.coverFar;
        const nearOp = glass ? S.glassNear : S.coverNear;
        const target = near ? nearOp : far + (nearOp - far) * t;
        const cur = obj.userData.seeOp ?? far;
        const op = cur + (target - cur) * k;
        obj.userData.seeOp = op;
        for (const m of obj.userData.seeMats) m.opacity = op;
        // bạt mờ thì không đổ bóng đen lên hoa
        if (obj.userData.strips) for (const st of obj.userData.strips) st.castShadow = op > 0.55;
      }
    });
  }

  /** Cập nhật hình ảnh theo dữ liệu (gọi thường xuyên, chỉ vẽ lại khi có thay đổi) */
  sync(save, instant = false) {
    const now = save.time.gameMinutes;
    save.farm.plots.forEach((plot, pi) => {
      const pv = this.plots[pi];
      if (!pv) return;
      pv.greenhouse.visible = !!plot.greenhouse;
      pv.cover.visible = !plot.greenhouse && (plot.coverUntil || 0) >= now;
      pv.sprinkler.visible = !!plot.machines?.sprinkler;
      pv.feeder.visible = !!plot.machines?.feeder;
      plot.tiles.forEach((tile, ti) => this.syncTile(pv.tiles[ti], tile, instant));
    });
  }

  syncTile(v, tile, instant) {
    const wet = tile.water > 0.02;
    const soilColor = tile.state === 'untilled' ? SOIL.untilled : wet ? SOIL.wet : SOIL.dry;
    v.soil.material = mat(soilColor);
    v.ridges.visible = tile.state !== 'untilled';
    if (v.ridges.visible) v.ridges.children.forEach((r) => { r.material = mat(wet ? SOIL.wetRidge : SOIL.dryRidge); });
    v.tufts.visible = tile.state === 'untilled';

    const stage = stageOf(tile);
    const hasPlant = tile.state === 'growing' || tile.state === 'ready' || tile.state === 'dead';
    const wilted = isWilted(tile);
    const key = hasPlant ? `${tile.flower}:${tile.variant}|${tile.state === 'dead' ? 'dead' : stage}|${wilted ? 1 : 0}` : '';
    if (key !== v.key) {
      if (v.plant) v.plantHolder.remove(v.plant);
      v.plant = null;
      if (hasPlant) {
        const dead = tile.state === 'dead';
        v.plant = buildPlant(tile.flower, dead ? 3 : stage, { wilted, dead, variant: tile.variant });
        v.plantHolder.add(v.plant);
        v.pop = instant ? 1 : 0;
      }
      v.key = key;
    }

    let iconKind = '';
    if (tile.state === 'dead') iconKind = 'dead';
    else if (isSick(tile)) iconKind = 'sick';
    else if (tile.state === 'ready') iconKind = 'ready';
    else if (isThirsty(tile)) iconKind = 'thirsty';
    if (iconKind !== v.iconKey) {
      v.icon.visible = !!iconKind;
      if (iconKind) v.icon.material = iconMaterial(iconKind);
      v.iconKey = iconKind;
    }
    const top = hasPlant && stage >= 2 ? (PLANT_TOP[tile.flower] ?? 1.4) : 0.95;
    v.iconBase = top;
  }

  setHover(pick) { placeCursor(this, this.hoverCursor, pick); }
  setSelected(pick) { placeCursor(this, this.selectCursor, pick); }

  update(dt) {
    this.time += dt;
    const t = this.time;
    for (const pv of this.plots) {
      for (const v of pv.tiles) {
        if (v.plant) {
          const sway = v.plant.userData.sway;
          if (sway && v.key.indexOf('dead') < 0) {
            sway.rotation.x = Math.sin(t * (1.6 + this.wind * 3) + v.phase) * (0.05 + this.wind * 0.18);
          }
          if (v.pop < 1) {
            v.pop = Math.min(1, v.pop + dt * 2.5);
            const k = v.pop;
            const s = 1 + Math.sin(k * Math.PI) * 0.25 * (1 - k) + (k - 1) * 0.6;
            v.plant.scale.setScalar(Math.max(0.05, s) * PLANT_SCALE);
          } else v.plant.scale.setScalar(PLANT_SCALE);
        }
        if (v.icon.visible) v.icon.position.y = v.iconBase + Math.sin(t * 3 + v.phase) * 0.08;
      }
    }
    this.selectCursor.material.opacity = 0.65 + Math.sin(t * 5) * 0.3;
    for (const pv of this.plots) if (pv.sprinkler.visible) pv.sprinkler.userData.spin.rotation.y += dt * 3;
  }
}

function makeGreenhouse(w, d) {
  const g = new THREE.Group();
  // kính riêng từng lô để mờ đi khi phóng to / chọn ô (xem SEE_THROUGH)
  const GLASS = uniqueMat('#dff4ff', { transparent: true, opacity: SEE_THROUGH.glassFar, depthWrite: false });
  g.userData.seeMats = [GLASS];
  g.userData.seeKind = 'glass';
  const H = 2.3;
  const frame = '#ffffff';
  for (const [x, z] of [[-w / 2, -d / 2], [w / 2, -d / 2], [-w / 2, d / 2], [w / 2, d / 2]]) {
    const post = rbox(0.12, H, 0.12, frame, 0.04);
    post.position.set(x, H / 2, z);
    g.add(post);
  }
  for (const z of [-d / 2, d / 2]) { const b = rbox(w, 0.1, 0.1, frame, 0.04); b.position.set(0, H, z); g.add(b); }
  // mái vòm bằng kính
  // nửa ống trụ nằm dọc trục z, phần trên mặt đất; ép dẹt chiều cao
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(w / 2, w / 2, d, 20, 1, true, Math.PI / 2, Math.PI), GLASS);
  roof.rotation.x = Math.PI / 2;
  roof.scale.z = 0.45;
  roof.position.y = H;
  g.add(roof);
  for (let i = 0; i <= 4; i++) {
    const rib = new THREE.Mesh(new THREE.TorusGeometry(w / 2, 0.04, 6, 20, Math.PI), mat(frame));
    rib.scale.y = 0.45;
    rib.position.set(0, H, -d / 2 + (i / 4) * d);
    g.add(rib);
  }
  // vách kính 4 phía
  for (const [x, z, ry, len] of [[0, -d / 2, 0, w], [0, d / 2, 0, w], [-w / 2, 0, Math.PI / 2, d], [w / 2, 0, Math.PI / 2, d]]) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(len, H), GLASS);
    p.position.set(x, H / 2, z); p.rotation.y = ry;
    g.add(p);
  }
  return g;
}

function makeCover(w, d) {
  const g = new THREE.Group();
  const H = 1.6;
  for (const [x, z] of [[-w / 2, -d / 2], [w / 2, -d / 2], [-w / 2, d / 2], [w / 2, d / 2]]) {
    const post = rbox(0.1, H, 0.1, '#b98563', 0.03);
    post.position.set(x, H / 2, z);
    g.add(post);
  }
  const n = 6;
  // bạt bán trong suốt, vật liệu riêng từng lô để mờ đi khi phóng to / chọn ô (xem SEE_THROUGH)
  const tarp = [uniqueMat('#ffffff', { transparent: true, opacity: SEE_THROUGH.coverFar, depthWrite: false }),
    uniqueMat('#9fd6f0', { transparent: true, opacity: SEE_THROUGH.coverFar, depthWrite: false })];
  g.userData.seeMats = tarp;
  g.userData.seeKind = 'cover';
  g.userData.strips = [];
  for (let i = 0; i < n; i++) {
    const strip = rbox(w / n + 0.01, 0.05, d + 0.2, tarp[i % 2], 0.02, { cast: true });
    g.userData.strips.push(strip);
    strip.position.set(-w / 2 + (i + 0.5) * (w / n), H + Math.sin(((i + 0.5) / n) * Math.PI) * 0.35, 0);
    g.add(strip);
  }
  return g;
}

function makeCursor(color, opacity) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const x = c.getContext('2d');
  x.strokeStyle = '#fff';
  x.lineWidth = 10;
  const r = 26;
  x.beginPath();
  x.moveTo(8 + r, 8); x.arcTo(120, 8, 120, 120, r); x.arcTo(120, 120, 8, 120, r); x.arcTo(8, 120, 8, 8, r); x.arcTo(8, 8, 120, 8, r);
  x.closePath(); x.stroke();
  const tex = new THREE.CanvasTexture(c);
  const m = mesh(new THREE.PlaneGeometry(FARM.tileSize * 1.08, FARM.tileSize * 1.08), new THREE.MeshBasicMaterial({ map: tex, color, transparent: true, opacity, depthWrite: false }), { cast: false });
  m.rotation.x = -Math.PI / 2;
  m.visible = false;
  m.renderOrder = 3;
  return m;
}

function placeCursor(view, cursor, pick) {
  if (!pick || pick.kind !== 'tile' || !view.plots[pick.plot]) { cursor.visible = false; return; }
  const p = view.tileWorldPos(pick.plot, pick.tile);
  cursor.position.set(p.x, TILE_H + 0.1, p.z);
  cursor.visible = true;
}
