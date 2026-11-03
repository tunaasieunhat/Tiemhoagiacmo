// Hình xem trước bó hoa / cành hoa (SVG 2D dễ thương)
import { FLOWERS } from '../../data/flowers.js';
import { PAPERS, RIBBONS } from '../../data/wrapping.js';
import { variantColors } from '../systems/variants.js';

function flowerSVG(id, variant, x, y, s) {
  const c = FLOWERS[id] ? variantColors(id, variant) : { petal: '#f6a6b9', petalDark: '#ea7f99' };
  if (id === 'sunflower') {
    let p = '';
    for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; p += `<ellipse cx="${x + Math.cos(a) * s * 0.75}" cy="${y + Math.sin(a) * s * 0.75}" rx="${s * 0.42}" ry="${s * 0.22}" transform="rotate(${(a * 180) / Math.PI} ${x + Math.cos(a) * s * 0.75} ${y + Math.sin(a) * s * 0.75})" fill="${c.petal}"/>`; }
    return p + `<circle cx="${x}" cy="${y}" r="${s * 0.5}" fill="${c.center}"/>`;
  }
  if (id === 'tulip') {
    return `<path d="M${x - s * 0.7} ${y - s * 0.5} Q${x - s * 0.8} ${y + s * 0.8} ${x} ${y + s * 0.8} Q${x + s * 0.8} ${y + s * 0.8} ${x + s * 0.7} ${y - s * 0.5} L${x + s * 0.35} ${y - s * 0.1} L${x} ${y - s * 0.7} L${x - s * 0.35} ${y - s * 0.1}Z" fill="${c.petal}" stroke="${c.petalDark}" stroke-width="1.5"/>`;
  }
  if (id === 'daisy') {
    let p = '';
    for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; p += `<ellipse cx="${x + Math.cos(a) * s * 0.6}" cy="${y + Math.sin(a) * s * 0.6}" rx="${s * 0.38}" ry="${s * 0.16}" transform="rotate(${(a * 180) / Math.PI} ${x + Math.cos(a) * s * 0.6} ${y + Math.sin(a) * s * 0.6})" fill="${c.petal}" stroke="#e6ddd0" stroke-width=".8"/>`; }
    return p + `<circle cx="${x}" cy="${y}" r="${s * 0.3}" fill="${c.center}"/>`;
  }
  if (id === 'lavender') {
    let p = '';
    for (let i = 0; i < 6; i++) p += `<ellipse cx="${x + (i % 2 ? 2 : -2)}" cy="${y + s * 0.6 - i * s * 0.35}" rx="${s * 0.28}" ry="${s * 0.22}" fill="${i % 2 ? c.petal : c.petalDark}"/>`;
    return p;
  }
  if (id === 'hydrangea') {
    let p = `<circle cx="${x}" cy="${y}" r="${s * 0.95}" fill="${c.petal}"/>`;
    for (let i = 0; i < 9; i++) { const a = i * 2.4; const r = (i / 9) * s * 0.75; p += `<circle cx="${x + Math.cos(a) * r}" cy="${y + Math.sin(a) * r}" r="${s * 0.22}" fill="${i % 2 ? c.petalDark : '#d8e9fb'}"/>`; }
    return p;
  }
  if (id === 'cosmos') { // sao nhái: 8 cánh to, đầu cánh răng cưa
    let p = '';
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; const cx = x + Math.cos(a) * s * 0.55, cy = y + Math.sin(a) * s * 0.55; p += `<ellipse cx="${cx}" cy="${cy}" rx="${s * 0.42}" ry="${s * 0.25}" transform="rotate(${(a * 180) / Math.PI} ${cx} ${cy})" fill="${i % 2 ? c.petal : c.petalDark}"/>`; }
    return p + `<circle cx="${x}" cy="${y}" r="${s * 0.24}" fill="${c.center || '#f2c14e'}"/>`;
  }
  if (id === 'carnation') { // cẩm chướng: viền cánh lượn sóng xếp lớp
    let p = '';
    for (let r = 0; r < 3; r++) {
      const rr = s * (0.85 - r * 0.25);
      let d = '';
      for (let i = 0; i <= 16; i++) { const a = (i / 16) * Math.PI * 2; const k = rr * (i % 2 ? 0.82 : 1); d += `${i ? 'L' : 'M'}${x + Math.cos(a) * k} ${y + Math.sin(a) * k}`; }
      p += `<path d="${d}Z" fill="${r % 2 ? c.petalDark : c.petal}"/>`;
    }
    return p;
  }
  if (id === 'marigold') { // cúc vạn thọ: quả cầu nhiều cánh nhỏ
    let p = `<circle cx="${x}" cy="${y}" r="${s * 0.85}" fill="${c.petalDark}"/>`;
    for (let i = 0; i < 14; i++) { const a = i * 2.4; const r = Math.sqrt(i / 14) * s * 0.7; p += `<circle cx="${x + Math.cos(a) * r}" cy="${y + Math.sin(a) * r}" r="${s * 0.24}" fill="${i % 3 ? c.petal : c.petalDark}"/>`; }
    return p;
  }
  if (id === 'lily') { // hoa ly: 6 cánh nhọn hình sao + nhụy
    let p = '';
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 - Math.PI / 2, a1 = a - 0.32, a2 = a + 0.32;
      p += `<path d="M${x} ${y} Q${x + Math.cos(a1) * s * 0.7} ${y + Math.sin(a1) * s * 0.7} ${x + Math.cos(a) * s * 1.05} ${y + Math.sin(a) * s * 1.05} Q${x + Math.cos(a2) * s * 0.7} ${y + Math.sin(a2) * s * 0.7} ${x} ${y}Z" fill="${c.petal}" stroke="${c.petalDark}" stroke-width=".8"/>`;
    }
    for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; p += `<circle cx="${x + Math.cos(a) * s * 0.3}" cy="${y + Math.sin(a) * s * 0.3}" r="${s * 0.09}" fill="${c.center || '#f2b33d'}"/>`; }
    return p;
  }
  if (id === 'peony') { // mẫu đơn: hoa to, nhiều lớp cánh tròn
    let p = `<circle cx="${x}" cy="${y}" r="${s * 1.0}" fill="${c.petal}"/>`;
    for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2; p += `<circle cx="${x + Math.cos(a) * s * 0.55}" cy="${y + Math.sin(a) * s * 0.55}" r="${s * 0.38}" fill="${c.petal}" stroke="${c.petalDark}" stroke-width=".8"/>`; }
    p += `<circle cx="${x}" cy="${y}" r="${s * 0.5}" fill="${c.petalDark}"/><circle cx="${x}" cy="${y}" r="${s * 0.25}" fill="${c.petal}"/>`;
    return p;
  }
  if (id === 'orchid') { // lan hồ điệp: 2 cánh tròn to + 3 cánh nhỏ + môi
    const e = (dx, dy, rx, ry, rot, fill) => `<ellipse cx="${x + dx * s}" cy="${y + dy * s}" rx="${rx * s}" ry="${ry * s}" transform="rotate(${rot} ${x + dx * s} ${y + dy * s})" fill="${fill}"/>`;
    return e(0, -0.55, 0.25, 0.45, 0, c.petal) + e(-0.45, 0.35, 0.22, 0.42, 40, c.petal) + e(0.45, 0.35, 0.22, 0.42, -40, c.petal)
      + e(-0.5, -0.1, 0.5, 0.4, -15, c.petal) + e(0.5, -0.1, 0.5, 0.4, 15, c.petal)
      + e(0, 0.3, 0.2, 0.28, 0, c.petalDark) + `<circle cx="${x}" cy="${y - s * 0.05}" r="${s * 0.12}" fill="#fff3c2"/>`;
  }
  // hoa hồng
  return `<circle cx="${x}" cy="${y}" r="${s * 0.85}" fill="${c.petal}"/>
    <circle cx="${x}" cy="${y}" r="${s * 0.55}" fill="${c.petalDark}"/>
    <path d="M${x - s * 0.3} ${y} Q${x} ${y - s * 0.4} ${x + s * 0.3} ${y}" stroke="${c.petal}" stroke-width="2" fill="none"/>`;
}

