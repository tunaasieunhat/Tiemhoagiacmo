// Nhạc nền + tiếng chạm. Lựa chọn của người chơi (âm lượng, bật/tắt) lưu trên từng máy (localStorage),
// vì intro và nhạc chạy trước khi đăng nhập / tải save.
import { AUDIO } from '../../data/audio.js';

const PREF_KEY = 'thgm:audio';

export function loadPrefs() {
  const def = { music: AUDIO.music.volume, sfx: AUDIO.sfx.volume, tapFx: AUDIO.tap.enabled, intro: AUDIO.intro.enabled };
  try {
    const saved = JSON.parse(localStorage.getItem(PREF_KEY) || '{}');
    return { ...def, ...saved };
  } catch { return def; }
}

export function savePrefs(p) {
  try { localStorage.setItem(PREF_KEY, JSON.stringify(p)); } catch { /* trình duyệt chặn lưu — bỏ qua */ }
}

const clamp01 = (v) => Math.min(1, Math.max(0, Number(v) || 0));

/** Phát lần lượt các bài trong AUDIO.music.tracks, lặp lại. Tự dừng khi ẩn app, phát tiếp khi mở lại. */
export class MusicPlayer {
  constructor(prefs) {
    this.prefs = prefs;
    this.area = 'main';
    this.tracks = AUDIO.music.tracks;
    this.idx = AUDIO.music.shuffle ? Math.floor(Math.random() * this.tracks.length) : 0;
    this.started = false;   // đã được phép phát (sau intro)
    this.broken = new Set(); // bài không tải được (vd trang xem thử không có file nhạc)
    this.el = new Audio();
    this.el.preload = 'auto';
    this.el.addEventListener('ended', () => this.next());
    this.el.addEventListener('error', () => {
      this.broken.add(this.idx);
      if (this.broken.size < this.tracks.length) setTimeout(() => this.next(), 500);
    });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') this.el.pause();
      else this.resume();
    });
    // trình duyệt chỉ cho phát tiếng sau khi người chơi chạm => mỗi lần chạm thử phát lại nếu đang bị chặn
    const unlock = () => this.resume();
    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('keydown', unlock);
  }

  get title() { return this.tracks[this.idx]?.title || ''; }
  get wanted() { return this.started && this.prefs.music > 0 && this.broken.size < this.tracks.length; }

  start() {
    if (this.started || !this.tracks.length) return;
    this.started = true;
    this.load();
    this.resume();
  }

  load() {
    const t = this.tracks[this.idx];
    if (!t) return;
    this.el.src = t.file;
    this.loaded = true;
  }

  resume() {
    if (!this.wanted || !this.el.paused || document.visibilityState === 'hidden') return;
    if (!this.loaded) this.load();
    const fresh = this.el.currentTime < 0.5;
    this.el.volume = fresh ? 0 : this.prefs.music;
    const p = this.el.play();
    if (p?.then) p.then(() => { if (fresh) this.fadeIn(); }).catch(() => { /* chờ người chơi chạm */ });
  }

  fadeIn() {
    clearInterval(this.fadeTimer);
    const steps = Math.max(1, Math.round(AUDIO.music.fadeInSeconds * 20));
    let i = 0;
    this.fadeTimer = setInterval(() => {
      i++;
      try { this.el.volume = clamp01(this.prefs.music * Math.min(1, i / steps)); } catch { /* iOS không cho chỉnh */ }
      if (i >= steps) clearInterval(this.fadeTimer);
    }, 50);
  }

  next() {
    if (!this.tracks.length) return;
    for (let k = 0; k < this.tracks.length; k++) {
      this.idx = (this.idx + 1) % this.tracks.length;
      if (!this.broken.has(this.idx)) break;
    }
    this.load();
    this.resume();
  }

  /**
   * Đổi vùng (vd 'en' = Mũi Én, 'main' = Đảo Mây): nhạc đang phát nhỏ dần rồi chuyển sang danh sách của vùng mới.
   * Vùng không có nhạc riêng thì dùng danh sách chung.
   */
  setArea(area) {
    const list = AUDIO.music.areas?.[area] || AUDIO.music.tracks;
    if (area === this.area || !list.length) return;
    this.area = area;
    const swap = () => {
      this.tracks = list;
      this.broken = new Set();
      this.idx = AUDIO.music.shuffle ? Math.floor(Math.random() * list.length) : 0;
      this.loaded = false;
      if (this.started) { this.load(); this.resume(); }
    };
    clearInterval(this.fadeTimer);
    clearTimeout(this.swapTimer);
    if (!this.started || this.el.paused) { swap(); return; }
    // nhỏ dần rồi mới đổi bài
    const steps = Math.max(1, Math.round((AUDIO.music.crossfadeSeconds ?? 1.5) * 20));
    const from = this.el.volume;
    let i = 0;
    this.fadeTimer = setInterval(() => {
      i++;
      try { this.el.volume = clamp01(from * (1 - i / steps)); } catch { /* iOS */ }
      if (i >= steps) { clearInterval(this.fadeTimer); this.el.pause(); swap(); }
    }, 50);
  }

  setVolume(v) {
    this.prefs.music = clamp01(v);
    clearInterval(this.fadeTimer);
    if (this.prefs.music === 0) { this.el.pause(); return; }
    try { this.el.volume = this.prefs.music; } catch { /* iOS */ }
    this.resume();
  }
}

