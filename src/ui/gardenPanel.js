// 🌿 Vườn ươm (0.31 · gói A): dòng giống · lai dòng · đất (pH) · sinh thái. Nút điều khiển: data-gd
import { FLOWERS } from '../../data/flowers.js';
import { GENES, STRAIN_RULES, SOIL_PH, FLOWER_PH, AMENDMENTS } from '../../data/garden.js';
import { MACHINES } from '../../data/automation.js';
import * as gardenSys from '../systems/garden.js';
import { variantName, vkey } from '../systems/variants.js';
import { seedArt } from './art.js';
import { formatDuration } from '../systems/time.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = (n) => Math.round(n).toLocaleString('vi-VN');
const TABS = [
  { id: 'strains', label: '🧬 Dòng giống' },
  { id: 'breed', label: '💞 Lai dòng' },
  { id: 'soil', label: '🧪 Đất' },
  { id: 'eco', label: '🐝 Sinh thái' },
];
const geneBar = (g) => `<div class="gd-genes">${Object.entries(GENES).map(([k, G]) => `<span title="${esc(G.name)}: ${esc(G.desc)}">${G.icon}<i>${'●'.repeat(g[k])}${'○'.repeat(5 - g[k])}</i></span>`).join('')}</div>`;

export class GardenPanel {
  constructor(hud) {
    this.hud = hud;
    this.game = hud.game;
    this.tab = 'strains';
    this.pick = [];
  }
  get save() { return this.game.save; }

  open(tab = null) { if (tab) this.tab = tab; this.render(); }

  render(keep = false) {
    const top = keep ? this.hud.scrollBox()?.scrollTop || 0 : 0;
    const s = this.save, G = gardenSys.G(s);
    const head = `<div class="mk-wallet"><span>💰 <b>${money(s.player.coins)}</b></span><span>🧬 <b>${Object.keys(G.strains).length}</b> dòng</span></div>`;
    const tabs = `<div class="mk-tabs" role="tablist">${TABS.map((t) => `<button class="${t.id === this.tab ? 'on' : ''}" data-gd="tab" data-id="${t.id}" role="tab">${t.label}</button>`).join('')}</div>`;
    const lock = s.player.level < STRAIN_RULES.unlockLevel && (this.tab === 'strains' || this.tab === 'breed')
      ? `<p class="note warn">🔒 Dòng giống mở ở cấp ${STRAIN_RULES.unlockLevel}. Đất & sinh thái dùng được ngay.</p>` : '';
    const body = { strains: () => this.strains(), breed: () => this.breed(), soil: () => this.soil(), eco: () => this.eco() }[this.tab]();
    this.hud.openModal('garden', `<h2>🌿 Vườn ươm</h2>${head}${tabs}<div class="mk-body gd-body">${lock}${body}</div>`, 'wide');
    if (keep) { const box = this.hud.scrollBox(); if (box) box.scrollTop = top; }
  }

  strains() {
    const s = this.save, G = gardenSys.G(s);
    const list = Object.entries(G.strains).sort((a, b) => gardenSys.geneTotal(b[1].g) - gardenSys.geneTotal(a[1].g));
    const intro = `<p class="muted small">Hái hoa <b>3★</b> có cơ hội <b>giữ giống</b> thành một dòng mới có 4 gen (mức 1–5). Gieo hạt dòng giống ở thanh hạt (viền vàng 🧬). Cây dòng giống hái xong thường cho lại hạt. Lai 2 dòng cùng loài để gen tốt hơn — đôi khi đột biến!</p>
      <div class="gd-legend">${Object.values(GENES).map((g) => `<span>${g.icon} <b>${esc(g.name)}</b>: ${esc(g.desc)}</span>`).join('')}</div>`;
    if (!list.length) return `${intro}<p class="note">Chưa có dòng giống nào. Chăm hoa thật kỹ để hái được 3★ nhé!</p>`;
    return intro + list.map(([id, st]) => `<div class="mk-item gd-strain"><div class="mk-icon">${seedArt(vkey(st.sp, st.v))}</div>
      <div class="mk-info"><b>${esc(variantName(st.sp, st.v))} <small class="muted">${esc(st.name)} · tổng ${gardenSys.geneTotal(st.g)}</small></b>${geneBar(st.g)}<small>Hạt: <b>${G.sseeds[id] || 0}</b>${st.from ? ' · lai từ 2 dòng' : ''}</small></div>
      <div class="mk-buy">${(G.sseeds[id] || 0) > 0 ? `<button class="btn" data-gd="use" data-id="${id}">🌱 Chọn gieo</button>` : ''}<button class="btn" data-gd="drop" data-id="${id}">🗑️</button></div></div>`).join('');
  }