/** items: [{flower, n}] ; type: 'single' | 'multi' | 'bouquet' */
export function bouquetSVG({ items, paper, ribbon, type }, size = 150) {
  const list = [];
  items.forEach((it) => { for (let i = 0; i < it.n; i++) list.push([it.flower, it.variant]); });
  const n = Math.min(list.length, 12);
  let flowers = '';
  let stems = '';
  // xếp hoa theo hình vòm
  const pos = [];
  for (let i = 0; i < n; i++) {
    const row = i < 5 ? 0 : i < 9 ? 1 : 2;
    const inRow = row === 0 ? Math.min(n, 5) : row === 1 ? Math.min(n - 5, 4) : n - 9;
    const idx = row === 0 ? i : row === 1 ? i - 5 : i - 9;
    const spread = 18 * (inRow - 1);
    const x = 75 - spread / 2 + idx * 18 + (row === 1 ? 0 : 0);
    const y = 58 - row * 14 + Math.abs(idx - (inRow - 1) / 2) * 4;
    pos.push([x, y]);
  }
  pos.forEach(([x, y], i) => { stems += `<line x1="${x}" y1="${y}" x2="${75 + (x - 75) * 0.15}" y2="128" stroke="#5fae63" stroke-width="3"/>`; });
  // vẽ hàng sau trước
  pos.map((p, i) => [p, i]).sort((a, b) => a[0][1] - b[0][1]).forEach(([[x, y], i]) => { flowers += flowerSVG(list[i][0], list[i][1], x, y, 11); });
  const leaves = n ? `<ellipse cx="52" cy="78" rx="16" ry="6" fill="#76c27a" transform="rotate(-30 52 78)"/><ellipse cx="98" cy="78" rx="16" ry="6" fill="#76c27a" transform="rotate(30 98 78)"/>` : '';
  let wrap = '';
  if (type === 'bouquet' && n) {
    const pc = PAPERS[paper]?.color || '#eee';
    const rc = RIBBONS[ribbon]?.color || '#ddd';
    wrap = `<path d="M28 66 L122 66 L84 132 L66 132 Z" fill="${pc}" stroke="rgba(0,0,0,.12)" stroke-width="1.5"/>
      <path d="M28 66 L52 60 L75 70 L98 60 L122 66" fill="${pc}" stroke="rgba(0,0,0,.08)"/>
      <ellipse cx="66" cy="112" rx="10" ry="6" fill="${rc}" stroke="rgba(0,0,0,.12)"/>
      <ellipse cx="84" cy="112" rx="10" ry="6" fill="${rc}" stroke="rgba(0,0,0,.12)"/>
      <circle cx="75" cy="112" r="5" fill="${rc}" stroke="rgba(0,0,0,.15)"/>
      <path d="M72 115 L64 132 M78 115 L86 132" stroke="${rc}" stroke-width="4"/>`;
  }
  const empty = n ? '' : '<text x="75" y="80" text-anchor="middle" font-size="12" fill="#9b7b6c" font-weight="700">Chưa chọn hoa</text>';
  return `<svg width="${size}" height="${size}" viewBox="0 0 150 140" aria-hidden="true">${stems}${leaves}${flowers}${wrap}${empty}</svg>`;
}
