// Biểu tượng nổi trên ô đất (khát nước, sẵn sàng thu hoạch, cây chết) — vẽ bằng canvas.
import * as THREE from 'three';

const cache = new Map();

function drawIcon(kind) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const x = c.getContext('2d');
  const bg = { thirsty: '#e3f4ff', ready: '#fff6d6', dead: '#f3e6da', fert: '#f1ead8', sick: '#eaf7dc', golden: '#fff3b0', stale: '#efe3d6' }[kind];
  const border = { thirsty: '#6fbbe8', ready: '#f4b42a', dead: '#b39a74', fert: '#b8935f', sick: '#7aa83c', golden: '#ff9f1c', stale: '#a8875f' }[kind];
  x.fillStyle = bg; x.strokeStyle = border; x.lineWidth = 8;
  x.beginPath(); x.arc(64, 58, 46, 0, Math.PI * 2); x.fill(); x.stroke();
  // đuôi bong bóng
  x.beginPath(); x.moveTo(52, 100); x.lineTo(64, 122); x.lineTo(76, 100); x.closePath(); x.fillStyle = border; x.fill();
  if (kind === 'thirsty') {
    x.fillStyle = '#4aa8e0';
    x.beginPath(); x.moveTo(64, 26); x.bezierCurveTo(84, 52, 90, 62, 90, 72); x.arc(64, 72, 26, 0, Math.PI); x.bezierCurveTo(38, 62, 44, 52, 64, 26); x.fill();
    x.fillStyle = '#ffffff'; x.beginPath(); x.arc(55, 72, 7, 0, Math.PI * 2); x.fill();
  } else if (kind === 'ready') {
    x.fillStyle = '#f7b500';
    star(x, 64, 60, 32, 14, 5);
  } else if (kind === 'golden') {
    // giờ vàng: ngôi sao vàng có tia sáng
    x.strokeStyle = '#ffb703'; x.lineWidth = 5; x.lineCap = 'round';
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; x.beginPath(); x.moveTo(64 + Math.cos(a) * 30, 58 + Math.sin(a) * 30); x.lineTo(64 + Math.cos(a) * 40, 58 + Math.sin(a) * 40); x.stroke(); }
    x.fillStyle = '#ffb703';
    star(x, 64, 58, 26, 11, 5);
  } else if (kind === 'stale') {
    // hoa rũ: bông nghiêng, cánh nâu
    x.strokeStyle = '#7c9a55'; x.lineWidth = 6; x.lineCap = 'round';
    x.beginPath(); x.moveTo(52, 88); x.quadraticCurveTo(56, 50, 80, 50); x.stroke();
    x.fillStyle = '#c7a37a';
    [[80, 60], [90, 52], [76, 46], [86, 66]].forEach(([cx, cy]) => { x.beginPath(); x.ellipse(cx, cy, 10, 7, 0.6, 0, 7); x.fill(); });
  } else if (kind === 'dead') {
    x.strokeStyle = '#8a6c4a'; x.lineWidth = 10; x.lineCap = 'round';
    x.beginPath(); x.moveTo(44, 38); x.lineTo(84, 78); x.moveTo(84, 38); x.lineTo(44, 78); x.stroke();
  } else if (kind === 'sick') {
    // con sâu nhỏ
    x.fillStyle = '#8cc63f';
    [[44, 66], [56, 60], [68, 60], [80, 64]].forEach(([cx, cy]) => { x.beginPath(); x.arc(cx, cy, 11, 0, 7); x.fill(); });
    x.fillStyle = '#3b2a22'; x.beginPath(); x.arc(84, 60, 3, 0, 7); x.fill();
    x.strokeStyle = '#3b2a22'; x.lineWidth = 3; x.beginPath(); x.moveTo(86, 54); x.lineTo(92, 42); x.stroke();
  } else if (kind === 'fert') {
    x.fillStyle = '#c9a27e'; x.beginPath(); x.ellipse(64, 64, 22, 26, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#7cc27f'; x.beginPath(); x.ellipse(64, 34, 8, 12, 0.5, 0, Math.PI * 2); x.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function star(ctx, cx, cy, R, r, n) {
  ctx.beginPath();
  for (let i = 0; i < n * 2; i++) {
    const rad = i % 2 ? r : R;
    const a = (i / (n * 2)) * Math.PI * 2 - Math.PI / 2;
    ctx.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad);
  }
  ctx.closePath();
  ctx.fill();
}

export function iconMaterial(kind) {
  if (!cache.has(kind)) cache.set(kind, new THREE.SpriteMaterial({ map: drawIcon(kind), depthTest: false, transparent: true }));
  return cache.get(kind);
}