  breed() {
    const s = this.save, G = gardenSys.G(s), now = this.game.now;
    let cur = '';
    if (G.breed) {
      const A = G.strains[G.breed.a], B = G.strains[G.breed.b], left = G.breed.readyAt - now;
      cur = `<div class="mk-item done"><div class="mk-icon">💞</div><div class="mk-info"><b>Đang lai: ${esc(A?.name || '?')} × ${esc(B?.name || '?')}</b><small>${left > 0 ? `Còn ${formatDuration(left)}` : 'Đã xong!'}</small></div>
        <div class="mk-buy">${left <= 0 ? '<button class="btn primary" data-gd="collect">🌱 Nhận hạt</button>' : ''}</div></div>`;
    }
    const list = Object.entries(G.strains).filter(([id]) => (G.sseeds[id] || 0) > 0);
    const first = this.pick[0] ? G.strains[this.pick[0]] : null;
    const rows = list.map(([id, st]) => {
      const on = this.pick.includes(id), dim = first && !on && st.sp !== first.sp;
      return `<button class="gd-pick ${on ? 'on' : ''} ${dim ? 'dim' : ''}" data-gd="pick" data-id="${id}"><span>${seedArt(vkey(st.sp, st.v))}</span><b>${esc(variantName(st.sp, st.v))}</b><small>${esc(st.name)}</small>${geneBar(st.g)}</button>`;
    }).join('');
    const ready = this.pick.length === 2;
    return `${cur}<p class="muted small">Chọn 2 dòng <b>cùng loài</b> (mỗi dòng tốn 1 hạt) + ${STRAIN_RULES.breedCost} 💰. Sau ${STRAIN_RULES.breedHours} giờ nhận ${STRAIN_RULES.breedSeeds} hạt dòng mới: gen ≈ trung bình bố mẹ, ${Math.round(STRAIN_RULES.mutation * 100)}% đột biến +1.</p>
      <div class="gd-picks">${rows || '<p class="note">Cần ít nhất 2 dòng có hạt.</p>'}</div>
      <div class="row-btns"><button class="btn ${ready && !G.breed ? 'primary' : 'disabled'}" data-gd="breed">💞 Lai (${STRAIN_RULES.breedCost} 💰)</button>${this.pick.length ? '<button class="btn" data-gd="clear">Bỏ chọn</button>' : ''}</div>`;
  }

  soil() {
    const s = this.save, inv = s.inventory.items;
    const plots = s.farm.plots.map((p, i) => {
      const ph = gardenSys.phOf(p, i), nat = gardenSys.nativePh(p, i);
      const growing = [...new Set(p.tiles.filter((t) => t.flower && ['growing', 'ready'].includes(t.state)).map((t) => t.flower))];
      const fits = growing.map((f) => { const off = gardenSys.phOff(f, ph); return `${FLOWERS[f].icon}${off ? '⚠️' : '✔'}`; }).join(' ');
      const best = gardenSys.bestFor(ph, this.game.unlockedFlowers()).map((f) => FLOWERS[f].icon).join('');
      const pos = Math.max(0, Math.min(100, ((ph - SOIL_PH.min) / (SOIL_PH.max - SOIL_PH.min)) * 100));
      return `<div class="mk-item gd-plot"><div class="mk-icon">🟫</div><div class="mk-info"><b>Lô ${i + 1} <small class="muted">pH ${ph.toFixed(1)} · ${esc(gardenSys.phName(ph))}${p.ph != null ? ` · tự nhiên ${nat.toFixed(1)}` : ''}</small></b>
        <div class="gd-ph"><i style="left:${pos}%"></i></div>
        <small>${fits ? `Đang trồng: ${fits} · ` : ''}Hợp nhất: ${best || '—'}</small></div>
        <div class="mk-buy">${['lime', 'peat', 'fishmeal'].map((k) => `<button class="btn ${inv[k] > 0 ? '' : 'disabled'}" data-gd="amend" data-k="${k}" data-id="${i}" title="${esc(AMENDMENTS[k].desc)}">${AMENDMENTS[k].icon} ${inv[k] || 0}</button>`).join('')}</div></div>`;
    }).join('');
    const prefs = Object.entries(FLOWER_PH).filter(([f]) => FLOWERS[f] && this.game.unlockedFlowers().includes(f)).map(([f, r]) => `<span>${FLOWERS[f].icon} ${r[0]}–${r[1]}</span>`).join('');
    return `<p class="muted small">Mỗi lô có độ chua riêng. Hoa trồng đúng khẩu vị pH: lớn nhanh, dễ 3★; lệch nhiều: còi cọc. ${Object.values(AMENDMENTS).map((a) => `${a.icon} <b>${esc(a.name)}</b>: ${esc(a.desc)}`).join(' · ')} pH tự trôi dần về tự nhiên (~${SOIL_PH.driftPerDay}/ngày) nên thỉnh thoảng phải rải lại.</p>
      ${plots}<h3>🌸 Khẩu vị pH các loài</h3><div class="gd-prefs">${prefs}</div>`;
  }

