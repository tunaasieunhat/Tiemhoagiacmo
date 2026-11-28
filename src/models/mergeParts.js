// (0.30) Gộp các khối cùng vật liệu trong 1 nhóm thành 1 khối ⇒ mô hình nhiều chi tiết vẫn ít lần vẽ.
// node: nhóm đích (giữ nguyên vị trí/chuyển động của nó) · keep: các nhóm con cần giữ riêng (đang chuyển động).
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export function compactInto(node, keep = []) {
  const skip = new Set(keep);
  node.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(node.matrixWorld).invert();
  const buckets = new Map();
  const visit = (o) => {
    for (const c of o.children) {
      if (skip.has(c)) continue;
      if (c.isMesh && !c.isInstancedMesh && !Array.isArray(c.material) && !c.children.length) {
        let g = c.geometry.index ? c.geometry.toNonIndexed() : c.geometry.clone();
        for (const n of Object.keys(g.attributes)) if (n !== 'position' && n !== 'normal') g.deleteAttribute(n);
        g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, c.matrixWorld));
        const k = `${c.material.uuid}|${c.castShadow}`;
        if (!buckets.has(k)) buckets.set(k, { m: c.material, cast: c.castShadow, geos: [], src: [] });
        buckets.get(k).geos.push(g); buckets.get(k).src.push(c);
      } else if (c.children.length) visit(c);
    }
  };
  visit(node);
  for (const b of buckets.values()) {
    if (b.src.length < 2) continue;
    const merged = mergeGeometries(b.geos, false);
    if (!merged) continue; // không gộp được thì giữ nguyên
    for (const v of b.src) v.parent.remove(v);
    const m = new THREE.Mesh(merged, b.m);
    m.castShadow = b.cast;
    node.add(m);
  }
  return node;
}
