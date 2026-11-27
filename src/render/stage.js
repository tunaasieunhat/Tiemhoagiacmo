// Khởi tạo renderer, cảnh, camera isometric (trực giao) và ánh sáng.
import * as THREE from 'three';
import { CAMERA, GRAPHICS } from '../../data/config.js';

export const CAM_OFFSET = new THREE.Vector3(1, 1.15, 1).normalize().multiplyScalar(60);

export function createStage(container) {
  const isMobile = matchMedia('(pointer: coarse)').matches;
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, isMobile ? 1.75 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = isMobile ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap; // (0.29) điện thoại: bóng nhẹ hơn
  renderer.shadowMap.autoUpdate = false; // (0.29) vòng vẽ tự bật needsUpdate theo GRAPHICS.shadowEvery
  container.appendChild(renderer.domElement);
  renderer.domElement.style.touchAction = 'none';

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#bfe8ff');

  const camera = new THREE.OrthographicCamera(-10, 10, 10, -10, 0.1, 300);
  camera.zoom = CAMERA.zoomStart;

  const hemi = new THREE.HemisphereLight('#ffffff', '#c7e6b0', 1.2);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight('#ffffff', 2.2);
  sun.castShadow = true;
  sun.shadow.mapSize.set(isMobile ? 1024 : 2048, isMobile ? 1024 : 2048);
  const S = 20;
  Object.assign(sun.shadow.camera, { left: -S, right: S, top: S, bottom: -S, near: 1, far: 120 });
  sun.shadow.bias = -0.0005;
  sun.shadow.normalBias = 0.03;
  scene.add(sun, sun.target);

  function resize() {
    const w = container.clientWidth || innerWidth;
    const h = container.clientHeight || innerHeight;
    const aspect = w / h;
    // màn hình dọc (điện thoại): giữ độ rộng nhìn thấy vừa phải để nông trại không quá nhỏ
    const halfH = aspect < 1 ? (CAMERA.viewSize * 0.36) / aspect : CAMERA.viewSize / 2 / Math.min(aspect, 1.4);
    camera.top = halfH;
    camera.bottom = -halfH;
    camera.left = -halfH * aspect;
    camera.right = halfH * aspect;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
  }
  resize();
  addEventListener('resize', resize);
  visualViewport?.addEventListener('resize', resize);

  /** Áp dụng mức đồ họa: 'high' | 'medium' | 'low' */
  const dyn = { max: 1, ratio: 1 };
  function applyQuality(level) {
    const q = GRAPHICS.levels[level] || GRAPHICS.levels.medium;
    dyn.max = Math.min(devicePixelRatio || 1, q.pixelRatio);
    dyn.ratio = dyn.max;
    renderer.setPixelRatio(dyn.ratio);
    const size = isMobile ? Math.min(q.shadowSize, 1024) : q.shadowSize;
    sun.castShadow = size > 0;
    if (size > 0 && sun.shadow.mapSize.x !== size) {
      sun.shadow.mapSize.set(size, size);
      sun.shadow.map?.dispose();
      sun.shadow.map = null;
    }
    resize();
    return q;
  }

  /** (0.29) Độ nét tự co giãn: dir = -1 hạ, +1 nâng. Trả về true nếu có đổi */
  function nudgeResolution(dir) {
    const D = GRAPHICS.dynamicRes;
    const next = Math.max(Math.min(D.minRatio, dyn.max), Math.min(dyn.max, +(dyn.ratio + dir * D.step).toFixed(2)));
    if (Math.abs(next - dyn.ratio) < 0.01) return false;
    dyn.ratio = next;
    renderer.setPixelRatio(next);
    resize();
    return true;
  }

  return { renderer, scene, camera, sun, hemi, resize, isMobile, applyQuality, nudgeResolution, dyn };
}
