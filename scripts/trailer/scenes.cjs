// Kịch bản trailer ~60 giây. Mỗi cảnh: setup chạy 1 lần trong trang, rồi window.__dir(vt) chạy mỗi khung hình.
// Trong trang: __sceneT = giây trong cảnh, __sceneK = 0..1 tiến độ cảnh.

exports.prepare = async () => {
  const g = __game, s = g.save;
  const { VARIANTS } = await import('/data/variants.js');
  s.tutorial.done = true; g.emitter.emit('tutorial');
  s.settings.quality = 'high'; g.applyGraphics();
  s.player.name = 'Bé Hoa';
  s.player.level = 9; s.player.xp = 2000; s.player.coins = 99999; s.player.reputation = 400;
  for (let i = 0; i < 3; i++) g.buy('plot');
  g.buy('greenhouse', 3);
  s.player.coins = 12580;
  s.upgrades.gloves = 2; s.upgrades.shoes = 2; g.applyUpgradeEffects();
  Object.assign(s.inventory.seeds, { 'rose:red': 20, 'tulip:pink': 20, 'sunflower:yellow': 10 });
  Object.assign(s.inventory.items, { fertilizer: 30, medicine: 10, cover: 6 });
  // màu hoa cho từng lô
  const pickV = (sp, i) => { const ks = Object.keys(VARIANTS[sp]); return ks[i % ks.length]; };
  const fill = (pi, list, state = 'ready') => s.farm.plots[pi].tiles.forEach((t, i) => {
    const sp = list[i % list.length];
    Object.assign(t, { state, flower: sp, variant: pickV(sp, i), growth: 99999, health: 100, water: 1, fert: 2, sick: null });
  });
  fill(1, ['sunflower', 'tulip', 'cosmos', 'tulip', 'sunflower', 'daisy', 'cosmos', 'daisy', 'sunflower']);
  fill(2, ['hydrangea', 'lavender', 'peony', 'lavender', 'hydrangea', 'peony', 'lily', 'lavender', 'hydrangea']);
  fill(3, ['orchid', 'orchid', 'orchid', 'carnation', 'orchid', 'carnation', 'orchid', 'orchid', 'orchid']);
  // lô 0: đang lớn ở nhiều giai đoạn (cảnh "trồng hoa" sẽ cho nở dần)
  s.farm.plots[0].tiles.forEach((t, i) => {
    const sp = ['rose', 'rose', 'tulip', 'rose', 'carnation', 'rose', 'tulip', 'rose', 'marigold'][i];
    Object.assign(t, { state: i < 3 ? 'untilled' : 'growing', flower: i < 3 ? null : sp, variant: i < 3 ? null : pickV(sp, i), growth: 0, health: 100, water: 1, fert: 1, sick: null });
  });
  s.weather.today = { day: 1, type: 'sunny', disease: null };
  s.weather.tomorrow = { day: 2, type: 'sunny', disease: null };
  s.time.gameMinutes = 8 * 60;
  g.applyWeatherVisuals(true);
  g.refreshFarm(true);
  // đồ trang trí quanh nông trại
  const deco = [['bench', -7.4, 8.2, 45], ['lantern', -3.0, 8.6, 0], ['lantern', 1.8, 8.6, 0], ['swing', 7.0, 7.4, 315], ['windmill', 7.4, 2.8, 0],
    ['fountain', 7.2, -2.6, 0], ['bunny', -3.8, -4.6, 0], ['teaset', 3.2, -5.0, 0], ['pot', -6.8, 2.6, 0], ['pot', -6.8, 0.6, 0], ['birdhouse', -6.9, -1.6, 0],
    ['clover', -8.6, 5.2, 0], ['starlamp', 5.6, 9.0, 0], ['luckycat', 8.8, 5.4, 300]];
  s.decor.placed = deco.map(([id, x, z, r], i) => ({ u: 500 + i, id, x, z, r }));
  s.decor.nextUid = 600;
  g.decorView.sync(s.decor.placed);
  // ẩn biển tên 3D (đất của..., Làng Hoa...) và biểu tượng ⭐💧 trên ô đất cho khung hình gọn
  g.stage.scene.traverse((o) => { if (o.isSprite && o.renderOrder === 10 && o.material.depthTest === false) o.visible = false; });
  const fv = g.farmView, orig = fv.syncTile.bind(fv);
  fv.syncTile = (...a) => { orig(...a); a[0].icon.visible = false; };
  g.refreshFarm(true);
  // ẩn những thứ làm rối khung hình
  const st = document.createElement('style');
  st.textContent = `
    #hud .toasts, #hud .tutorial, #hud .alert-chip, #hud .saved-badge, #hud .update-banner, #hud .floaters small { display: none !important; }
    #tr { position: fixed; inset: 0; z-index: 99999; pointer-events: none; font-family: 'Baloo 2', 'Nunito', sans-serif; }
    #tr .blk { position: absolute; inset: 0; background: radial-gradient(circle at 50% 40%, #3b2c5e, #160f29 70%); opacity: 0; }
    #tr .mid { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; color: #fff; opacity: 0; }
    #tr .mid.scrim { background: radial-gradient(ellipse 46% 34% at 50% 50%, rgba(46, 24, 64, .62), rgba(46, 24, 64, 0) 100%); }
    #tr .mid h1 { margin: 0; font-size: 92px; line-height: 1; font-weight: 800; color: #fff; text-shadow: 0 5px 0 #ea7f99, 0 12px 30px rgba(120, 40, 80, .45); letter-spacing: 1px; }
    #tr .mid h2 { margin: 14px 0 0; font-size: 30px; font-weight: 700; color: #fff6ec; text-shadow: 0 2px 8px rgba(60, 20, 50, .6); }
    #tr .mid .dg { font-size: 54px; font-weight: 800; letter-spacing: 12px; color: #ffe8f0; text-shadow: 0 0 24px #f6a6b9; }
    #tr .mid .dgs { font-size: 22px; letter-spacing: 8px; color: #d9c8ff; margin-top: 8px; }
    #tr .mid .url { margin-top: 22px; font-size: 28px; font-weight: 800; color: #6b4a3c; background: #fffaf3; border: 3px solid #f6a6b9; border-radius: 999px; padding: 8px 26px; }
    #tr .mid .pills { display: flex; gap: 12px; margin-top: 18px; }
    #tr .mid .pills span { font-size: 22px; font-weight: 800; background: rgba(255, 255, 255, .16); border: 2px solid rgba(255, 255, 255, .5); border-radius: 999px; padding: 6px 18px; }
    #tr .cap { position: absolute; left: 50%; top: 92px; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; gap: 2px;
      background: rgba(255, 250, 243, .95); color: #6b4a3c; border: 3px solid #f6a6b9; border-radius: 30px; padding: 10px 34px 12px; box-shadow: 0 6px 0 rgba(160, 110, 90, .25), 0 14px 30px rgba(120, 80, 70, .25); opacity: 0; white-space: nowrap; }
    #tr .cap b { font-size: 36px; font-weight: 800; line-height: 1.1; }
    #tr .cap small { font-size: 20px; font-weight: 700; color: #9b7b6c; }
    #tr .petal { position: absolute; width: 16px; height: 11px; border-radius: 60% 40% 60% 40%; opacity: .9; }
  `;
  document.head.appendChild(st);
  const tr = document.createElement('div');
  tr.id = 'tr';
  tr.innerHTML = '<div class="blk"></div><div class="mid"></div><div class="cap"></div><div class="pt"></div>';
  document.body.appendChild(tr);
  window.__tr = { blk: tr.querySelector('.blk'), mid: tr.querySelector('.mid'), cap: tr.querySelector('.cap'), pt: tr.querySelector('.pt') };
  // cánh hoa bay trên màn hình tiêu đề
  const cols = ['#ff8fb1', '#ffc2d4', '#ffd36e', '#b9a2ff', '#8fd8ff'];
  window.__petals = Array.from({ length: 34 }, (_, i) => { const e = document.createElement('i'); e.className = 'petal'; e.style.background = cols[i % 5]; window.__tr.pt.appendChild(e); return { e, x: Math.random(), y: Math.random(), s: 0.5 + Math.random(), ph: Math.random() * 6 }; });
  window.__petalsOn = 0;
  window.__ease = (x) => (x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x));
  window.__fade = (t, dur, fi = 0.5, fo = 0.5) => Math.min(window.__ease(t / fi), window.__ease((dur - t) / fo));
  window.__cam = (x, z, zoom) => { const c = g.controls; c.focusAnim = null; c.target.set(x, 0, z); c.zoom = zoom; c.apply(); };
  window.__lerp = (a, b, k) => a + (b - a) * window.__ease(k);
  window.__caption = (title, sub, a) => {
    const c = window.__tr.cap;
    const key = title + '|' + sub;
    if (c.dataset.t !== key) { c.innerHTML = `<b>${title}</b>${sub ? `<small>${sub}</small>` : ''}`; c.dataset.t = key; }
    // đang mở bảng ⇒ đưa chữ xuống dưới để không che bảng
    const modal = !!document.querySelector('#hud .modal-wrap:not(.hidden)');
    c.style.top = modal ? 'auto' : '92px'; c.style.bottom = modal ? '18px' : 'auto';
    c.style.opacity = a; c.style.transform = `translateX(-50%) translateY(${(1 - a) * (modal ? 14 : -14)}px) scale(${0.94 + a * 0.06})`;
  };
  window.__midShow = (html, a, key) => { const m = window.__tr.mid; if (m.dataset.k !== key) { m.innerHTML = html; m.dataset.k = key; m.classList.toggle('scrim', key === 'title'); } m.style.opacity = a; m.style.transform = `scale(${0.96 + a * 0.04})`; };
  window.__tick = (vt) => {
    const on = window.__petalsOn;
    window.__petals.forEach((p) => {
      p.y += 0.0035 * p.s; p.x += Math.sin(vt / 900 + p.ph) * 0.0012;
      if (p.y > 1.05) { p.y = -0.05; p.x = Math.random(); }
      p.e.style.transform = `translate(${p.x * innerWidth}px, ${p.y * innerHeight}px) rotate(${vt / 6 + p.ph * 60}deg)`;
      p.e.style.opacity = on * 0.9;
    });
  };
  window.__setDay = (day, hour, type) => {
    s.time.gameMinutes = (day - 1) * 1440 + hour * 60;
    s.weather.today = { day, type, disease: null };
    s.weather.tomorrow = { day: day + 1, type: 'sunny', disease: null };
    g.applyWeatherVisuals(true);
  };
  window.__hud = (on) => { document.getElementById('hud').style.visibility = on ? 'visible' : 'hidden'; };
  window.__hud(false);
  g.speed = 1;
};

