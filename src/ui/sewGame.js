// 🧵 Mini game "May đồ cùng Bà Tư" (0.29) — thay cho game Xỏ kim cũ.
// Giữ ngón tay lên cây kim rồi kéo theo đường may chấm trên mảnh vải. Đi chệch khỏi đường = lệch mũi (trừ sao).
// Cùng kiểu "engine" với src/ui/minigames.js: (area, cfg, api) → hàm dọn dẹp. Số liệu: MINIGAMES.sew / MG_LEVELS.sew (data/minigames.js).

function loop(fn) {
  let raf = 0, last = performance.now(), on = true;
  const f = (t) => { if (!on) return; const dt = Math.min(0.25, (t - last) / 1000); /* đếm theo giờ thật: máy chậm vẫn đúng giờ */ last = t; fn(dt, t); raf = requestAnimationFrame(f); };
  raf = requestAnimationFrame(f);
  return () => { on = false; cancelAnimationFrame(raf); };
}
const shuffle = (arr) => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };

// Các mẫu đường may: f(t) → [u, v] trong ô (0..1). square: vẽ trong khung tròn thêu (giữ tỉ lệ)
const PATTERNS = [
  { name: 'Viền khăn tay', fabric: '#ffe3ea', check: '#f6a6b9', thread: '#d6336c',
    f: (t) => [0.06 + 0.88 * t, 0.5 + 0.3 * Math.sin(t * Math.PI * 3)] },
  { name: 'Răng cưa váy', fabric: '#e3f3ff', check: '#8fc8f0', thread: '#2f6fb0',
    f: (t) => { const k = t * 5, i = Math.floor(Math.min(4.999, k)), fr = k - i; return [0.06 + 0.88 * t, i % 2 ? 0.22 + 0.56 * fr : 0.78 - 0.56 * fr]; } },
  { name: 'Thêu trái tim', square: true, fabric: '#fff6e0', check: '#f2cf86', thread: '#e8384f',
    f: (t) => { const a = t * Math.PI * 2; const x = 16 * Math.sin(a) ** 3, y = 13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a); return [0.5 + x / 38, 0.47 - y / 36]; } },
  { name: 'Thêu bông hoa', square: true, fabric: '#eef9e8', check: '#a6dd94', thread: '#8a4fd8',
    f: (t) => { const a = t * Math.PI * 2 - Math.PI / 2; const r = 0.2 + 0.2 * Math.abs(Math.cos(2.5 * (a + Math.PI / 2))); return [0.5 + Math.cos(a) * r, 0.5 + Math.sin(a) * r]; } },
  { name: 'Đường cuộn len', fabric: '#f3ecff', check: '#c8b4f0', thread: '#5a4fcf',
    f: (t) => { const a = t * Math.PI * 4; return [0.1 + 0.8 * t - 0.11 * Math.sin(a), 0.5 - 0.25 * Math.cos(a)]; } },
];

