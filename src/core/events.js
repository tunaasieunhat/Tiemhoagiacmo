// Bộ phát sự kiện đơn giản để các phần của game "nói chuyện" với nhau.
export class Emitter {
  constructor() { this.map = new Map(); }
  on(name, fn) {
    if (!this.map.has(name)) this.map.set(name, new Set());
    this.map.get(name).add(fn);
    return () => this.map.get(name)?.delete(fn);
  }
  emit(name, payload) {
    this.map.get(name)?.forEach((fn) => {
      try { fn(payload); } catch (e) { console.error(`[event ${name}]`, e); }
    });
  }
}