exports.list = [
  {
    name: 'mo-dau', dur: 3.2,
    setup: () => {
      __cam(-1, 3, 1.0); __setDay(3, 6.2, 'sunny');
      window.__dir = () => {
        const t = __sceneT;
        __tr.blk.style.opacity = 1;
        __midShow('<div class="dg">DREAMER GAMES</div><div class="dgs">GIỚI THIỆU</div>', __fade(t, 3.2, 0.8, 0.7), 'dg');
      };
    },
  },
  {
    name: 'tieu-de', dur: 4.8,
    setup: () => {
      window.__dir = (vt) => {
        const t = __sceneT, k = __sceneK;
        __tr.blk.style.opacity = 1 - __ease(t / 1.1);
        window.__petalsOn = Math.min(1, t / 0.8) * (1 - __ease((t - 4.1) / 0.7));
        __tick(vt);
        __cam(__lerp(-6, 2, k), __lerp(10, 2, k), __lerp(1.45, 0.95, k));
        __midShow('<h1>🌷 Tiệm Hoa Giấc Mơ</h1><h2>Trồng hoa · Mở tiệm · Kết bạn trong ngôi làng chibi 3D</h2>', __fade(t - 0.5, 4.3, 0.8, 0.6), 'title');
      };
    },
  },
  {
    name: 'trong-hoa', dur: 8,
    setup: () => {
      const g = __game;
      __midShow('', 0, 'x'); __tr.blk.style.opacity = 0; window.__petalsOn = 0; __tick(0);
      __hud(true);
      __setDay(3, 8.5, 'sunny');
      g.player.root.position.set(-4.4, 0, 3.4);
      const q = (tile, a, seed) => g.requestAction({ kind: 'tile', plot: 0, tile }, a, seed ? { seed } : {});
      q(0, 'till'); q(0, 'plant', 'rose:red'); q(0, 'water'); q(1, 'till'); q(1, 'plant', 'tulip:pink'); q(1, 'water'); q(2, 'till'); q(2, 'plant', 'rose:red');
      window.__grown = {};
      window.__dir = () => {
        const t = __sceneT, k = __sceneK;
        __cam(__lerp(-3.4, -1.2, k), __lerp(4.4, 3.0, k), __lerp(2.0, 1.65, k));
        __caption('🌱 Gieo hạt, tưới nước, chăm từng luống hoa', 'Hơn 15 loài hoa · 4 mùa · màu hoa lai tạo', __fade(t, 8, 0.5, 0.5));
        // các ô đang lớn nở dần từng bước
        const tiles = g.save.farm.plots[0].tiles;
        for (let i = 3; i < 9; i++) {
          const tt = tiles[i];
          const at = 0.4 + (i - 3) * 0.55;
          const p = Math.min(1, Math.max(0, (t - at) / 2.2));
          if (tt.state === 'growing') { tt.growth = p * tt.__max; if (p >= 1) { tt.state = 'ready'; g.particles.spawn('sparkle', g.farmView.tileWorldPos(0, i)); } }
        }
        g.refreshFarm();
      };
      g.save.farm.plots[0].tiles.forEach((tt) => { if (tt.flower) { const F = { rose: 8, tulip: 6, carnation: 6, marigold: 6 }; tt.__max = (F[tt.flower] || 8) * 60; tt.growth = 0; } });
    },
  },
  {
    name: 'tiem-hoa', dur: 7,
    setup: async () => {
      const g = __game, s = g.save;
      const shop = await import('/src/systems/shop.js');
      s.shop.customers = [];
      for (let i = 0; i < 3; i++) shop.spawnCustomer(s, Math.random, ['rose', 'tulip', 'sunflower', 'hydrangea', 'lavender'], {});
      for (let k = 0; k < 30 && !s.shop.customers.some((c) => c.request.type === 'bouquet'); k++) { s.shop.customers.pop(); shop.spawnCustomer(s, Math.random, ['rose', 'tulip', 'sunflower', 'hydrangea', 'lavender'], {}); }
      s.shop.customers.forEach((c) => { c.patience = 9999; });
      g.customers.sync(s); g.emitter.emit('shop');
      // hoa trong kho để gói bó
      Object.assign(s.inventory.flowers, { 'rose:red|3': 8, 'tulip:pink|3': 6, 'hydrangea:blue|3': 4, 'lavender:purple|3': 5, 'sunflower:yellow|3': 4 });
      window.__opened = false;
      window.__dir = () => {
        const t = __sceneT, k = __sceneK;
        if (t < 3.2) __cam(__lerp(8, 11.5, t / 3.2), __lerp(-3, -6.5, t / 3.2), __lerp(1.25, 1.6, t / 3.2));
        if (t >= 3.0 && !window.__opened) { window.__opened = true; document.querySelector('[data-act="go-shop"]').click(); }
        if (t >= 4.4 && window.__opened === true) { window.__opened = 2; const bq = s.shop.customers.find((c) => c.request.type === 'bouquet'); document.querySelector(`#hud [data-sp="compose"][data-id="${bq?.id}"]`)?.click(); }
        __caption('💐 Gói bó hoa thật xinh cho khách', 'Chọn giấy gói, ruy băng · khách quen kể chuyện riêng', __fade(t, 7, 0.5, 0.5));
      };
    },
  },
  {
    name: 'lang-hoa', dur: 7.2,
    setup: () => {
      const g = __game;
      document.querySelector('#hud [data-act="close-modal"]')?.click();
      __setDay(4, 17.1, 'sunny');
      window.__vg = false;
      window.__dir = () => {
        const t = __sceneT, k = __sceneK;
        if (t < 4.2) __cam(__lerp(-4.5, 2.5, t / 4.2), __lerp(31, 35.5, t / 4.2), __lerp(1.45, 1.75, t / 4.2));
        if (t >= 4.0 && !window.__vg) { window.__vg = true; document.querySelector('#hud') && g.emitter.emit('villager', { id: 'ba_tu' }); }
        __caption('🏘️ Làng Hoa — kết thân với 6 dân làng', 'Trò chuyện, tặng hoa, giúp việc bằng mini game, mua đất mở rộng', __fade(t, 7.2, 0.5, 0.5));
      };
    },
  },
  {
    name: 'thoi-tiet', dur: 8.5,
    setup: () => {
      const g = __game;
      document.querySelector('#hud [data-act="close-modal"]')?.click();
      __hud(true);
      const cuts = [[3, 10, 'sunny'], [10, 13, 'rain'], [17, 11, 'sunny'], [24, 10, 'snow'], [6, 12, 'rainbow']];
      window.__cut = -1;
      window.__dir = () => {
        const t = __sceneT, k = __sceneK;
        const c = Math.min(cuts.length - 1, Math.floor(t / 1.7));
        if (c !== window.__cut) { window.__cut = c; __setDay(...cuts[c]); }
        __cam(__lerp(-4, 4, k), __lerp(6, 0, k), __lerp(1.15, 1.3, k));
        const names = ['🌸 Xuân', '🌧️ Mưa rào', '🍁 Thu', '❄️ Đông', '🌈 Cầu vồng'];
        __caption('🌦️ Bốn mùa & thời tiết thay đổi mỗi ngày', `${names[c]} · mưa đá, gió lớn, sương mù, mưa sao băng...`, __fade(t, 8.5, 0.4, 0.5));
      };
    },
  },
  {
    name: 'trang-tri', dur: 6.3,
    setup: () => {
      const g = __game, s = g.save;
      __setDay(21, 18.6, 'sunny');
      const hw = [['pumpkinhouse', -7.6, 9.6, 45], ['pumpkin', -5.2, 7.6, 30], ['pumpkin', -1.0, 8.4, 0], ['candles', -3.2, 8.4, 0], ['ghost', -6.4, 5.6, 45], ['cauldron', 1.4, 8.4, 0],
        ['bats', 3.6, 8.2, 0], ['grave', -4.4, 10.0, 20], ['web', 6.0, 6.6, 300], ['pumpkin', 4.8, 9.4, 330], ['candles', -8.6, 6.6, 0]];
      s.decor.placed = s.decor.placed.filter((d) => !['bench', 'lantern', 'swing', 'clover', 'starlamp'].includes(d.id));
      s.decor.placed = s.decor.placed.concat(hw.map(([id, x, z, r], i) => ({ u: 700 + i, id, x, z, r })));
      g.decorView.sync(s.decor.placed);
      window.__dir = () => {
        const t = __sceneT, k = __sceneK;
        __cam(__lerp(-5.5, 2.5, k), __lerp(8.6, 7.6, k), __lerp(1.7, 1.45, k));
        __caption('🎨 Trang trí tự do — cả Lễ hội Bí Ngô 🎃', 'Kéo thả, xoay, đặt đồ ở bất cứ đâu', __fade(t, 6.3, 0.5, 0.5));
      };
    },
  },
  {
    name: 'van-may', dur: 9,
    setup: () => {
      const g = __game, s = g.save;
      __setDay(5, 21.4, 'meteor');
      s.luck.tickets.gold = 5; s.luck.pity.gold = 9; g.emitter.emit('luck');
      const luckIds = ['crystal', 'firefly', 'prism', 'wisp', 'snowbell', 'firefly', 'prism', 'crystal', 'wisp'];
      s.farm.plots[1].tiles.forEach((tt, i) => Object.assign(tt, { state: 'ready', flower: luckIds[i], variant: null, growth: 99999, health: 100, water: 1, sick: null }));
      g.refreshFarm(true);
      const hideIcons = () => g.farmView.plots.forEach((pv) => pv.tiles.forEach((v) => { v.icon.visible = false; }));
      window.__step2 = false; window.__lk = 0;
      __cam(3.0, 4.2, 1.9);
      window.__dir = () => {
        const t = __sceneT, k = __sceneK;
        if (t > 0.1 && window.__lk === 0) { window.__lk = 1; document.querySelector('#hud [data-act="luck"]').click(); }
        if (t > 1.2 && window.__lk === 1) { window.__lk = 2; document.querySelector('#hud [data-lk="open"][data-id="gold"][data-pay="ticket"]')?.click(); }
        if (t > 4.6 && window.__lk === 2) { window.__lk = 3; document.querySelector('#hud [data-act="close-modal"]')?.click(); __hud(false); }
        if (t > 4.6) { hideIcons(); __cam(__lerp(3.6, 2.2, (t - 4.6) / 4.4), __lerp(5.2, 4.0, (t - 4.6) / 4.4), __lerp(2.0, 2.5, (t - 4.6) / 4.4)); }
        __caption(t < 4.6 ? '🍀 Vận May — mở Gói Vàng' : '✨ Săn Cây Vận May huyền thoại', t < 4.6 ? 'Vé & tiền trong game · tỉ lệ công khai · có bảo hiểm' : 'Pha Lê · Đom Đóm · Cầu Vồng · Lửa Ma · Tuyết', t < 4.6 ? __fade(t, 4.6, 0.5, 0.3) : __fade(t - 4.6, 4.4, 0.4, 0.5));
      };
    },
  },
  {
    name: 'ket-thuc', dur: 6.5,
    setup: () => {
      __caption('', '', 0);
      window.__dir = (vt) => {
        const t = __sceneT, k = __sceneK;
        __cam(__lerp(2.2, 0, k), __lerp(4, 2, k), __lerp(2.5, 1.2, k));
        __tr.blk.style.opacity = __ease(t / 0.9) * 0.88;
        window.__petalsOn = __ease(t / 1) * (1 - __ease((t - 5.6) / 0.9));
        __tick(vt);
        __midShow(`<h1>🌷 Tiệm Hoa Giấc Mơ</h1><h2>Chơi miễn phí trên điện thoại & máy tính</h2>
          <div class="pills"><span>🌐 Trình duyệt</span><span>📱 Android (APK)</span><span>👥 Chơi cùng bạn bè</span></div>
          <div class="url">tiem-hoa-giac-mo.netlify.app</div>`, __fade(t - 0.4, 6.1, 0.8, 0.9), 'end');
        if (t > 5.6) __tr.blk.style.opacity = 0.88 + __ease((t - 5.6) / 0.9) * 0.12;
      };
    },
  },
];
