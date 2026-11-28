// Chạy trong trang: đồng hồ ảo cho requestAnimationFrame / performance.now / setTimeout
window.__virt = function () {
  if (window.__vOn) return;
  const realNow = performance.now.bind(performance);
  let vt = realNow();
  const raf = [];
  const timers = new Map();
  let tid = 1e6;
  performance.now = () => vt;
  window.requestAnimationFrame = (fn) => { raf.push(fn); return raf.length; };
  window.cancelAnimationFrame = () => {};
  window.setTimeout = (fn, ms = 0, ...args) => { const id = tid++; timers.set(id, { fn, at: vt + (+ms || 0), args }); return id; };
  window.clearTimeout = (id) => timers.delete(id);
  window.setInterval = (fn, ms = 0, ...args) => { const id = tid++; timers.set(id, { fn, at: vt + (+ms || 1), every: Math.max(1, +ms || 1), args }); return id; };
  window.clearInterval = (id) => timers.delete(id);
  window.__vOn = true;
  window.__vt = () => vt;
  window.__step = (ms) => {
    const end = vt + ms;
    for (let guard = 0; guard < 500; guard++) {
      let best = null, bid = null;
      for (const [id, t] of timers) if (t.at <= end && (!best || t.at < best.at)) { best = t; bid = id; }
      if (!best) break;
      vt = Math.max(vt, best.at);
      if (best.every) best.at += best.every; else timers.delete(bid);
      try { typeof best.fn === 'function' ? best.fn(...best.args) : eval(best.fn); } catch (e) { console.error('timer', e); }
    }
    vt = end;
    if (window.__dir) { try { window.__dir(vt); } catch (e) { console.error('dir', e); } }
    const cbs = raf.splice(0);
    for (const fn of cbs) { try { fn(vt); } catch (e) { console.error('raf', e); } }
  };
};
