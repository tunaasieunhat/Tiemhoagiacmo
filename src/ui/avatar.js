// Ảnh đại diện chibi dạng SVG từ màu avatar.
// (GĐ26) vẽ thêm kiểu tóc, kiểu mũ, kính, cổ áo theo tủ đồ (data/wardrobe.js)
function hatSVG(a) {
  const c = a.hat;
  switch (a.hatKind || 'straw') {
    case 'cap': return `<path d="M24 38 Q26 12 50 12 Q74 12 76 38Z" fill="${c}"/><rect x="44" y="34" width="38" height="6" rx="3" fill="${c}"/>`;
    case 'beanie': return `<path d="M22 40 Q22 8 50 8 Q78 8 78 40Z" fill="${c}"/><rect x="20" y="34" width="60" height="8" rx="4" fill="#fff"/><circle cx="50" cy="8" r="6" fill="#fff"/>`;
    case 'bow': return `<ellipse cx="66" cy="22" rx="11" ry="7" fill="${c}"/><ellipse cx="84" cy="22" rx="11" ry="7" fill="${c}"/><circle cx="75" cy="22" r="4" fill="${c}"/>`;
    case 'flower': return ['#ff8fb1', '#ffd36e', '#fff', '#c9a2ff', '#8fd8ff', '#ff8fb1', '#ffd36e'].map((f, i) => `<circle cx="${26 + i * 8}" cy="${30 - Math.sin((i / 6) * Math.PI) * 8}" r="5" fill="${f}"/>`).join('');
    case 'bunny': return `<ellipse cx="38" cy="12" rx="6" ry="16" fill="${c}"/><ellipse cx="62" cy="12" rx="6" ry="16" fill="${c}"/><ellipse cx="38" cy="13" rx="3" ry="11" fill="#ffc6d6"/><ellipse cx="62" cy="13" rx="3" ry="11" fill="#ffc6d6"/>`;
    case 'crown': return `<path d="M32 30 L34 12 L42 22 L50 8 L58 22 L66 12 L68 30Z" fill="${c}"/><circle cx="50" cy="24" r="3" fill="#ff8fb1"/>`;
    case 'leaf': return `<path d="M50 26 L50 14" stroke="#5a8f4a" stroke-width="2"/><ellipse cx="44" cy="12" rx="7" ry="3" fill="${c}"/><ellipse cx="56" cy="12" rx="7" ry="3" fill="${c}"/>`;
    case 'chef': return `<rect x="34" y="18" width="32" height="14" fill="${c}"/><circle cx="40" cy="14" r="9" fill="${c}"/><circle cx="50" cy="10" r="10" fill="${c}"/><circle cx="60" cy="14" r="9" fill="${c}"/>`;
    case 'beret': return `<ellipse cx="54" cy="24" rx="30" ry="9" fill="${c}"/><rect x="52" y="12" width="3" height="6" fill="${c}"/>`;
    default: return `<ellipse cx="50" cy="28" rx="44" ry="8" fill="${c}"/><path d="M30 28 Q32 8 50 8 Q68 8 70 28Z" fill="${c}"/><rect x="30" y="24" width="40" height="5" rx="2" fill="#f28da0"/>`;
  }
}

function glassesSVG(g) {
  if (!g) return '';
  if (g === 'round') return '<circle cx="39" cy="58" r="8" fill="none" stroke="#3b2a22" stroke-width="2"/><circle cx="61" cy="58" r="8" fill="none" stroke="#3b2a22" stroke-width="2"/><path d="M47 58 L53 58" stroke="#3b2a22" stroke-width="2"/>';
  if (g === 'sun') return '<rect x="29" y="52" width="19" height="11" rx="4" fill="#2a2a33"/><rect x="52" y="52" width="19" height="11" rx="4" fill="#2a2a33"/><path d="M47 56 L53 56" stroke="#2a2a33" stroke-width="2"/>';
  const star = (x) => `<path d="M${x} 49 L${x + 3} 55 L${x + 9} 56 L${x + 4} 60 L${x + 6} 67 L${x} 63 L${x - 6} 67 L${x - 4} 60 L${x - 9} 56 L${x - 3} 55Z" fill="${g === 'heart' ? '#ff6f9a' : '#ffd36e'}"/>`;
  return star(39) + star(61);
}

export function avatarSVG(a, size = 44) {
  const hs = a.hairStyle || 'short';
  const back = hs === 'long' ? `<path d="M18 56 Q16 92 30 96 L70 96 Q84 92 82 56Z" fill="${a.hair}"/>`
    : hs === 'twin' ? `<circle cx="18" cy="66" r="10" fill="${a.hair}"/><circle cx="82" cy="66" r="10" fill="${a.hair}"/>`
      : hs === 'bob' ? `<path d="M18 52 Q16 80 28 82 L72 82 Q84 80 82 52Z" fill="${a.hair}"/>`
        : hs === 'pony' ? `<ellipse cx="84" cy="50" rx="9" ry="16" fill="${a.hair}"/>` : '';
  const top = hs === 'curly' ? [24, 36, 50, 64, 76].map((x) => `<circle cx="${x}" cy="${x === 50 ? 26 : 32}" r="10" fill="${a.hair}"/>`).join('')
    : hs === 'spiky' ? `<path d="M26 40 L30 18 L38 32 L44 12 L50 30 L56 12 L62 32 L70 18 L74 40Z" fill="${a.hair}"/>` : '';
  const collar = a.top === 'aodai' ? `<path d="M44 76 L50 82 L56 76" fill="none" stroke="${a.trim || '#fff'}" stroke-width="3"/>`
    : a.top === 'hoodie' ? `<path d="M30 84 Q50 70 70 84" fill="none" stroke="${a.trim || '#fff'}" stroke-width="4"/>` : '';
  return `<svg width="${size}" height="${size}" viewBox="0 0 100 100" aria-hidden="true">
    <circle cx="50" cy="50" r="48" fill="#fff6ee"/>
    ${back}
    ${a.bun ? `<circle cx="50" cy="${a.hat ? 14 : 22}" r="13" fill="${a.hair}"/>` : ''}
    <circle cx="50" cy="56" r="30" fill="${a.skin}"/>
    <path d="M20 54 Q22 26 50 26 Q78 26 80 54 Q70 40 50 40 Q30 40 20 54Z" fill="${a.hair}"/>
    ${top}
    ${a.hat ? hatSVG(a) : `<path d="M22 50 Q24 30 50 30 Q76 30 78 50 Q66 38 50 40 Q34 38 22 50Z" fill="${a.hair}"/>`}
    <ellipse cx="39" cy="58" rx="4" ry="5.5" fill="#3b2a22"/>
    <ellipse cx="61" cy="58" rx="4" ry="5.5" fill="#3b2a22"/>
    <circle cx="40.5" cy="56" r="1.4" fill="#fff"/><circle cx="62.5" cy="56" r="1.4" fill="#fff"/>
    ${glassesSVG(a.glasses)}
    <ellipse cx="31" cy="67" rx="5" ry="3" fill="#ffab9c"/>
    <ellipse cx="69" cy="67" rx="5" ry="3" fill="#ffab9c"/>
    <path d="M45 69 Q50 73 55 69" stroke="#c96a5a" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <path d="M30 86 Q50 74 70 86 L70 100 L30 100Z" fill="${a.outfit}"/>
    ${collar}
  </svg>`;
}
