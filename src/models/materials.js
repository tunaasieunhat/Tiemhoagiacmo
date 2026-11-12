// Vật liệu kiểu hoạt hình (toon) màu pastel, có bộ nhớ đệm để tiết kiệm.
import * as THREE from 'three';

let gradientMap = null;
function getGradient() {
  if (gradientMap) return gradientMap;
  const data = new Uint8Array([90, 160, 215, 255]);
  gradientMap = new THREE.DataTexture(data, data.length, 1, THREE.RedFormat);
  gradientMap.minFilter = THREE.NearestFilter;
  gradientMap.magFilter = THREE.NearestFilter;
  gradientMap.needsUpdate = true;
  return gradientMap;
}

const cache = new Map();

/** Vật liệu toon theo màu. opts: { emissive, transparent, opacity } */
export function mat(color, opts = {}) {
  const key = color + JSON.stringify(opts);
  if (cache.has(key)) return cache.get(key);
  const m = new THREE.MeshToonMaterial({ color: new THREE.Color(color), gradientMap: getGradient(), ...opts });
  cache.set(key, m);
  return m;
}

/** Vật liệu riêng (không dùng chung) — khi cần đổi màu theo thời gian */
export function uniqueMat(color, opts = {}) {
  return new THREE.MeshToonMaterial({ color: new THREE.Color(color), gradientMap: getGradient(), ...opts });
}

export const basic = (color, opts = {}) => new THREE.MeshBasicMaterial({ color, ...opts });
