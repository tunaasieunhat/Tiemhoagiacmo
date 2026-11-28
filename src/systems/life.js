// 👪 Con người & hệ quả (0.32 · gói D) — LOGIC THUẦN. Số liệu: data/life.js
// save.life = { pairs: { [cặp]: { aff, since, married, baby } }, news: [{ day, icon, text }], last, acted: { [cặp]: ngày },
//   dil: { [mã]: 'a'|'b' }, mods: { wholesale: { mult, until } }, app: { id, skill, bond, lessons, lastDay, done, outcome, wins, lastChallenge, lastGift } }
import { LIFE_RULES, BOND_STEPS, ROMANCE_STEPS, PAIRS, MATCH_MEANINGS, LIFE_EVENTS, DILEMMAS, APPRENTICE } from '../../data/life.js';
import { MEANINGS } from '../../data/variants.js';
import { villagerInfo } from './village.js';
import * as relations from './relations.js';
import { meaningsOf, parseFlowerKey } from './variants.js';

const hash = (str) => { let h = 2166136261; for (const c of String(str)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); h ^= h >>> 16; h = Math.imul(h, 2246822507); h ^= h >>> 13; h = Math.imul(h, 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
const fail = (msg) => ({ ok: false, msg });
const clamp = (v) => Math.max(-100, Math.min(100, v));
export const nameOf = (id) => villagerInfo(id)?.name || id;

export function L(save) {
  save.life = save.life || {};
  const l = save.life;
  l.pairs = l.pairs || {};
  l.news = l.news || [];
  l.acted = l.acted || {};
  l.dil = l.dil || {};
  l.mods = l.mods || {};
  for (const [id, P] of Object.entries(PAIRS)) if (!l.pairs[id]) l.pairs[id] = { aff: P.aff, since: 0, married: 0, baby: 0 };
  return l;
}
const news = (save, day, icon, text) => { const l = L(save); l.news.unshift({ day, icon, text }); l.news.length = Math.min(l.news.length, LIFE_RULES.newsKeep); return { icon, text }; };

export const pairOpen = (id, has) => !PAIRS[id].need || has(PAIRS[id].need);

/** Mức quan hệ hiện tại của cặp: { id, name, icon } */
export function stepOf(save, id) {
  const P = PAIRS[id], st = L(save).pairs[id];
  if (P.romance) {
    if (st.baby) return ROMANCE_STEPS[3];
    if (st.married) return ROMANCE_STEPS[2];
    if (st.aff >= ROMANCE_STEPS[1].min) return ROMANCE_STEPS[1];
    if (st.aff >= ROMANCE_STEPS[0].min) return ROMANCE_STEPS[0];
  }
  let s = BOND_STEPS[0];
  for (const b of BOND_STEPS) if (st.aff >= b.min) s = b;
  return s;
}
const condOk = (save, id, cond) => cond === 'any' || stepOf(save, id).id === cond;

function setAff(save, id, v, day) {
  const st = L(save).pairs[id], before = stepOf(save, id).id;
  st.aff = clamp(Math.round(v * 10) / 10);
  if (stepOf(save, id).id !== before) st.since = day;
}

/** Sang ngày mới: độ thân trôi, chuyện làng tự xảy ra, cặp yêu nhau cưới / có em bé. Trả về [{ icon, text, kind }] */
export function dailyTick(save, day, has) {
  const l = L(save), out = [];
  if (l.last == null) { l.last = day; return out; }
  const from = Math.max(l.last + 1, day - 4);
  for (let d = from; d <= day; d++) {
    for (const [id, P] of Object.entries(PAIRS)) {
      if (!pairOpen(id, has)) continue;
      const st = l.pairs[id], step = stepOf(save, id).id;
      // trôi: đang tốt thì thân thêm, đang giận thì xa thêm (cần bạn hòa giải)
      if (step === 'gian') setAff(save, id, st.aff - LIFE_RULES.driftPerDay * 0.5, d);
      else if (st.aff >= 15) setAff(save, id, st.aff + LIFE_RULES.driftPerDay, d);
      if (P.romance) {
        const s2 = stepOf(save, id).id;
        if (s2 === 'yeu' && st.aff >= ROMANCE_STEPS[2].min && d - st.since >= ROMANCE_STEPS[2].days && !st.married) {
          st.married = d;
          out.push({ ...news(save, d, '💍', `Đám cưới! ${nameOf(P.a)} và ${nameOf(P.b)} đã cưới nhau. Cả làng mở tiệc, hoa của tiệm bạn rải khắp sân trường.`), kind: 'wedding', pair: id });
        } else if (st.married && !st.baby && d - st.married >= ROMANCE_STEPS[3].days) {
          st.baby = d;
          out.push({ ...news(save, d, '👶', `${nameOf(P.a)} và ${nameOf(P.b)} vừa đón ${P.baby} chào đời! Nhà nào cũng mang quà tới mừng.`), kind: 'baby', pair: id });
        }
      }
    }
    // chuyện làng ngẫu nhiên
    if (hash(`life:${d}`) < LIFE_RULES.eventChance) {
      const cands = LIFE_EVENTS.filter((e) => pairOpen(e.pair, has) && condOk(save, e.pair, e.cond));
      if (cands.length) {
        const e = cands[Math.floor(hash(`le:${d}`) * cands.length)];
        setAff(save, e.pair, L(save).pairs[e.pair].aff + e.delta, d);
        out.push({ ...news(save, d, e.delta < 0 ? '💢' : '💬', e.text), kind: 'event', pair: e.pair });
      }
    }
  }
  l.last = day;
  return out;
}

/** Hoa này hợp để làm gì với cặp này: 'ok' | 'neg' (mang ý nghĩa xấu) | 'off' (không hợp) */
export function flowerFit(pairId, kind, flowerKey) {
  const f = parseFlowerKey(flowerKey);
  const ms = meaningsOf(f.species, f.variant);
  const want = kind === 'mend' ? MATCH_MEANINGS.mend : PAIRS[pairId].romance ? MATCH_MEANINGS.romance : MATCH_MEANINGS.friend;
  if (ms.some((m) => MEANINGS[m]?.negative && !want.includes(m))) return 'neg';
  return ms.some((m) => want.includes(m)) ? 'ok' : 'off';
}

/**
 * Làm mai (kind 'match') hoặc hòa giải ('mend') cho 1 cặp bằng 1 bông hoa trong kho.
 * Trả về { ok, success, msg }
 */
export function act(save, pairId, kind, flowerKey, day, rng = Math.random) {
  const l = L(save), P = PAIRS[pairId];
  if (!P) return fail('Không rõ');
  if (l.acted[pairId] === day) return fail('Hôm nay bạn đã giúp cặp này rồi, để mai nhé');
  const step = stepOf(save, pairId).id;
  if (kind === 'mend' && step !== 'gian') return fail('Hai người có giận nhau đâu');
  if (kind === 'match' && step === 'gian') return fail('Đang giận nhau thì phải hòa giải trước đã');
  if (kind === 'match' && (step === 'cuoi' || step === 'con')) return fail('Hai người đã thành một nhà rồi!');
  if (!(save.inventory.flowers[flowerKey] > 0)) return fail('Không còn bông hoa này');
  save.inventory.flowers[flowerKey] -= 1;
  if (!save.inventory.flowers[flowerKey]) delete save.inventory.flowers[flowerKey];
  l.acted[pairId] = day;
  const fit = flowerFit(pairId, kind, flowerKey), q = parseFlowerKey(flowerKey).q;
  const hearts = (relations.heartsOf(save, P.a) + relations.heartsOf(save, P.b)) / 2;
  let chance = LIFE_RULES.baseChance + hearts * LIFE_RULES.heartBonus + (q - 1) * LIFE_RULES.qualityBonus + (fit === 'ok' ? 0.15 : fit === 'neg' ? -0.6 : -0.25);
  chance = Math.max(0.05, Math.min(0.95, chance));
  const success = rng() < chance;
  const A = nameOf(P.a), B = nameOf(P.b);
  if (success) {
    if (kind === 'mend') setAff(save, pairId, Math.max(20, l.pairs[pairId].aff + LIFE_RULES.actGain), day);
    else setAff(save, pairId, l.pairs[pairId].aff + LIFE_RULES.actGain, day);
    relations.addFp(save, P.a, LIFE_RULES.fpReward); relations.addFp(save, P.b, LIFE_RULES.fpReward);
    const text = kind === 'mend' ? `Bạn mang hoa tới, nói vài lời… ${A} và ${B} nhìn nhau rồi bật cười. Làm lành rồi!` : P.romance ? `Bạn tặng hoa “thay lời” giúp ${A} gửi tới ${B}. ${B} đỏ mặt, cười tủm tỉm…` : `Nhờ bó hoa của bạn, ${A} và ${B} ngồi nói chuyện cả buổi, thân nhau hơn hẳn.`;
    news(save, day, kind === 'mend' ? '🕊️' : '💐', text);
    return { ok: true, success, fit, msg: text };
  }
  setAff(save, pairId, l.pairs[pairId].aff + LIFE_RULES.actFail, day);
  const why = fit === 'neg' ? 'Hoa mang ý nghĩa không hay — hỏng chuyện rồi!' : fit === 'off' ? 'Hoa không hợp hoàn cảnh lắm…' : 'Hôm nay không đúng lúc…';
  const text = kind === 'mend' ? `${why} ${A} và ${B} còn giận nhau hơn.` : `${why} ${A} và ${B} ngượng ngùng tránh mặt nhau.`;
  news(save, day, '😣', text);
  return { ok: true, success, fit, msg: text };
}

// ============================================================= QUYẾT ĐỊNH LÀNG
/** Quyết định đang chờ bạn (chưa chọn, đủ cấp & đủ ngày) */
export function pendingDilemmas(save, day) {
  const l = L(save);
  return Object.entries(DILEMMAS).filter(([id, D]) => !l.dil[id] && save.player.level >= D.level && day >= D.day).map(([id]) => id);
}

/**
 * Chọn phương án (opt 'a' | 'b'). helpers.seeds(n) để cộng hạt ngẫu nhiên. Trả về { ok, msg, effects }
 */
export function decide(save, id, opt, day, helpers = {}) {
  const l = L(save), D = DILEMMAS[id];
  if (!D || l.dil[id]) return fail('Quyết định này đã chọn rồi');
  const O = D[opt];
  if (!O) return fail('Không rõ');
  l.dil[id] = opt;
  const e = O.effects;
  if (e.coins) save.player.coins += e.coins;
  for (const [v, n] of Object.entries(e.fp || {})) relations.addFp(save, v, n);
  for (const [p, n] of Object.entries(e.pair || {})) setAff(save, p, L(save).pairs[p].aff + n, day);
  if (e.seeds) helpers.seeds?.(e.seeds);
  for (const [k, n] of Object.entries(e.decor || {})) save.decor.owned[k] = (save.decor.owned[k] || 0) + n;
  if (e.wholesale) l.mods.wholesale = { mult: e.wholesale.mult, until: day + e.wholesale.days };
  news(save, day, D.icon, `${D.title}: ${O.result}`);
  return { ok: true, msg: O.result, effects: e };
}

/** Câu dân làng nhắc lại (theo quyết định bạn đã chọn) — null nếu không có */
export function memoryOf(save, villager) {
  const l = L(save);
  for (const [id, opt] of Object.entries(l.dil)) { const m = DILEMMAS[id]?.[opt]?.memory?.[villager]; if (m) return m; }
  // chuyện làng gần đây có nhắc tới người này
  const name = nameOf(villager);
  return l.news.find((n) => n.text.includes(name))?.text || null;
}

/** Hệ số ưu đãi / phạt từ quyết định làng & học trò (key: wholesale | spawn | tips) */
export function perkMult(save, key, day = 0) {
  const l = L(save);
  let k = 1;
  for (const [id, opt] of Object.entries(l.dil)) { const p = DILEMMAS[id]?.[opt]?.effects?.perk; if (p?.key === key) k *= p.mult; }
  if (key === 'wholesale' && l.mods.wholesale && day < l.mods.wholesale.until) k *= l.mods.wholesale.mult;
  const app = l.app;
  if (app?.done) {
    if (app.outcome === 'partner' && key === 'tips') k *= APPRENTICE.partner.tipsMult;
    if (app.outcome === 'rival' && key === 'spawn') k *= APPRENTICE.rival.spawnMult;
  }
  return k;
}

// ============================================================= HỌC TRÒ
export function candidates(save, has) {
  return Object.entries(APPRENTICE.candidates).map(([id, C]) => {
    const open = !C.need || has(C.need);
    const hearts = relations.heartsOf(save, id);
    return { id, C, open, hearts, ok: open && hearts >= C.hearts && save.player.level >= APPRENTICE.minLevel };
  });
}
export function takeApprentice(save, id, has) {
  const l = L(save);
  if (l.app && !l.app.done) return fail('Bạn đang có học trò rồi');
  if (l.app?.done) return fail('Học trò của bạn đã ra nghề — mỗi người chỉ truyền nghề một lần');
  const c = candidates(save, has).find((x) => x.id === id);
  if (!c?.ok) return fail(`Cần cấp ${APPRENTICE.minLevel} và ${APPRENTICE.candidates[id]?.hearts || 2} ❤️ với ${nameOf(id)}`);
  l.app = { id, skill: 0, bond: 30, lessons: 0, lastDay: 0, done: false, outcome: null, wins: 0, lastChallenge: 0, lastGift: 0, subj: { trong: 0, cam: 0, ban: 0 } };
  return { ok: true, msg: `🎓 ${nameOf(id)} trở thành học trò của bạn! Mỗi ngày dạy một buổi nhé.` };
}
export const canTeach = (save, day) => { const a = L(save).app; return !!a && !a.done && a.lastDay !== day; };

/** Một buổi dạy: stars 0–3 từ mini game. Trả về { ok, gain, bond, graduated, outcome, msg } */
export function lesson(save, subject, style, stars, day) {
  const a = L(save).app;
  if (!a || a.done) return fail('Chưa có học trò');
  if (a.lastDay === day) return fail('Hôm nay đã dạy rồi');
  const S = APPRENTICE.styles[style], talent = APPRENTICE.candidates[a.id]?.talent === subject;
  const gain = stars * S.skill + (talent ? APPRENTICE.talentBonus : 0) + 1;
  a.skill += gain; a.subj[subject] = (a.subj[subject] || 0) + gain; a.lessons++; a.lastDay = day;
  a.bond = Math.max(0, Math.min(100, a.bond + S.bond + (stars >= 3 ? 3 : stars === 0 ? -3 : 0)));
  const out = { ok: true, gain, bond: a.bond, msg: `${APPRENTICE.subjects[subject].icon} Buổi học ${APPRENTICE.subjects[subject].name} (${S.icon} ${S.name}): ${nameOf(a.id)} tiến bộ +${gain}${talent ? ' (sở trường!)' : ''}` };
  if (a.skill >= APPRENTICE.graduate.skill && a.lessons >= APPRENTICE.graduate.lessons) {
    a.done = true; a.outcome = a.bond >= APPRENTICE.partnerBond ? 'partner' : 'rival'; a.gradDay = day;
    out.graduated = true; out.outcome = a.outcome;
    news(save, day, '🎓', a.outcome === 'partner'
      ? `${nameOf(a.id)} ra nghề, mở tiệm hoa nhỏ và gọi bạn là “thầy”. Hai tiệm sẽ cùng làm ăn!`
      : `${nameOf(a.id)} ra nghề, mở tiệm hoa ngay đầu làng… và tuyên bố sẽ vượt mặt tiệm bạn!`);
  }
  return out;
}

/** Đối tác gửi quà mỗi ngày: { coins, seed } | null */
export function partnerGift(save, day, rng = Math.random) {
  const a = L(save).app;
  if (!a?.done || a.outcome !== 'partner' || a.lastGift === day) return null;
  a.lastGift = day;
  const [lo, hi] = APPRENTICE.partner.coinsPerDay;
  const coins = Math.round(lo + rng() * (hi - lo));
  save.player.coins += coins;
  return { coins, seed: rng() < APPRENTICE.partner.seedChance };
}
export const canChallenge = (save, day) => { const a = L(save).app; return !!a?.done && a.outcome === 'rival' && day - (a.lastChallenge || 0) >= APPRENTICE.rival.challengeEvery; };
/** Thi cắm hoa với đối thủ: thắng khi ≥ 2⭐. Đủ số lần thắng ⇒ làm lành, thành đối tác */
export function challenge(save, stars, day) {
  const a = L(save).app;
  if (!canChallenge(save, day)) return fail('Chưa tới ngày thi');
  a.lastChallenge = day;
  const win = stars >= 2;
  if (win) { a.wins++; save.player.coins += APPRENTICE.rival.prize; }
  let made = false;
  if (a.wins >= APPRENTICE.rival.winsToMakeUp) { a.outcome = 'partner'; made = true; news(save, day, '🤝', `${nameOf(a.id)} cúi đầu: “Thầy vẫn giỏi hơn em.” Hai tiệm làm lành, thành đối tác.`); }
  return { ok: true, win, made, msg: win ? `🏆 Thắng cuộc thi cắm hoa! +${APPRENTICE.rival.prize} 💰 (${a.wins}/${APPRENTICE.rival.winsToMakeUp})` : `😤 ${nameOf(a.id)} thắng lần này. Lần sau phục thù nhé!` };
}
