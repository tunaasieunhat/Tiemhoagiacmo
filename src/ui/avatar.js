// Ảnh đại diện chibi dạng SVG từ màu avatar.
export function avatarSVG(a, size = 44) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 100 100" aria-hidden="true">
    <circle cx="50" cy="50" r="48" fill="#fff6ee"/>
    ${a.hat ? `<ellipse cx="50" cy="28" rx="44" ry="8" fill="${a.hat}"/>` : ''}
    ${a.bun ? `<circle cx="50" cy="${a.hat ? 14 : 22}" r="13" fill="${a.hair}"/>` : ''}
    <circle cx="50" cy="56" r="30" fill="${a.skin}"/>
    <path d="M20 54 Q22 26 50 26 Q78 26 80 54 Q70 40 50 40 Q30 40 20 54Z" fill="${a.hair}"/>
    ${a.hat ? `<path d="M30 28 Q32 8 50 8 Q68 8 70 28Z" fill="${a.hat}"/>
    <rect x="30" y="24" width="40" height="5" rx="2" fill="#f28da0"/>` : `<path d="M22 50 Q24 30 50 30 Q76 30 78 50 Q66 38 50 40 Q34 38 22 50Z" fill="${a.hair}"/>`}
    <ellipse cx="39" cy="58" rx="4" ry="5.5" fill="#3b2a22"/>
    <ellipse cx="61" cy="58" rx="4" ry="5.5" fill="#3b2a22"/>
    <circle cx="40.5" cy="56" r="1.4" fill="#fff"/><circle cx="62.5" cy="56" r="1.4" fill="#fff"/>
    <ellipse cx="31" cy="67" rx="5" ry="3" fill="#ffab9c"/>
    <ellipse cx="69" cy="67" rx="5" ry="3" fill="#ffab9c"/>
    <path d="M45 69 Q50 73 55 69" stroke="#c96a5a" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <path d="M30 86 Q50 74 70 86 L70 100 L30 100Z" fill="${a.outfit}"/>
  </svg>`;
}
