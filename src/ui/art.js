// 🎨 Hình vẽ chi tiết (0.30): cá, gói hạt giống, vật phẩm — vẽ bằng SVG thay cho emoji.
// fishArt(id) · seedArt(vkey) · itemArt(kind, id). Trả về chuỗi <svg class="art ..."> (kích thước theo font-size của khung: 1em = 1 ô).
// Màu & kiểu dáng từng loài cá ở FISH_ART bên dưới (chỉnh thoải mái).
import { FLOWERS } from '../../data/flowers.js';
import { flowerSVG } from './bouquetPreview.js';
import { parseVkey, variantColors } from '../systems/variants.js';

let uid = 0;
const nid = (p) => `${p}${++uid}`;
const svg = (cls, inner, vb = '0 0 100 100') => `<svg xmlns="http://www.w3.org/2000/svg" class="art ${cls}" viewBox="${vb}" aria-hidden="true">${inner}</svg>`;
const shade = (hex, k) => {
  const n = parseInt(hex.slice(1), 16), f = (v) => Math.max(0, Math.min(255, Math.round(v * k)));
  return `#${((f(n >> 16) << 16) | (f((n >> 8) & 255) << 8) | f(n & 255)).toString(16).padStart(6, '0')}`;
};

// ============================================================= CÁ
// shape: fish | slim | tall | flat | eel | puffer | lantern | squid | shrimp | crab | lobster | shell | jelly | seahorse | dragon | whale
// b thân · w bụng · f vây · pat: bars | spots | stripe | koi | scales | lines | dots · pc màu họa tiết · tail: fork | round | fan
// extra: whisker, bill, sail, finlets, glow, spikes, topeyes
export const FISH_ART = {
  ro: { shape: 'fish', b: '#9a8f5a', w: '#dcd3a4', f: '#7a6f42', pat: 'bars', pc: '#6a6038', tail: 'round' },
  chep: { shape: 'fish', b: '#c9a24a', w: '#f2e2a6', f: '#b07a2a', pat: 'scales', whisker: 1 },
  loc: { shape: 'slim', b: '#6b6f5a', w: '#cfccb4', f: '#55584a', pat: 'spots', pc: '#3a3d2e', tail: 'round' },
  tre: { shape: 'slim', b: '#5a5048', w: '#ab9f90', f: '#463e36', whisker: 2, tail: 'round' },
  chepvang: { shape: 'fish', b: '#f2a02a', w: '#ffdb7a', f: '#e8701a', pat: 'scales', whisker: 1, tail: 'fan' },
  koi: { shape: 'fish', b: '#fff8f0', w: '#ffffff', f: '#f6c6b0', pat: 'koi', pc: '#f2652a', tail: 'fan', whisker: 1 },
  bong: { shape: 'fish', b: '#b9a080', w: '#ece0c8', f: '#9a8262', pat: 'spots', pc: '#7a6448', tail: 'round', topeyes: 1 },
  doi: { shape: 'slim', b: '#9fb0bf', w: '#eef3f6', f: '#8296a8', pat: 'lines', pc: '#7f93a6' },
  nuc: { shape: 'slim', b: '#5f8fb0', w: '#e2ecf2', f: '#4a7290', pat: 'stripe', pc: '#ffd36e', finlets: 1 },
  mucla: { shape: 'squid', b: '#e8c8d8', w: '#fbe8f0', f: '#d6a6be', pat: 'dots', pc: '#c27a9a' },
  mucon: { shape: 'tall', b: '#c97a4a', w: '#f2c9a0', f: '#a85a32', pat: 'spots', pc: '#7a3a22', tail: 'round' },
  hong: { shape: 'fish', b: '#ee5a5a', w: '#ffb8a8', f: '#d23f4a', pat: 'scales' },
  trich: { shape: 'slim', b: '#6f9fc9', w: '#edf3f8', f: '#5a86ad', pat: 'lines', pc: '#9fc4e3' },
  bon: { shape: 'flat', b: '#b39a78', w: '#e6d8c0', f: '#957c5c', pat: 'spots', pc: '#7a6244' },
  thu: { shape: 'slim', b: '#4a7fb0', w: '#eef4f8', f: '#3a6590', pat: 'bars', pc: '#2a4f7a', finlets: 1 },
  tuyet: { shape: 'fish', b: '#b8b2a8', w: '#f2eee8', f: '#9a948a', pat: 'dots', pc: '#8a847a', whisker: 3 },
  ngu: { shape: 'fish', b: '#2f5f9f', w: '#e0e7ef', f: '#24497a', finlets: 1, pc: '#ffd34e' },
  com: { shape: 'slim', b: '#a6c6d6', w: '#f2f7fa', f: '#86a8ba', pat: 'stripe', pc: '#e8f2f7' },
  bacma: { shape: 'slim', b: '#8fb0c8', w: '#edf3f8', f: '#6f90aa', pat: 'lines', pc: '#4a6c88' },
  chim: { shape: 'tall', b: '#c8ccd8', w: '#f1f2f6', f: '#a8acbc', pat: 'scales' },
  mucong: { shape: 'squid', b: '#f2b8a0', w: '#ffe2d4', f: '#e09478', pat: 'dots', pc: '#c7624a', long: 1 },
  cam: { shape: 'fish', b: '#f2a85a', w: '#ffe2b4', f: '#e08a3a', pat: 'stripe', pc: '#ffd34e' },
  kiem: { shape: 'fish', b: '#3f5f8f', w: '#e0e6ef', f: '#2c4570', bill: 1, sail: 1 },
  tom: { shape: 'shrimp', b: '#c9a07a', w: '#ecd4b8', f: '#a87d58' },
  cuadam: { shape: 'crab', b: '#6f7a5a', w: '#a8b08a', f: '#565f44' },
  keo: { shape: 'slim', b: '#8a8a6a', w: '#d8d8c0', f: '#6f6f52', pat: 'spots', pc: '#5a5a40', topeyes: 1, tail: 'round' },
  chem: { shape: 'fish', b: '#7f9faf', w: '#eef3f5', f: '#62808f', spikes: 1 },
  luon: { shape: 'eel', b: '#7a6f5a', w: '#e8d68a', f: '#5f5644' },
  cuahd: { shape: 'crab', b: '#e0502a', w: '#ffb08a', f: '#b83a1a', spikes: 1 },
  so: { shape: 'shell', b: '#e8b8a0', w: '#fbe6d8', f: '#c98f76' },
  boda: { shape: 'tall', b: '#9fb070', w: '#e0e8c0', f: '#7f9050', pat: 'spots', pc: '#55663a' },
  mo: { shape: 'fish', b: '#3fb8a0', w: '#a8ecd8', f: '#f28ab0', pat: 'scales', tail: 'fan' },
  tomhum: { shape: 'lobster', b: '#3f6f8f', w: '#f2a06a', f: '#2c5270' },
  matquy: { shape: 'puffer', b: '#a08f6f', w: '#e8dcc0', f: '#7f6f52', pat: 'spots', pc: '#6a5a40', spikes: 1 },
  cangua: { shape: 'seahorse', b: '#ffb347', w: '#ffe0a8', f: '#f28ab0' },
  sua: { shape: 'jelly', b: '#c9b8ff', w: '#f0e8ff', f: '#a88fe8', glow: 1 },
  denlong: { shape: 'lantern', b: '#3f3f6f', w: '#6f6fa0', f: '#2a2a50', glow: 1 },
  bacsuong: { shape: 'slim', b: '#d8e8f0', w: '#ffffff', f: '#b0c8d8', pat: 'scales', glow: 1 },
  anhtrang: { shape: 'fish', b: '#e8e8ff', w: '#ffffff', f: '#b8b8f0', pat: 'koi', pc: '#ffe9a0', glow: 1, tail: 'fan' },
  rong: { shape: 'dragon', b: '#4fae9f', w: '#c8f0e0', f: '#ffd36e', glow: 1 },
  mong: { shape: 'whale', b: '#9fb8ff', w: '#e8eeff', f: '#c9a2ff', glow: 1 },
};

