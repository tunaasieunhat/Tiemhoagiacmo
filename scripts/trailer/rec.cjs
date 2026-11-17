// Quay trailer: node rec.cjs [số giây tối đa để thử]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const FPS = 30, DT = 1000 / FPS;
const OUT = path.join(__dirname, 'frames');
const LIMIT = +(process.argv[2] || 1e9);
const EVERY = +(process.env.EVERY || 1); // chỉ lưu 1/EVERY khung (xem thử nhanh)
const FROM = process.env.FROM || '';      // bắt đầu từ cảnh này (xem thử)
const SCENES = require('./scenes.cjs');
(async () => {
  fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: +(process.env.DSF || 1.5) });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await p.route('https://nhwqubttbkpcuckrduij.supabase.co/**', (r) => r.abort());
  await p.addInitScript(() => { try { localStorage.setItem('thgm:audio', JSON.stringify({ intro: false, music: 0, sfx: 0, tapFx: false })); } catch {} });
  await p.addInitScript({ path: path.join(__dirname, 'harness.js') });
  await p.goto('http://localhost:5197/');
  await p.getByText('Chơi thử không cần tài khoản').click();
  await p.waitForTimeout(3500);
  const cdp = await p.context().newCDPSession(p);
  await cdp.send('Animation.enable');
  await p.evaluate(SCENES.prepare);
  await p.waitForTimeout(1500);
  await p.evaluate(() => window.__virt());
  let frame = 0, realPer = 250, rate = 0.13;
  await cdp.send('Animation.setPlaybackRate', { playbackRate: rate });
  const t0 = Date.now();
  let started = !FROM;
  for (const sc of SCENES.list) {
    if (frame / FPS >= LIMIT) break;
    if (!started && sc.name !== FROM) { await p.evaluate(sc.setup, sc.arg ?? null); for (let i = 0; i < 5; i++) await p.evaluate((dt) => window.__step(dt), 200); continue; }
    started = true;
    await p.evaluate(sc.setup, sc.arg ?? null);
    const n = Math.round(sc.dur * FPS);
    for (let i = 0; i < n && frame / FPS < LIMIT; i++) {
      const a = Date.now();
      await p.evaluate(([dt, i, n]) => { window.__sceneT = i / 30; window.__sceneK = i / Math.max(1, n - 1); window.__step(dt); }, [DT, i, n]);
      if (frame % EVERY === 0) {
        const { data } = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 92 });
        fs.writeFileSync(path.join(OUT, `f${String(frame).padStart(5, '0')}.jpg`), Buffer.from(data, 'base64'));
      }
      frame++;
      realPer = realPer * 0.9 + (Date.now() - a) * 0.1;
      if (frame % 15 === 0) { rate = Math.min(1, Math.max(0.02, DT / realPer)); await cdp.send('Animation.setPlaybackRate', { playbackRate: rate }); }
    }
    console.log(`cảnh ${sc.name}: xong, tổng ${frame} khung, ${((Date.now() - t0) / 1000).toFixed(0)}s, ${realPer.toFixed(0)}ms/khung`);
  }
  console.log('errors', errs.slice(0, 10));
  await b.close();
})();
