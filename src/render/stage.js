// Khởi tạo renderer, cảnh, camera isometric (trực giao) và ánh sáng.
import * as THREE from 'three';
import { CAMERA } from '../../data/config.js';

export const CAM_OFFSET = new THREE.Vector3(1, 1.15, 1).normalize().multiplyScalar(60);

export function createStage(container) {
  const isMobile = matchMedia('(pointer: coarse)').matches;
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, isMobile ? 1.75 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
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

  return { renderer, scene, camera, sun, hemi, resize, isMobile };
}
