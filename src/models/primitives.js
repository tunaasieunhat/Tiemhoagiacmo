// Các khối hình cơ bản bo tròn để dựng mô hình chibi.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mat } from './materials.js';

const geoCache = new Map();
function cached(key, make) {
  if (!geoCache.has(key)) geoCache.set(key, make());
  return geoCache.get(key);
}

export function mesh(geo, material, { cast = true, receive = false } = {}) {
  const m = new THREE.Mesh(geo, material);
  m.castShadow = cast;
  m.receiveShadow = receive;
  return m;
}

export function rbox(w, h, d, color, radius = 0.1, opts) {
  const r = Math.min(radius, w / 2, h / 2, d / 2);
  const g = cached(`rb${w}|${h}|${d}|${r}`, () => new RoundedBoxGeometry(w, h, d, 3, r));
  return mesh(g, typeof color === 'string' ? mat(color) : color, opts);
}

export function sphere(r, color, seg = 14, opts) {
  const g = cached(`sp${r}|${seg}`, () => new THREE.SphereGeometry(r, seg, Math.max(8, Math.round(seg * 0.75))));
  return mesh(g, typeof color === 'string' ? mat(color) : color, opts);
}

export function cyl(rt, rb, h, color, seg = 12, opts) {
  const g = cached(`cy${rt}|${rb}|${h}|${seg}`, () => new THREE.CylinderGeometry(rt, rb, h, seg));
  return mesh(g, typeof color === 'string' ? mat(color) : color, opts);
}

export function cone(r, h, color, seg = 12, opts) {
  const g = cached(`co${r}|${h}|${seg}`, () => new THREE.ConeGeometry(r, h, seg));
  return mesh(g, typeof color === 'string' ? mat(color) : color, opts);
}

export function capsule(r, len, color, opts) {
  const g = cached(`ca${r}|${len}`, () => new THREE.CapsuleGeometry(r, len, 6, 12));
  return mesh(g, typeof color === 'string' ? mat(color) : color, opts);
}

export function torus(r, tube, color, opts) {
  const g = cached(`to${r}|${tube}`, () => new THREE.TorusGeometry(r, tube, 8, 24));
  return mesh(g, typeof color === 'string' ? mat(color) : color, opts);
}

export function at(obj, x = 0, y = 0, z = 0) { obj.position.set(x, y, z); return obj; }
export function group(...children) { const g = new THREE.Group(); children.forEach((c) => c && g.add(c)); return g; }

/** Biển chữ (sprite) vẽ bằng canvas, dùng cho tên khu vực */
export function textSprite(text, { bg = '#fff7ef', fg = '#7a4e3a', border = '#f2b6a0', scale = 1, sub = '' } = {}) {
  const c = document.createElement('canvas');
  const ctx = c.getContext('2d');
  const font = '700 44px "Baloo 2", "Nunito", system-ui, sans-serif';
  const subFont = '600 26px "Nunito", system-ui, sans-serif';
  ctx.font = font;
  let w = ctx.measureText(text).width;
  if (sub) { ctx.font = subFont; w = Math.max(w, ctx.measureText(sub).width); }
  const pad = 28;
  c.width = Math.ceil(w + pad * 2);
  c.height = sub ? 118 : 80;
  ctx.fillStyle = bg;
  ctx.strokeStyle = border;
  ctx.lineWidth = 6;
  roundRect(ctx, 3, 3, c.width - 6, c.height - 6, 30);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = fg;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = font;
  ctx.fillText(text, c.width / 2, sub ? 44 : c.height / 2 + 2);
  if (sub) { ctx.font = subFont; ctx.globalAlpha = 0.75; ctx.fillText(sub, c.width / 2, 86); }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }));
  const h = 0.9 * scale * (sub ? 1.45 : 1);
  sp.scale.set((h * c.width) / c.height, h, 1);
  sp.renderOrder = 10;
  return sp;
}

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