function eye(x, y, r = 4.2) {
  return `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff"/><circle cx="${x + r * 0.15}" cy="${y}" r="${r * 0.62}" fill="#2a1f1c"/><circle cx="${x + r * 0.4}" cy="${y - r * 0.35}" r="${r * 0.25}" fill="#fff"/>`;
}

/** Cá dạng thường: thân bầu dục quay sang phải, đuôi bên trái */
function bodyFish(A, h = 16, len = 1) {
  const g = nid('fg'), cp = nid('fc');
  const nose = 50 + 38 * len, tb = 50 - 34 * len;
  const body = `M${nose} 50 C${nose - 6} ${50 - h} ${tb + 18} ${50 - h * 1.12} ${tb} 50 C${tb + 18} ${50 + h * 1.06} ${nose - 6} ${50 + h} ${nose} 50Z`;
  let s = `<defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(A.b, 0.85)}"/><stop offset=".5" stop-color="${A.b}"/><stop offset="1" stop-color="${A.w}"/></linearGradient><clipPath id="${cp}"><path d="${body}"/></clipPath></defs>`;
  // đuôi
  const tl = A.tail || 'fork';
  if (tl === 'fork') s += `<path d="M${tb + 3} 50 L${tb - 16} ${50 - h * 0.95} Q${tb - 9} 50 ${tb - 16} ${50 + h * 0.95}Z" fill="${A.f}"/>`;
  else if (tl === 'round') s += `<ellipse cx="${tb - 7}" cy="50" rx="11" ry="${h * 0.75}" fill="${A.f}"/>`;
  else s += `<path d="M${tb + 3} 50 C${tb - 14} ${50 - h * 1.6} ${tb - 26} ${50 - h * 0.6} ${tb - 18} 50 C${tb - 26} ${50 + h * 0.6} ${tb - 14} ${50 + h * 1.6} ${tb + 3} 50Z" fill="${A.f}" opacity=".85"/>`;
  if (tl !== 'round') for (let i = -2; i <= 2; i++) s += `<line x1="${tb + 1}" y1="50" x2="${tb - 13}" y2="${50 + i * h * 0.32}" stroke="${shade(A.f, 0.8)}" stroke-width=".8" opacity=".6"/>`;
  // vây lưng / buồm
  if (A.sail) s += `<path d="M${tb + 20} ${50 - h * 0.9} Q${tb + 40} ${50 - h * 3.1} ${nose - 22} ${50 - h * 0.95}Z" fill="${A.f}" opacity=".9"/>`;
  else s += `<path d="M${tb + 16} ${50 - h * 0.98} Q${tb + 30} ${50 - h * 1.75} ${nose - 26} ${50 - h * 0.9}Z" fill="${A.f}"/>`;
  if (A.spikes) for (let i = 0; i < 5; i++) s += `<line x1="${tb + 18 + i * 6}" y1="${50 - h * 0.95}" x2="${tb + 20 + i * 6}" y2="${50 - h * 1.5}" stroke="${shade(A.f, 0.7)}" stroke-width="1.2"/>`;
  s += `<path d="M${tb + 26} ${50 + h * 0.95} Q${tb + 32} ${50 + h * 1.45} ${tb + 40} ${50 + h * 0.98}Z" fill="${A.f}"/>`; // vây bụng
  if (A.finlets) for (let i = 0; i < 4; i++) { s += `<path d="M${tb + 6 + i * 4} ${50 - h * 0.62 + i} l2 -4 l2 4z" fill="${A.pc || '#ffd34e'}"/><path d="M${tb + 6 + i * 4} ${50 + h * 0.62 - i} l2 4 l2 -4z" fill="${A.pc || '#ffd34e'}"/>`; }
  if (A.bill) s += `<path d="M${nose - 2} 47 L${nose + 26} 49 L${nose - 2} 52Z" fill="${shade(A.b, 0.9)}"/>`;
  // thân + họa tiết
  s += `<path d="${body}" fill="url(#${g})"/><g clip-path="url(#${cp})">`;
  const pc = A.pc || shade(A.b, 0.7);
  if (A.pat === 'bars') for (let i = 0; i < 5; i++) s += `<path d="M${tb + 14 + i * 11} 20 q4 30 0 60" stroke="${pc}" stroke-width="4" fill="none" opacity=".45"/>`;
  if (A.pat === 'spots') for (let i = 0; i < 12; i++) s += `<circle cx="${tb + 10 + ((i * 37) % (nose - tb - 16))}" cy="${50 - h * 0.6 + ((i * 23) % Math.round(h * 1.1))}" r="${1.4 + (i % 3)}" fill="${pc}" opacity=".7"/>`;
  if (A.pat === 'dots') for (let i = 0; i < 16; i++) s += `<circle cx="${tb + 8 + ((i * 29) % (nose - tb - 10))}" cy="${50 - h * 0.7 + ((i * 17) % Math.round(h * 1.2))}" r="1" fill="${pc}" opacity=".8"/>`;
  if (A.pat === 'stripe') s += `<path d="M${tb} 50 Q${(tb + nose) / 2} ${50 - h * 0.25} ${nose} 48" stroke="${pc}" stroke-width="3.2" fill="none" opacity=".9"/>`;
  if (A.pat === 'lines') for (let i = 0; i < 3; i++) s += `<path d="M${tb} ${50 - h * 0.55 + i * 4} Q${(tb + nose) / 2} ${50 - h * 0.75 + i * 4} ${nose} ${48 - h * 0.2 + i * 3}" stroke="${pc}" stroke-width="1.1" fill="none" opacity=".7"/>`;
  if (A.pat === 'koi') s += `<ellipse cx="${tb + 26}" cy="${50 - h * 0.45}" rx="12" ry="7" fill="${pc}"/><ellipse cx="${nose - 22}" cy="${50 - h * 0.6}" rx="9" ry="6" fill="${pc}"/><ellipse cx="${tb + 44}" cy="${50 + h * 0.2}" rx="5" ry="3.5" fill="#2a2522" opacity=".8"/>`;
  if (A.pat === 'scales') for (let r = 0; r < 3; r++) for (let i = 0; i < 6; i++) s += `<path d="M${tb + 12 + i * 8 + (r % 2) * 4} ${50 - h * 0.5 + r * h * 0.4} q3 4 6 0" stroke="${shade(A.b, 0.7)}" stroke-width=".9" fill="none" opacity=".55"/>`;
  s += `<ellipse cx="${(tb + nose) / 2}" cy="${50 - h * 0.55}" rx="${(nose - tb) * 0.3}" ry="2.2" fill="#fff" opacity=".35"/></g>`; // ánh sáng lưng
  // mang, vây ngực, mắt, miệng, râu
  s += `<path d="M${nose - 18} ${50 - h * 0.55} Q${nose - 23} 50 ${nose - 18} ${50 + h * 0.55}" stroke="${shade(A.b, 0.6)}" stroke-width="1.4" fill="none"/>`;
  s += `<ellipse cx="${nose - 24}" cy="${50 + h * 0.3}" rx="6" ry="3" transform="rotate(25 ${nose - 24} ${50 + h * 0.3})" fill="${A.f}" opacity=".9"/>`;
  s += A.topeyes ? eye(nose - 10, 50 - h * 0.62, 3.6) : eye(nose - 10, 50 - h * 0.25);
  s += `<path d="M${nose - 1} 51.5 q-3 2 -6 1" stroke="${shade(A.b, 0.5)}" stroke-width="1.2" fill="none"/>`;
  if (A.whisker) for (let i = 0; i < A.whisker && i < 2; i++) s += `<path d="M${nose - 3} 52 q${6 + i * 3} ${6 + i * 3} ${2 + i * 6} ${12 + i * 3}" stroke="${shade(A.b, 0.55)}" stroke-width="1" fill="none"/>`;
  if (A.whisker === 3) s += `<line x1="${nose - 8}" y1="${50 + h * 0.8}" x2="${nose - 9}" y2="${50 + h * 1.25}" stroke="${shade(A.b, 0.55)}" stroke-width="1.1"/>`;
  return s;
}

