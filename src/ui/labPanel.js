// Nhà Lai Tạo: chọn 2 cành cùng loài -> chờ -> nhận hạt màu mới.
import { FLOWERS } from '../../data/flowers.js';
import { BREEDING, RARITY } from '../../data/variants.js';
import * as variants from '../systems/variants.js';
import { breedOutcomes } from '../systems/breeding.js';
import { formatDuration } from '../systems/time.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const vdot = (sp, v, big = false) => `<i class="vdot ${big ? 'big' : ''}" style="--c:${variants.variantData(sp, v).petal}"></i>`;

export class LabPanel {
  constructor(hud) {
    this.hud = hud;
    this.game = hud.game;
    this.a = null;
    this.b = null;
  }

  get save() { return this.game.save; }

  open() { this.a = this.b = null; this.render(); }

  refresh() {
    const slot = this.save.lab.slot;
    if (!slot) return;
    const el = this.hud.root.querySelector('[data-labbar]');
    if (!el) return;
    const now = this.game.now;
    const f = Math.min(1, (now - slot.startedAt) / (slot.readyAt - slot.startedAt));
    el.style.width = `${f * 100}%`;
    const t = this.hud.root.querySelector('[data-labtime]');
    if (t) t.textContent = now >= slot.readyAt ? 'Đã xong!' : `Còn ${formatDuration(slot.readyAt - now)}`;
    if (now >= slot.readyAt && !this.hud.root.querySelector('[data-lab="collect"]')) this.render();
  }

  stacks(filterSpecies = null) {
    return Object.entries(this.save.inventory.flowers).filter(([, n]) => n > 0).map(([k, n]) => ({ k, n, ...variants.parseFlowerKey(k) }))
      .filter((s) => !filterSpecies || s.species === filterSpecies)
      .sort((x, y) => x.species.localeCompare(y.species) || x.variant.localeCompare(y.variant) || y.q - x.q);
  }

  render() {
    const s = this.save;
    let body;
    if (s.player.level < BREEDING.unlockLevel) {
      body = `<div class="empty-shop">🔒<p>Nhà Lai Tạo mở khi bạn đạt cấp ${BREEDING.unlockLevel}.</p></div>`;
    } else if (s.lab.slot) body = this.runningHtml();
    else body = this.pickHtml();
    this.hud.openModal('lab', `
      <h2>🧬 Nhà Lai Tạo</h2>
      <p class="muted small">Chọn 2 cành <b>cùng loài</b> khác màu (hoặc cùng màu). Sau ${BREEDING.hours} giờ game bạn nhận ${BREEDING.seeds}–${BREEDING.seeds + 1} hạt. Hoa càng nhiều sao càng dễ ra màu hiếm.</p>
      ${body}`, 'wide');
  }

  runningHtml() {
    const slot = this.save.lab.slot;
    const now = this.game.now;
    const done = now >= slot.readyAt;
    const f = Math.min(1, (now - slot.startedAt) / (slot.readyAt - slot.startedAt));
    return `<div class="lab-run">
      <div class="lab-parents">${vdot(slot.species, slot.a, true)}<span>×</span>${vdot(slot.species, slot.b, true)}</div>
      <p><b>${esc(variants.variantName(slot.species, slot.a))}</b> × <b>${esc(variants.variantName(slot.species, slot.b, { short: true }))}</b></p>
      <div class="lab-flask ${done ? 'done' : ''}">${done ? '🌱' : '⚗️'}</div>
      <div class="track"><i data-labbar style="width:${f * 100}%;background:#c79cf2"></i></div>
      <p class="muted" data-labtime>${done ? 'Đã xong!' : `Còn ${formatDuration(slot.readyAt - now)}`}</p>
      ${done ? '<button class="btn primary wide" data-lab="collect">🌱 Nhận hạt giống</button>' : '<p class="muted small">Bạn có thể đóng bảng này, chơi tiếp rồi quay lại sau. Nút 🧬 bên trái sẽ có dấu ✓ khi xong.</p>'}
    </div>`;
  }

  pickHtml() {
    const s = this.save;
    const A = this.a ? variants.parseFlowerKey(this.a) : null;
    const list = (keySel, species, which) => {
      const st = this.stacks(species);
      if (!st.length) return `<p class="muted small">${species ? `Không còn cành ${FLOWERS[species].name} nào khác trong kho.` : 'Kho chưa có hoa. Hãy thu hoạch hoa trước nhé!'}</p>`;
      return `<div class="lab-list">${st.map((x) => {
        const usable = which === 'b' && x.k === this.a ? x.n >= 2 : true;
        return `<button class="lab-item ${keySel === x.k ? 'on' : ''} ${usable ? '' : 'disabled'}" data-lab="pick-${which}" data-k="${x.k}">
          <span>${FLOWERS[x.species].icon}${vdot(x.species, x.variant)}</span><small>${esc(variants.variantName(x.species, x.variant))}</small><i class="stars">${'★'.repeat(x.q)}</i><b>×${x.n}</b></button>`;
      }).join('')}</div>`;
    };
    let outcomes = '';
    if (this.a && this.b) {
      const B = variants.parseFlowerKey(this.b);
      const outs = breedOutcomes(A.species, A.variant, B.variant, (A.q + B.q) / 2);
      outcomes = `<h3>Kết quả có thể</h3><div class="outs">${outs.map((o) => {
        const k = variants.vkey(A.species, o.variant);
        const seen = s.book.found[k];
        const d = variants.variantData(A.species, o.variant);
        const r = RARITY[d.rarity];
        return `<div class="out ${seen ? '' : 'mystery'}">${seen ? vdot(A.species, o.variant, true) : '<i class="vdot big q">?</i>'}
          <small>${seen ? esc(variants.variantName(A.species, o.variant, { short: true })) : 'Màu bí ẩn'}</small>
          <b>${Math.round(o.p * 100)}%</b><span style="color:${r.color}">${r.name}</span></div>`;
      }).join('')}</div>
      <button class="btn primary wide" data-lab="start">🧬 Bắt đầu lai (dùng 2 cành)</button>`;
    }
    return `
      <h3>Cành thứ nhất</h3>${list(this.a, null, 'a')}
      ${this.a ? `<h3>Cành thứ hai (${FLOWERS[A.species].name})</h3>${list(this.b, A.species, 'b')}` : ''}
      ${outcomes}
      <button class="btn wide" data-act="notebook">📖 Xem gợi ý lai trong Sổ tay</button>`;
  }

  onAction(act, el) {
    const g = this.game;
    if (act === 'pick-a') { this.a = el.dataset.k; this.b = null; this.render(); return; }
    if (act === 'pick-b') {
      if (el.classList.contains('disabled')) { g.toast('Cần 2 cành cùng loại trong kho', 'warn'); return; }
      this.b = el.dataset.k; this.render(); return;
    }
    if (act === 'start') { if (g.startBreeding(this.a, this.b).ok) { this.a = this.b = null; this.render(); } return; }
    if (act === 'collect') { g.collectBreeding(); this.render(); }
  }
}