export const SEW_ENGINES = {
  /** 🧵 May đồ: kéo kim theo đường chỉ chấm */
  sew(area, cfg, api) {
    area.innerHTML = '<div class="sewg"><canvas></canvas><div class="hg-time"><i></i></div><div class="mg-pop"></div></div>';
    const box = area.firstElementChild, cv = box.querySelector('canvas'), ctx = cv.getContext('2d');
    const bar = box.querySelector('.hg-time i'), pop = box.querySelector('.mg-pop');
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let W = 0, H = 0;
    const fit = () => { W = box.clientWidth || 600; H = box.clientHeight || 300; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    fit();
    const order = shuffle(PATTERNS.slice()).slice(0, cfg.pieces);
    let piece = -1, P = null, pts = [], rect = null, idx = 0, tol = 20, mile = 0;
    let left = cfg.seconds, slips = 0, slipping = false, drag = false, over = false, pause = 0, t = 0;
    const needle = { x: 0, y: 0, a: 0 };
    const showPop = (txt, ms = 700) => { pop.textContent = txt; pop.classList.add('show'); setTimeout(() => pop.classList.remove('show'), ms); };

    // dựng mảnh vải + điểm đường may (chia đều theo độ dài)
    const nextPiece = () => {
      piece++;
      if (piece >= order.length) { finish(); return; }
      P = order[piece];
      const m = 16, top = 12, bot = 26;
      rect = { x: m, y: top, w: W - m * 2, h: H - top - bot };
      let gx = rect.x + 18, gy = rect.y + 14, gw = rect.w - 36, gh = rect.h - 28;
      if (P.square) { const s = Math.min(gw, gh); gx += (gw - s) / 2; gy += (gh - s) / 2; gw = gh = s; }
      P.g = { x: gx, y: gy, w: gw, h: gh };
      const raw = [];
      for (let i = 0; i <= 600; i++) { const [u, v] = P.f(i / 600); raw.push([gx + u * gw, gy + v * gh]); }
      const step = 6;
      pts = [raw[0]];
      let acc = 0;
      for (let i = 1; i < raw.length; i++) {
        acc += Math.hypot(raw[i][0] - raw[i - 1][0], raw[i][1] - raw[i - 1][1]);
        if (acc >= step) { pts.push(raw[i]); acc = 0; }
      }
      idx = 0; mile = 0; slipping = false; drag = false;
      tol = cfg.tol * Math.max(0.8, Math.min(1.4, Math.min(W, H) / 300));
      needle.x = pts[0][0]; needle.y = pts[0][1];
      showPop(`🧵 ${P.name}`, 900);
      status();
    };
    const status = () => api.status(`🧵 Mảnh ${Math.min(piece + 1, order.length)}/${order.length} · ${Math.floor((idx / Math.max(1, pts.length - 1)) * 100)}% · lệch ${slips} mũi · ${Math.max(0, Math.ceil(left))} giây`);
    const finish = () => {
      if (over) return;
      over = true;
      api.end(slips <= cfg.slips[0] ? 3 : slips <= cfg.slips[1] ? 2 : 1);
    };
    const clientEv = (x, y) => { const r = cv.getBoundingClientRect(); return { clientX: r.left + x, clientY: r.top + y }; };

    const posOf = (e) => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    const move = (x, y) => {
      needle.x = x; needle.y = y;
      // khoảng cách tới đoạn đường may quanh mũi đang may
      let d = Infinity;
      for (let k = Math.max(0, idx - 3); k < Math.min(pts.length, idx + 10); k++) d = Math.min(d, Math.hypot(pts[k][0] - x, pts[k][1] - y));
      if (d > tol * 1.5) {
        if (!slipping) { slipping = true; slips++; api.bad('🧵 Lệch đường may!'); status(); }
        return;
      }
      if (slipping && d < tol) slipping = false; // quay lại gần đường may là may tiếp được
      if (slipping) return;
      // tiến lên: lấy điểm xa nhất (trong 10 điểm kế tiếp) nằm trong tầm kim
      let best = idx;
      for (let k = idx + 1; k < Math.min(pts.length, idx + 11); k++) if (Math.hypot(pts[k][0] - x, pts[k][1] - y) <= tol) best = k;
      if (best > idx) {
        const a = pts[best], b = pts[Math.max(0, best - 2)];
        needle.a = Math.atan2(a[1] - b[1], a[0] - b[0]);
        idx = best;
        const frac = idx / (pts.length - 1);
        if (Math.floor(frac * 6) > mile) { mile = Math.floor(frac * 6); api.good(clientEv(x, y)); }
        if (idx >= pts.length - 1) {
          drag = false; pause = 0.9;
          showPop(`✨ Xong ${P.name}!`, 900);
        }
        status();
      }
    };
    const down = (e) => {
      if (over || pause > 0 || !pts.length) return;
      const [x, y] = posOf(e);
      if (Math.hypot(pts[idx][0] - x, pts[idx][1] - y) > Math.max(tol * 2.2, 34)) { showPop('👉 Đặt ngón tay lên cây kim 🪡'); return; }
      drag = true; slipping = false;
      try { cv.setPointerCapture(e.pointerId); } catch { /* sự kiện giả trong bài thử */ }
      move(x, y);
      e.preventDefault();
    };
    const mv = (e) => { if (!drag || over || pause > 0) return; const [x, y] = posOf(e); move(x, y); e.preventDefault(); };
    const up = () => { drag = false; if (!over && pause <= 0 && pts.length) { needle.x = pts[idx][0]; needle.y = pts[idx][1]; slipping = false; } };
    cv.addEventListener('pointerdown', down);
    cv.addEventListener('pointermove', mv);
    cv.addEventListener('pointerup', up);
    cv.addEventListener('pointercancel', up);

    // ----- vẽ -----
    const rr = (x, y, w, h, r) => { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); };
    const draw = () => {
      // mặt bàn gỗ
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#e8c9a0'); g.addColorStop(1, '#d4a877');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(150,100,60,.18)'; ctx.lineWidth = 1;
      for (let y = 8; y < H; y += 22) { ctx.beginPath(); ctx.moveTo(0, y); ctx.bezierCurveTo(W * 0.3, y + 4, W * 0.6, y - 4, W, y + 2); ctx.stroke(); }
      if (!P) return;
      const R = rect;
      // vải: bóng + nền + kẻ ca-rô + viền khâu sẵn
      ctx.save(); ctx.shadowColor = 'rgba(90,60,30,.3)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 4;
      rr(R.x, R.y, R.w, R.h, 10); ctx.fillStyle = P.fabric; ctx.fill(); ctx.restore();
      ctx.save(); rr(R.x, R.y, R.w, R.h, 10); ctx.clip();
      ctx.fillStyle = P.check; ctx.globalAlpha = 0.22;
      for (let x = R.x; x < R.x + R.w; x += 28) ctx.fillRect(x, R.y, 14, R.h);
      for (let y = R.y; y < R.y + R.h; y += 28) ctx.fillRect(R.x, y, R.w, 14);
      ctx.restore();
      ctx.setLineDash([6, 5]); ctx.strokeStyle = 'rgba(120,80,60,.35)'; ctx.lineWidth = 1.5;
      rr(R.x + 6, R.y + 6, R.w - 12, R.h - 12, 7); ctx.stroke(); ctx.setLineDash([]);
      // khung tròn thêu (mẫu vuông)
      if (P.square) {
        const c = P.g, cx = c.x + c.w / 2, cy = c.y + c.h / 2, r = c.w * 0.56;
        ctx.lineWidth = 9; ctx.strokeStyle = '#c99a66'; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
        ctx.lineWidth = 2; ctx.strokeStyle = '#a77a4a'; ctx.beginPath(); ctx.arc(cx, cy, r + 4, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = '#b8895a'; rr(cx - 7, cy - r - 12, 14, 10, 3); ctx.fill();
      }
      // đường may còn lại: chấm trắng viền nâu, đoạn sắp may sáng hơn
      ctx.lineCap = 'round';
      ctx.setLineDash([2, 7]); ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(120,80,60,.35)';
      ctx.beginPath(); for (let k = idx; k < pts.length; k++) (k === idx ? ctx.moveTo : ctx.lineTo).call(ctx, pts[k][0], pts[k][1]); ctx.stroke();
      ctx.lineWidth = 2.2; ctx.strokeStyle = '#ffffff'; ctx.stroke();
      ctx.setLineDash([]);
      ctx.lineWidth = tol * 2; ctx.strokeStyle = 'rgba(255,255,255,.22)';
      ctx.beginPath(); for (let k = idx; k < Math.min(pts.length, idx + 14); k++) (k === idx ? ctx.moveTo : ctx.lineTo).call(ctx, pts[k][0], pts[k][1]); ctx.stroke();
      // nút kết thúc
      const e = pts[pts.length - 1];
      ctx.fillStyle = P.thread; ctx.beginPath(); ctx.arc(e[0], e[1], 5, 0, Math.PI * 2); ctx.fill();
      ctx.font = '14px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('🏁', e[0], e[1] - 9);
      // mũi chỉ đã may (đứt quãng như mũi khâu thật) + bóng
      for (const [col, off, w] of [['rgba(60,30,20,.25)', 1.2, 3.6], [P.thread, 0, 3.2]]) {
        ctx.strokeStyle = col; ctx.lineWidth = w;
        ctx.beginPath();
        for (let k = 0; k + 1 <= idx; k += 3) { const a = pts[k], b = pts[Math.min(idx, k + 2)]; ctx.moveTo(a[0] + off, a[1] + off); ctx.lineTo(b[0] + off, b[1] + off); }
        ctx.stroke();
      }
      // sợi chỉ từ mũi cuối tới kim
      const last = pts[idx];
      ctx.strokeStyle = P.thread; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(last[0], last[1]);
      const tx = needle.x - Math.cos(needle.a) * 30, ty = needle.y - Math.sin(needle.a) * 30;
      ctx.quadraticCurveTo((last[0] + tx) / 2, Math.max(last[1], ty) + 14, tx, ty); ctx.stroke();
      // vòng nhắc: lệch đường / chưa cầm kim
      const pulse = 0.5 + 0.5 * Math.sin(t * 6);
      if (slipping || (!drag && pause <= 0)) {
        ctx.strokeStyle = slipping ? `rgba(232,56,79,${0.5 + pulse * 0.5})` : `rgba(255,255,255,${0.6 + pulse * 0.4})`;
        ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(last[0], last[1], tol * (0.9 + pulse * 0.3), 0, Math.PI * 2); ctx.stroke();
        if (!drag && !slipping) { ctx.fillStyle = '#5a3d2b'; ctx.font = 'bold 12px sans-serif'; ctx.fillText('Giữ & kéo kim', last[0], last[1] - tol - 10); }
      }
      // cây kim: thân bạc, mũi nhọn ở vị trí ngón tay, lỗ kim ở đuôi
      ctx.save(); ctx.translate(needle.x, needle.y); ctx.rotate(needle.a + (slipping ? Math.sin(t * 40) * 0.15 : 0));
      ctx.shadowColor = 'rgba(0,0,0,.3)'; ctx.shadowBlur = 4; ctx.shadowOffsetY = 2;
      const ng = ctx.createLinearGradient(0, -3, 0, 3); ng.addColorStop(0, '#ffffff'); ng.addColorStop(0.5, '#b9c3cc'); ng.addColorStop(1, '#7d8a96');
      ctx.fillStyle = ng;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-10, -2.4); ctx.lineTo(-34, -2.6); ctx.arc(-34, 0, 2.6, -Math.PI / 2, Math.PI / 2, true); ctx.lineTo(-10, 2.4); ctx.closePath(); ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.fillStyle = P.fabric; ctx.beginPath(); ctx.ellipse(-31, 0, 2.6, 1, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    };

    const stop = loop((dt) => {
      t += dt;
      if (!over) {
        if (pause > 0) { pause -= dt; if (pause <= 0) nextPiece(); }
        else {
          left -= dt;
          bar.style.width = `${Math.max(0, (left / cfg.seconds) * 100)}%`;
          if (Math.floor(left + dt) !== Math.floor(left)) status();
          if (left <= 0) { over = true; api.end(0); return; }
        }
      }
      if (!over) draw();
    });
    const onResize = () => { fit(); };
    addEventListener('resize', onResize);
    nextPiece();
    // cho bài thử tự động đọc trạng thái
    window.__sew = { get pts() { return pts; }, get idx() { return idx; }, get tol() { return tol; }, get slips() { return slips; }, get piece() { return piece; }, get pause() { return pause; }, canvas: cv };
    return () => { stop(); removeEventListener('resize', onResize); cv.removeEventListener('pointerdown', down); cv.removeEventListener('pointermove', mv); cv.removeEventListener('pointerup', up); cv.removeEventListener('pointercancel', up); };
  },
};