const FISH_SHAPES = {
  fish: (A) => bodyFish(A, 16),
  slim: (A) => bodyFish(A, 11, 1.05),
  tall: (A) => bodyFish(A, 23, 0.85),
  flat(A) {
    const g = nid('fg');
    let s = `<defs><radialGradient id="${g}"><stop offset="0" stop-color="${A.w}"/><stop offset="1" stop-color="${A.b}"/></radialGradient></defs>`;
    s += `<path d="M18 50 L8 40 L10 50 L8 60Z" fill="${A.f}"/>`;
    s += `<ellipse cx="52" cy="50" rx="36" ry="26" fill="${A.f}"/><ellipse cx="52" cy="50" rx="31" ry="21" fill="url(#${g})"/>`;
    for (let i = 0; i < 14; i++) s += `<circle cx="${30 + ((i * 41) % 46)}" cy="${36 + ((i * 19) % 28)}" r="${1.2 + (i % 3)}" fill="${A.pc}" opacity=".6"/>`;
    for (let i = 0; i < 12; i++) s += `<line x1="${24 + i * 5.5}" y1="27" x2="${24 + i * 5.5}" y2="23" stroke="${shade(A.f, 0.8)}" stroke-width="1"/>`;
    return s + eye(72, 42, 3.4) + eye(78, 49, 3.4) + `<path d="M84 56 q-3 2 -6 0" stroke="#5a4a3a" stroke-width="1.2" fill="none"/>`;
  },
  eel(A) {
    let s = `<path d="M12 62 C26 40 38 76 54 54 C66 38 76 48 88 46" stroke="${A.b}" stroke-width="13" fill="none" stroke-linecap="round"/>`;
    s += `<path d="M12 64 C26 44 38 80 54 58 C66 42 76 52 88 50" stroke="${A.w}" stroke-width="4" fill="none" stroke-linecap="round" opacity=".9"/>`;
    s += `<path d="M14 55 C28 33 40 68 55 46 C66 31 76 40 84 39" stroke="${A.f}" stroke-width="2.4" fill="none" stroke-dasharray="3 2"/>`;
    return s + eye(85, 43, 3.2) + `<path d="M94 47 q-4 3 -8 1" stroke="#3a2f24" stroke-width="1.2" fill="none"/>`;
  },
  puffer(A) {
    const g = nid('fg');
    let s = `<defs><radialGradient id="${g}" cx=".4" cy=".35"><stop offset="0" stop-color="${A.w}"/><stop offset="1" stop-color="${A.b}"/></radialGradient></defs>`;
    for (let i = 0; i < 18; i++) { const a = (i / 18) * Math.PI * 2; s += `<path d="M${52 + Math.cos(a) * 26} ${50 + Math.sin(a) * 24} L${52 + Math.cos(a) * 35} ${50 + Math.sin(a) * 33} L${52 + Math.cos(a + 0.12) * 26} ${50 + Math.sin(a + 0.12) * 24}Z" fill="${A.f}"/>`; }
    s += `<path d="M24 50 L12 42 L14 50 L12 58Z" fill="${A.f}"/><ellipse cx="52" cy="50" rx="28" ry="26" fill="url(#${g})"/>`;
    for (let i = 0; i < 10; i++) s += `<circle cx="${36 + ((i * 31) % 34)}" cy="${36 + ((i * 17) % 22)}" r="1.8" fill="${A.pc}" opacity=".6"/>`;
    return s + eye(66, 42, 5) + `<ellipse cx="78" cy="54" rx="3" ry="2.4" fill="#5a3a2a"/>`;
  },
  lantern(A) {
    let s = `<circle cx="70" cy="18" r="12" fill="#fff3a0" opacity=".35"/><path d="M58 34 Q60 16 70 18" stroke="${A.f}" stroke-width="2" fill="none"/><circle cx="70" cy="18" r="5" fill="#fff6c0"/>`;
    s += bodyFish({ ...A, tail: 'round' }, 21, 0.85);
    s += `<path d="M78 54 l3 4 l3 -4 l3 4 l3 -4" stroke="#fff" stroke-width="1.2" fill="none"/>`;
    return s;
  },
  squid(A) {
    let s = '';
    for (let i = 0; i < 8; i++) s += `<path d="M${30 - (A.long ? 6 : 0)} ${44 + i * 1.6} C${18 - i} ${40 + i * 3} ${14 - i} ${56 + i} ${6 + i * 1.5} ${50 + (i - 4) * 4}" stroke="${i % 2 ? A.f : A.b}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
    const L = A.long ? 62 : 52;
    s += `<path d="M28 42 L${28 + L} 50 L28 58 Q22 50 28 42Z" fill="${A.b}"/><path d="M${28 + L - 16} 46 L${28 + L + 4} 34 L${28 + L} 50Z" fill="${A.f}"/><path d="M${28 + L - 16} 54 L${28 + L + 4} 66 L${28 + L} 50Z" fill="${A.f}"/>`;
    for (let i = 0; i < 12; i++) s += `<circle cx="${36 + ((i * 13) % (L - 14))}" cy="${46 + ((i * 7) % 9)}" r="1.2" fill="${A.pc}" opacity=".8"/>`;
    return s + eye(34, 46, 3.6);
  },
  shrimp(A) {
    let s = `<path d="M84 40 C96 20 70 14 60 22" stroke="${A.f}" stroke-width="1.2" fill="none"/><path d="M82 42 C98 30 80 22 72 26" stroke="${A.f}" stroke-width="1" fill="none"/>`;
    for (let i = 0; i < 6; i++) { const a = -0.4 + i * 0.42, x = 52 + Math.cos(a + 1.6) * 26, y = 52 + Math.sin(a + 1.6) * 22; s += `<ellipse cx="${x}" cy="${y}" rx="${11 - i}" ry="${9 - i * 0.6}" fill="${i % 2 ? A.b : shade(A.b, 0.92)}" stroke="${A.f}" stroke-width="1"/>`; }
    s += `<path d="M30 76 L20 84 L28 88 L36 82Z" fill="${A.f}"/><ellipse cx="72" cy="44" rx="16" ry="11" fill="${A.b}" stroke="${A.f}" stroke-width="1.2"/>`;
    for (let i = 0; i < 5; i++) s += `<line x1="${52 + i * 6}" y1="${60 - i}" x2="${48 + i * 6}" y2="${70 - i}" stroke="${A.f}" stroke-width="1.3"/>`;
    return s + eye(80, 40, 3.2) + `<path d="M88 46 l10 -2" stroke="${A.f}" stroke-width="1.6"/>`;
  },
  crab(A) {
    const g = nid('fg');
    let s = `<defs><radialGradient id="${g}" cx=".45" cy=".35"><stop offset="0" stop-color="${A.w}"/><stop offset="1" stop-color="${A.b}"/></radialGradient></defs>`;
    for (const sx of [-1, 1]) {
      for (let i = 0; i < 3; i++) s += `<path d="M${50 + sx * 20} ${56 + i * 5} q${sx * 12} ${2 + i * 2} ${sx * 18} ${10 + i * 3}" stroke="${A.f}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
      s += `<path d="M${50 + sx * 22} 46 Q${50 + sx * 34} 36 ${50 + sx * 34} 28" stroke="${A.f}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
      s += `<path d="M${50 + sx * 34} 28 m-7 0 a8 8 0 1 0 14 0 l-4 -6 l-3 6 l-3 -6z" fill="${A.b}" stroke="${A.f}" stroke-width="1.2"/>`;
    }
    s += `<ellipse cx="50" cy="54" rx="26" ry="18" fill="url(#${g})" stroke="${A.f}" stroke-width="1.5"/>`;
    if (A.spikes) for (let i = 0; i < 9; i++) s += `<path d="M${32 + i * 4.5} ${42 + Math.abs(i - 4)} l2 -5 l2 5z" fill="${A.f}"/>`;
    s += `<path d="M38 62 q12 6 24 0" stroke="${A.f}" stroke-width="1.2" fill="none"/>`;
    return s + `<line x1="44" y1="40" x2="42" y2="33" stroke="${A.f}" stroke-width="1.6"/><line x1="56" y1="40" x2="58" y2="33" stroke="${A.f}" stroke-width="1.6"/>` + eye(42, 32, 3) + eye(58, 32, 3);
  },
  lobster(A) {
    let s = '';
    for (let i = 0; i < 6; i++) s += `<rect x="${18 + i * 7}" y="${44 + Math.abs(i - 2) * 0.6}" width="8" height="${14 - i * 0.5}" rx="3" fill="${i % 2 ? A.b : shade(A.b, 0.9)}" stroke="${A.f}" stroke-width=".9"/>`;
    s += `<path d="M18 50 L6 42 L8 51 L6 60Z" fill="${A.w}"/><ellipse cx="66" cy="51" rx="16" ry="10" fill="${A.b}" stroke="${A.f}" stroke-width="1.2"/>`;
    for (const sy of [-1, 1]) { s += `<path d="M70 ${51 + sy * 8} Q80 ${51 + sy * 18} 84 ${51 + sy * 24}" stroke="${A.b}" stroke-width="4" fill="none"/><path d="M84 ${51 + sy * 24} m-6 0 a7 6 0 1 0 14 0 l-2 ${-sy * 7} l-4 ${sy * 5}z" fill="${A.w}" stroke="${A.f}" stroke-width="1"/>`; }
    s += `<path d="M80 46 C96 30 98 20 92 14" stroke="${A.w}" stroke-width="1.2" fill="none"/><path d="M80 48 C98 40 100 30 96 24" stroke="${A.w}" stroke-width="1.2" fill="none"/>`;
    return s + eye(76, 46, 2.8);
  },
  shell(A) {
    let s = `<path d="M50 84 L14 46 Q50 4 86 46Z" fill="${A.b}" stroke="${A.f}" stroke-width="1.5"/>`;
    for (let i = -4; i <= 4; i++) s += `<path d="M50 84 L${50 + i * 9} ${24 + Math.abs(i) * 4}" stroke="${A.f}" stroke-width="1.2" opacity=".8"/>`;
    for (let r = 1; r < 4; r++) s += `<path d="M${50 - r * 9} ${84 - r * 10} Q50 ${80 - r * 16} ${50 + r * 9} ${84 - r * 10}" stroke="${A.w}" stroke-width="1" fill="none" opacity=".8"/>`;
    return s + `<path d="M40 84 h20 l-4 8 h-12z" fill="${A.f}"/><circle cx="50" cy="62" r="5" fill="#fff" opacity=".9"/><circle cx="48.5" cy="60.5" r="1.6" fill="#fff"/>`;
  },
  jelly(A) {
    let s = `<circle cx="50" cy="40" r="34" fill="${A.b}" opacity=".25"/>`;
    for (let i = 0; i < 7; i++) s += `<path d="M${28 + i * 7.5} 44 C${24 + i * 7.5} 60 ${34 + i * 7.5} 72 ${26 + i * 7.5} ${88 - (i % 3) * 5}" stroke="${i % 2 ? A.f : A.b}" stroke-width="2.2" fill="none" opacity=".85"/>`;
    s += `<path d="M22 46 Q22 14 50 14 Q78 14 78 46 Q64 40 50 46 Q36 40 22 46Z" fill="${A.b}" opacity=".9"/><path d="M30 30 Q50 20 70 30" stroke="${A.w}" stroke-width="3" fill="none" opacity=".8"/>`;
    for (let i = 0; i < 4; i++) s += `<circle cx="${38 + i * 8}" cy="36" r="3" fill="${A.w}" opacity=".7"/>`;
    return s;
  },
  seahorse(A) {
    let s = `<path d="M56 18 C74 16 74 36 60 40 C50 44 46 54 52 64 C58 74 52 86 40 84 C32 82 34 74 40 74" stroke="${A.b}" stroke-width="13" fill="none" stroke-linecap="round"/>`;
    s += `<path d="M58 30 C66 30 68 22 60 22" stroke="${A.w}" stroke-width="3" fill="none"/>`;
    for (let i = 0; i < 7; i++) s += `<line x1="${54 + Math.cos(i) * 2}" y1="${36 + i * 6}" x2="${48 - (i % 2) * 2}" y2="${36 + i * 6}" stroke="${A.f}" stroke-width="1.4"/>`;
    s += `<path d="M62 18 L84 22 L84 26 L62 26Z" fill="${A.b}"/><path d="M44 46 q-12 4 -6 14" fill="${A.f}" stroke="${A.f}" stroke-width="2"/>`;
    for (let i = 0; i < 4; i++) s += `<path d="M${54 + i * 4} 12 l2 -6 l2 6z" fill="${A.f}"/>`;
    return s + eye(62, 22, 3.6);
  },
  dragon(A) {
    let s = `<path d="M10 70 C24 46 36 82 52 56 C62 40 74 50 84 40" stroke="${A.b}" stroke-width="12" fill="none" stroke-linecap="round"/>`;
    s += `<path d="M10 72 C24 50 36 86 52 60 C62 44 74 54 84 44" stroke="${A.w}" stroke-width="3" fill="none"/>`;
    for (let i = 0; i < 6; i++) { const x = 16 + i * 12, y = [60, 56, 72, 54, 44, 44][i]; s += `<path d="M${x} ${y - 6} q-6 -12 4 -14 q2 8 4 12" fill="${A.f}" opacity=".9"/>`; }
    s += `<path d="M82 36 l12 -6 l-4 8 l8 2 l-12 4Z" fill="${A.b}"/><path d="M84 32 q4 -12 10 -14 M80 32 q-2 -12 4 -16" stroke="${A.f}" stroke-width="1.6" fill="none"/>`;
    return s + eye(86, 37, 2.8);
  },
  whale(A) {
    let s = `<circle cx="50" cy="50" r="44" fill="${A.f}" opacity=".18"/><path d="M14 46 L4 30 L18 40 L6 58Z" fill="${A.b}"/>`;
    s += `<path d="M14 48 C20 20 80 16 90 44 C94 64 70 76 46 72 C28 70 16 62 14 48Z" fill="${A.b}"/><path d="M22 58 C40 74 74 72 88 54 C80 70 50 78 30 66Z" fill="${A.w}"/>`;
    for (let i = 0; i < 5; i++) s += `<path d="M${46 + i * 7} 62 q3 6 6 0" stroke="${shade(A.b, 0.8)}" stroke-width="1" fill="none"/>`;
    s += `<path d="M56 60 q-6 12 6 14" fill="${A.f}"/>`;
    for (let i = 0; i < 6; i++) s += `<circle cx="${20 + ((i * 37) % 64)}" cy="${18 + ((i * 23) % 16)}" r="1.4" fill="#fff8c0"/>`;
    return s + `<path d="M60 18 q-2 -8 4 -10 M60 18 q6 -6 10 -2" stroke="#e8eeff" stroke-width="1.6" fill="none"/>` + eye(76, 44, 4);
  },
};

/** Hình cá theo mã loài (FISH) hoặc 'mong'. Không có trong bảng thì vẽ cá thường màu xám xanh. */
export function fishArt(id, { shiny = false } = {}) {
  const A = FISH_ART[id] || { shape: 'fish', b: '#8fb0c8', w: '#eef3f8', f: '#6f90aa', pat: 'scales' };
  let inner = (FISH_SHAPES[A.shape] || FISH_SHAPES.fish)(A);
  if (A.glow) inner = `<circle cx="50" cy="50" r="46" fill="${A.f}" opacity=".12"/>` + inner;
  if (shiny) inner += `<path d="M84 16 l2 -6 l2 6 l6 2 l-6 2 l-2 6 l-2 -6 l-6 -2z" fill="#ffd34e"/><path d="M14 80 l1.5 -4 l1.5 4 l4 1.5 l-4 1.5 l-1.5 4 l-1.5 -4 l-4 -1.5z" fill="#fff3a0"/>`;
  // cá dẹt ngang: khung rộng hơn để đuôi không bị cắt và cá trông to hơn
  const wide = { fish: 1, slim: 1, tall: 1, lantern: 1, eel: 1, squid: 1, dragon: 1 }[A.shape];
  return svg('art-fish', inner, A.bill ? '-8 0 124 100' : wide ? '-8 4 108 92' : '0 0 100 100');
}

// ============================================================= HẠT GIỐNG
/** Gói hạt giống: túi giấy màu theo màu hoa, có cửa sổ vẽ bông hoa + vài hạt */
export function seedArt(vkey) {
  const { species, variant } = parseVkey(vkey);
  const F = FLOWERS[species];
  if (!F) return svg('art-seed', '');
  const c = variantColors(species, variant);
  const g = nid('sp');
  let s = `<defs><linearGradient id="${g}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fffaf2"/><stop offset="1" stop-color="${c.petal}" stop-opacity=".55"/></linearGradient></defs>`;
  s += `<rect x="20" y="16" width="62" height="78" rx="6" fill="#00000018" transform="translate(3 3)"/>`;
  s += `<path d="M18 22 l4 -6 l4 6 l4 -6 l4 6 l4 -6 l4 6 l4 -6 l4 6 l4 -6 l4 6 l4 -6 l4 6 l4 -6 l4 6 l4 -6 l2 4 V90 a6 6 0 0 1 -6 6 H24 a6 6 0 0 1 -6 -6Z" fill="url(#${g})" stroke="${c.petalDark}" stroke-width="1.5"/>`;
  s += `<rect x="18" y="26" width="64" height="7" fill="${c.petal}" opacity=".75"/>`;
  s += `<rect x="27" y="38" width="46" height="38" rx="5" fill="#ffffff" stroke="${c.petalDark}" stroke-width="1.2"/>`;
  s += `<path d="M50 74 Q49 64 50 58" stroke="#5fae5c" stroke-width="2.2" fill="none"/><ellipse cx="43" cy="66" rx="5" ry="2.4" transform="rotate(-25 43 66)" fill="#7cc27f"/><ellipse cx="57" cy="68" rx="5" ry="2.4" transform="rotate(25 57 68)" fill="#7cc27f"/>`;
  s += flowerSVG(species, variant, 50, 52, 11);
  for (let i = 0; i < 5; i++) s += `<ellipse cx="${32 + i * 9}" cy="${84 + (i % 2) * 3}" rx="2.6" ry="1.7" transform="rotate(${i * 30} ${32 + i * 9} ${84 + (i % 2) * 3})" fill="#a8784f"/>`;
  if (F.luck) s += `<path d="M76 14 l2 -6 l2 6 l6 2 l-6 2 l-2 6 l-2 -6 l-6 -2z" fill="#ffd34e"/>`;
  return svg('art-seed', s);
}

// ============================================================= VẬT PHẨM
const ITEMS = {
  fertilizer: () => `<path d="M26 30 Q24 22 32 20 H68 Q76 22 74 30 L78 86 Q78 94 70 94 H30 Q22 94 22 86Z" fill="#c9a27e" stroke="#8a6a48" stroke-width="1.5"/><path d="M30 20 Q50 12 70 20 L66 28 Q50 22 34 28Z" fill="#a8845c"/><rect x="30" y="44" width="40" height="30" rx="4" fill="#fff3e0"/><path d="M50 70 Q48 58 50 52" stroke="#5fae5c" stroke-width="2.4" fill="none"/><ellipse cx="43" cy="56" rx="6" ry="3" transform="rotate(-30 43 56)" fill="#7cc27f"/><ellipse cx="57" cy="54" rx="6" ry="3" transform="rotate(30 57 54)" fill="#7cc27f"/><circle cx="62" cy="86" r="3" fill="#6b4a32"/><circle cx="68" cy="82" r="2.4" fill="#6b4a32"/>`,
  worm: () => `<ellipse cx="50" cy="80" rx="34" ry="8" fill="#8a5a3a" opacity=".5"/><path d="M18 70 C26 50 42 80 52 60 C60 44 74 66 84 50" stroke="#f2a0a8" stroke-width="11" fill="none" stroke-linecap="round"/>${[0, 1, 2, 3, 4, 5].map((i) => `<path d="M${26 + i * 10} ${64 - (i % 2) * 6} q2 6 0 10" stroke="#d97a86" stroke-width="1.4" fill="none"/>`).join('')}<circle cx="84" cy="49" r="1.6" fill="#3a2a2a"/>`,
  shrimp: () => FISH_SHAPES.shrimp({ b: '#ffb08a', w: '#ffd8c0', f: '#e07a52' }),
  crab: () => FISH_SHAPES.crab({ b: '#f2804a', w: '#ffc9a0', f: '#c25a2a' }),
  petal: () => `<circle cx="50" cy="50" r="40" fill="#ffd1e0" opacity=".4"/>${[0, 1, 2, 3, 4].map((i) => { const a = (i / 5) * Math.PI * 2 - Math.PI / 2; return `<ellipse cx="${50 + Math.cos(a) * 18}" cy="${50 + Math.sin(a) * 18}" rx="16" ry="10" transform="rotate(${(a * 180) / Math.PI} ${50 + Math.cos(a) * 18} ${50 + Math.sin(a) * 18})" fill="${i % 2 ? '#ff8fb1' : '#ffb8cf'}"/>`; }).join('')}<circle cx="50" cy="50" r="8" fill="#ffd36e"/><path d="M50 10 q8 10 0 18" stroke="#ff8fb1" stroke-width="1" fill="none" stroke-dasharray="2 2"/>`,
  glow: () => `<circle cx="50" cy="52" r="40" fill="#fff3a0" opacity=".3"/><circle cx="50" cy="52" r="26" fill="#fff6c8" opacity=".55"/><path d="M38 34 Q50 22 62 34 L60 70 Q50 78 40 70Z" fill="#cfe9ff" stroke="#8fb8e0" stroke-width="1.5"/><rect x="40" y="24" width="20" height="8" rx="2" fill="#a8845c"/><circle cx="46" cy="56" r="5" fill="#fff3a0"/><circle cx="55" cy="48" r="4" fill="#d9ff7a"/><circle cx="52" cy="62" r="3" fill="#ffe08a"/><path d="M80 20 l2 -6 l2 6 l6 2 l-6 2 l-2 6 l-2 -6 l-6 -2z" fill="#ffd34e"/>`,
  boot: () => `<path d="M34 14 H62 V58 L86 68 Q92 72 88 82 H30 Q26 82 28 74Z" fill="#6f6a5a" stroke="#4a463a" stroke-width="1.5"/><rect x="30" y="80" width="60" height="8" rx="3" fill="#3f3b30"/><path d="M34 22 H62" stroke="#8a8572" stroke-width="3"/><path d="M58 62 l6 6 M64 60 l6 6" stroke="#4a463a" stroke-width="1.4"/><path d="M40 40 q4 6 0 12" stroke="#9fd8a0" stroke-width="2.4" fill="none"/>`,
  bottle: () => `<path d="M42 10 H58 V30 Q72 38 72 52 V86 Q72 94 64 94 H36 Q28 94 28 86 V52 Q28 38 42 30Z" fill="#9fd8c8" opacity=".75" stroke="#5fa898" stroke-width="1.5"/><rect x="40" y="6" width="20" height="8" rx="2" fill="#b98a5e"/><rect x="36" y="54" width="28" height="22" rx="3" fill="#fff3e0" transform="rotate(-6 50 64)"/><path d="M40 60 h20 M40 66 h16" stroke="#c9a27e" stroke-width="1.2" transform="rotate(-6 50 64)"/><path d="M34 40 Q34 70 36 84" stroke="#fff" stroke-width="3" opacity=".6" fill="none"/>`,
  net: () => `${[0, 1, 2, 3, 4].map((i) => `<path d="M${14 + i * 18} 14 Q${24 + i * 14} 50 ${18 + i * 16} 88" stroke="#a8946f" stroke-width="2" fill="none"/>`).join('')}${[0, 1, 2, 3, 4].map((i) => `<path d="M10 ${18 + i * 17} Q50 ${26 + i * 15} 90 ${16 + i * 18}" stroke="#a8946f" stroke-width="2" fill="none"/>`).join('')}<circle cx="80" cy="26" r="6" fill="#ff8a4a"/><path d="M60 60 L72 76" stroke="#fff" stroke-width="3"/>`,
  log: () => `<rect x="12" y="38" width="68" height="28" rx="12" fill="#8a6446"/><ellipse cx="80" cy="52" rx="10" ry="14" fill="#c9a27e" stroke="#8a6446" stroke-width="2"/><ellipse cx="80" cy="52" rx="5" ry="8" fill="none" stroke="#a8845c" stroke-width="1.4"/><path d="M20 46 h40 M26 58 h34" stroke="#6b4a32" stroke-width="1.6"/><circle cx="34" cy="40" r="4" fill="#7cc27f"/><circle cx="40" cy="38" r="3" fill="#9fd88a"/>`,
  pearl: () => `<path d="M10 70 Q50 96 90 70 Q50 82 10 70Z" fill="#e8c9b8" stroke="#c99a86" stroke-width="1.5"/><path d="M10 62 Q50 10 90 62 Q50 50 10 62Z" fill="#f2dccd" stroke="#c99a86" stroke-width="1.5"/><circle cx="50" cy="68" r="14" fill="#f8f4ff"/><circle cx="50" cy="68" r="14" fill="#d8c8ff" opacity=".35"/><circle cx="45" cy="63" r="4" fill="#fff"/>`,
  chest: () => `<rect x="14" y="44" width="72" height="44" rx="5" fill="#a8743f" stroke="#6b4a26" stroke-width="2"/><path d="M14 46 Q50 10 86 46Z" fill="#c08a4f" stroke="#6b4a26" stroke-width="2"/><rect x="14" y="44" width="72" height="6" fill="#e0b040"/><rect x="26" y="44" width="6" height="44" fill="#e0b040"/><rect x="68" y="44" width="6" height="44" fill="#e0b040"/><rect x="43" y="52" width="14" height="14" rx="2" fill="#ffd34e" stroke="#a87a1a" stroke-width="1.5"/><circle cx="50" cy="58" r="2.2" fill="#6b4a26"/><circle cx="80" cy="30" r="4" fill="#fff6c0"/><circle cx="22" cy="28" r="3" fill="#fff6c0"/>`,
};
const JUNK_KIND = { 'Chiếc ủng cũ': 'boot', 'Chai rỗng': 'bottle', 'Mảnh lưới rách': 'net', 'Khúc gỗ mục': 'log' };

/** kind: 'supply' | 'bait' | 'junk' (id = tên rác) | 'pearl' | 'chest'. Không có hình thì trả null (dùng emoji như cũ). */
export function itemArt(kind, id) {
  const key = kind === 'junk' ? JUNK_KIND[id] : kind === 'pearl' || kind === 'chest' ? kind : id;
  const f = ITEMS[key];
  return f ? svg(`art-item art-${key}`, f()) : null;
}
