// Hình xem trước bó hoa / cành hoa (SVG 2D dễ thương)
import { FLOWERS } from '../../data/flowers.js';
import { PAPERS, RIBBONS } from '../../data/wrapping.js';

function flowerSVG(id, x, y, s) {
  const c = FLOWERS[id]?.colors || { petal: '#f6a6b9', petalDark: '#ea7f99' };
  if (id === 'sunflower') {
    let p = '';
    for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; p += `<ellipse cx="${x + Math.cos(a) * s * 0.75}" cy="${y + Math.sin(a) * s * 0.75}" rx="${s * 0.42}" ry="${s * 0.22}" transform="rotate(${(a * 180) / Math.PI} ${x + Math.cos(a) * s * 0.75} ${y + Math.sin(a) * s * 0.75})" fill="${c.petal}"/>`; }
    return p + `<circle cx="${x}" cy="${y}" r="${s * 0.5}" fill="${c.center}"/>`;
  }
  if (id === 'tulip') {
    return `<path d="M${x - s * 0.7} ${y - s * 0.5} Q${x - s * 0.8} ${y + s * 0.8} ${x} ${y + s * 0.8} Q${x + s * 0.8} ${y + s * 0.8} ${x + s * 0.7} ${y - s * 0.5} L${x + s * 0.35} ${y - s * 0.1} L${x} ${y - s * 0.7} L${x - s * 0.35} ${y - s * 0.1}Z" fill="${c.petal}" stroke="${c.petalDark}" stroke-width="1.5"/>`;
  }
  // hoa hồng
  return `<circle cx="${x}" cy="${y}" r="${s * 0.85}" fill="${c.petal}"/>
    <circle cx="${x}" cy="${y}" r="${s * 0.55}" fill="${c.petalDark}"/>
    <path d="M${x - s * 0.3} ${y} Q${x} ${y - s * 0.4} ${x + s * 0.3} ${y}" stroke="${c.petal}" stroke-width="2" fill="none"/>`;
}

/** items: [{flower, n}] ; type: 'single' | 'multi' | 'bouquet' */
export function bouquetSVG({ items, paper, ribbon, type }, size = 150) {
  const list = [];
  items.forEach((it) => { for (let i = 0; i < it.n; i++) list.push(it.flower); });
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
  pos.map((p, i) => [p, i]).sort((a, b) => a[0][1] - b[0][1]).forEach(([[x, y], i]) => { flowers += flowerSVG(list[i], x, y, 11); });
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