/** Tiếng "tách" nhẹ khi chạm — tạo bằng Web Audio, không cần file. */
export class Sfx {
  constructor(prefs) {
    this.prefs = prefs;
    this.ctx = null;
    this.lastAt = 0;
  }

  ensure() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {}); return this.ctx; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try { this.ctx = new AC(); } catch { return null; }
    return this.ctx;
  }

  /** Tiếng chuông leng keng khi mở gói Vận May (notes: số nốt, càng hiếm càng nhiều nốt) */
  chime(notes = 3) {
    const vol = this.prefs.sfx;
    if (vol <= 0) return;
    const ctx = this.ensure();
    if (!ctx || ctx.state !== 'running') return;
    const scale = [784, 988, 1175, 1319, 1568, 1976];
    for (let i = 0; i < notes; i++) {
      const t = ctx.currentTime + i * 0.09;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.16 * vol, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
      g.connect(ctx.destination);
      const o = ctx.createOscillator();
      o.type = 'triangle';
      o.frequency.value = scale[i % scale.length];
      o.connect(g);
      o.start(t);
      o.stop(t + 0.55);
    }
  }

  /** Tiếng "bíp" ngắn khi chữ hội thoại hiện ra — pitch (Hz) khác nhau cho từng nhân vật */
  blip(pitch = 600) {
    const vol = this.prefs.sfx;
    if (vol <= 0) return;
    const ctx = this.ensure();
    if (!ctx || ctx.state !== 'running') return;
    const t = ctx.currentTime;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.07 * vol, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
    g.connect(ctx.destination);
    const o = ctx.createOscillator();
    o.type = pitch > 900 ? 'sine' : 'triangle';
    o.frequency.value = pitch * (1 + (Math.random() - 0.5) * 0.08);
    o.connect(g);
    o.start(t);
    o.stop(t + 0.08);
  }

  /** Bộ đệm tiếng ồn trắng (dùng cho mưa, sấm) */
  noise(ctx) {
    if (this.noiseBuf) return this.noiseBuf;
    const b = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    this.noiseBuf = b;
    return b;
  }

  /** (GĐ24) Tiếng mưa rì rào, gọi liên tục với level 0..1 (0 = tắt dần) */
  rain(level = 0) {
    const want = level * this.prefs.sfx;
    if (!this.rainNode && want <= 0) return;
    const ctx = this.ensure();
    if (!ctx || ctx.state !== 'running') return;
    if (!this.rainNode) {
      const src = ctx.createBufferSource(); src.buffer = this.noise(ctx); src.loop = true;
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1400;
      const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 300;
      const g = ctx.createGain(); g.gain.value = 0;
      src.connect(hp); hp.connect(lp); lp.connect(g); g.connect(ctx.destination);
      src.start();
      this.rainNode = { src, g };
    }
    const g = this.rainNode.g.gain;
    g.setTargetAtTime(want * 0.09, ctx.currentTime, 1.2);
    if (want <= 0 && g.value < 0.002) { try { this.rainNode.src.stop(); } catch { /* bỏ qua */ } this.rainNode = null; }
  }

  /** (GĐ24) Tiếng sấm: ồn trầm rền, tắt dần */
  thunder() {
    const vol = this.prefs.sfx;
    if (vol <= 0) return;
    const ctx = this.ensure();
    if (!ctx || ctx.state !== 'running') return;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource(); src.buffer = this.noise(ctx);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass';
    lp.frequency.setValueAtTime(900, t); lp.frequency.exponentialRampToValueAtTime(120, t + 2.5);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.5 * vol, t + 0.06);
    g.gain.exponentialRampToValueAtTime(0.18 * vol, t + 0.6);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 3.2);
    src.connect(lp); lp.connect(g); g.connect(ctx.destination);
    src.start(t); src.stop(t + 3.3);
  }

  tap(strength = 1) {
    const vol = this.prefs.sfx * strength;
    if (vol <= 0) return;
    const now = performance.now();
    if (now - this.lastAt < 45) return;
    this.lastAt = now;
    const ctx = this.ensure();
    if (!ctx || ctx.state !== 'running') return;
    const t = ctx.currentTime;
    const pitch = 1 + (Math.random() - 0.5) * 0.16;
    const out = ctx.createGain();
    out.gain.setValueAtTime(0.0001, t);
    out.gain.exponentialRampToValueAtTime(0.22 * vol, t + 0.008);
    out.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
    out.connect(ctx.destination);
    const o1 = ctx.createOscillator();
    o1.type = 'sine';
    o1.frequency.setValueAtTime(1050 * pitch, t);
    o1.frequency.exponentialRampToValueAtTime(560 * pitch, t + 0.09);
    o1.connect(out);
    const g2 = ctx.createGain();
    g2.gain.value = 0.25;
    g2.connect(out);
    const o2 = ctx.createOscillator();
    o2.type = 'triangle';
    o2.frequency.setValueAtTime(2100 * pitch, t);
    o2.frequency.exponentialRampToValueAtTime(1500 * pitch, t + 0.06);
    o2.connect(g2);
    o1.start(t); o2.start(t);
    o1.stop(t + 0.18); o2.stop(t + 0.18);
  }
}
