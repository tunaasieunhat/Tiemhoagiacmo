// 🪴 Giỏ hoa treo dưới mái hiên tiệm (0.20): mỗi loài đang treo = 1 giỏ, nhìn vào là biết tiệm đang bán gì.
import * as THREE from 'three';
import { cyl, at } from './primitives.js';
import { buildPlant } from './flowers.js';

/** ids: các loài đang treo. Tọa độ theo nhóm tiệm (mặt tiền hướng +z). */
export function shopDisplayBaskets(ids = []) {
  const g = new THREE.Group();
  const n = ids.length;
  if (!n) return g;
  const span = Math.min(3.9, 0.75 * (n - 1));
  ids.forEach((id, i) => {
    const b = new THREE.Group();
    const x = n === 1 ? 0 : -span / 2 + (span * i) / (n - 1);
    b.position.set(x, 2.02, 2.62);
    b.add(at(cyl(0.012, 0.012, 0.5, '#a87458', 4), 0, 0.33, 0)); // dây treo
    b.add(at(cyl(0.2, 0.13, 0.2, '#d9a67e', 10), 0, 0, 0)); // giỏ
    b.add(at(cyl(0.21, 0.21, 0.04, '#b8845f', 10), 0, 0.1, 0));
    let plant;
    try { plant = buildPlant(id, 3); } catch { plant = null; }
    if (plant) {
      // thu nhỏ để cây nào cũng cao cỡ 0,5 (hoa thân cao không chọc vào mái hiên)
      const box = new THREE.Box3().setFromObject(plant);
      const h = Math.max(0.3, box.max.y - box.min.y);
      plant.scale.setScalar(Math.min(0.62, 0.5 / h));
      plant.position.y = 0.1;
      plant.traverse((o) => { if (o.isMesh) o.castShadow = false; });
      b.add(plant);
    }
    b.userData.phase = i * 1.7;
    g.add(b);
  });
  g.userData.baskets = g.children.slice();
  return g;
}

/** Giỏ đung đưa nhẹ theo gió */
export function swayBaskets(g, t) {
  for (const b of g?.userData.baskets || []) b.rotation.z = Math.sin(t * 1.3 + b.userData.phase) * 0.06;
}