  eco() {
    const s = this.save;
    const rows = s.farm.plots.map((p, i) => {
      const div = gardenSys.plotDiversity(p), bm = gardenSys.bugMult(p);
      return `<div class="mk-item"><div class="mk-icon">${p.machines?.hive ? '🐝' : p.machines?.birdhouse ? '🐦' : '🌱'}</div><div class="mk-info"><b>Lô ${i + 1}</b>
        <small>${p.machines?.hive ? '🐝 Nhà ong ✔' : '🐝 chưa có nhà ong'} · ${p.machines?.birdhouse ? '🐦 Nhà chim ✔' : '🐦 chưa có nhà chim'} · 🌈 ${div} loài đang trồng${div >= 3 ? ' ✔' : ''}</small>
        <small>Sâu xuất hiện: ×${bm.toFixed(2)}</small></div></div>`;
    }).join('');
    return `<p class="muted small">Vườn càng cân bằng càng ít sâu và hoa càng đẹp:
      ${MACHINES.hive.icon} <b>${esc(MACHINES.hive.name)}</b> — ${esc(MACHINES.hive.desc)} · ${MACHINES.birdhouse.icon} <b>${esc(MACHINES.birdhouse.name)}</b> — ${esc(MACHINES.birdhouse.desc)} ·
      🌈 Trồng xen ≥ 3 loài trong 1 lô: ít sâu, hoa đẹp hơn. Mua nhà ong / nhà chim ở 🏪 Chợ › Tự động.</p>${rows}
      <div class="row-btns"><button class="btn primary" data-gd="market">🏪 Tới Chợ mua nhà ong / nhà chim</button></div>`;
  }

  onAction(act, el) {
    const g = this.game, id = el.dataset.id;
    if (el.classList.contains('disabled') && act !== 'amend') return;
    switch (act) {
      case 'tab': this.tab = id; this.render(); return;
      case 'use': g.setTool('plant'); g.setSeed(gardenSys.strainKey(id)); this.hud.closeModal(); g.toast('🧬 Đã chọn hạt dòng giống — chạm ô đất đã xới để gieo', 'info'); return;
      case 'drop':
        if (!el.dataset.armed) { el.dataset.armed = '1'; el.textContent = 'Bấm lần nữa'; setTimeout(() => { delete el.dataset.armed; }, 3000); return; }
        gardenSys.dropStrain(this.save, id); g.saveMgr.markDirty(); break;
      case 'pick': {
        const i = this.pick.indexOf(id);
        if (i >= 0) this.pick.splice(i, 1);
        else if (this.pick.length < 2) this.pick.push(id);
        break;
      }
      case 'clear': this.pick = []; break;
      case 'breed': { const r = g.gardenBreed(this.pick[0], this.pick[1]); if (r.ok) this.pick = []; break; }
      case 'collect': g.gardenCollect(); break;
      case 'amend': g.gardenAmend(+id, el.dataset.k); break;
      case 'market': this.hud.closeModal(); g.emitter.emit('open-market', { tab: 'auto' }); return;
    }
    this.render(true);
  }
}
