// Khách quen: ai sẽ ghé, chương truyện, phần thưởng (thuần dữ liệu)
import { REGULARS, REGULAR_RULES } from '../../data/regulars.js';
import { learnMeaning } from './notebook.js';

export function createRegularsState() {
  return Object.fromEntries(Object.keys(REGULARS).map((id) => [id, { hearts: 0, nextDay: 1, visits: 0 }]));
}

/** Các khách quen đang muốn ghé tiệm hôm nay */
export function eligibleRegulars(save, day) {
  const inQueue = new Set(save.shop.customers.map((c) => c.regular).filter(Boolean));
  return Object.entries(REGULARS).filter(([id, r]) => {
    const st = save.regulars[id] || (save.regulars[id] = { hearts: 0, nextDay: 1, visits: 0 });
    return st.hearts < r.chapters.length && save.player.level >= r.minLevel && day >= st.nextDay && !inQueue.has(id);
  }).map(([id]) => id);
}

/** Yêu cầu của chương hiện tại */
export function regularRequest(id, save) {
  const r = REGULARS[id];
  const ch = r.chapters[save.regulars[id].hearts];
  const req = { minQuality: 1, ...structuredClone(ch.request) };
  if (req.type === 'bouquet') req.occasion = 0;
  return req;
}

export function regularChapter(id, save) {
  return REGULARS[id].chapters[save.regulars[id].hearts];
}

/** Sau khi khách quen rời tiệm. success = hài lòng. Trả về { hearts, reward, chapter } */
export function finishRegularVisit(save, id, success, day) {
  const st = save.regulars[id];
  st.visits += 1;
  st.nextDay = day + REGULAR_RULES.daysBetweenVisits;
  if (!success) return { hearts: st.hearts, reward: null };
  const chapter = REGULARS[id].chapters[st.hearts];
  st.hearts += 1;
  applyReward(save, chapter.reward);
  return { hearts: st.hearts, reward: chapter.reward, chapter };
}

export function applyReward(save, rw = {}) {
  const inv = save.inventory;
  if (rw.coins) save.player.coins += rw.coins;
  for (const [k, n] of Object.entries(rw.items || {})) inv.items[k] = (inv.items[k] || 0) + n;
  for (const [k, n] of Object.entries(rw.papers || {})) inv.papers[k] = (inv.papers[k] || 0) + n;
  for (const [k, n] of Object.entries(rw.ribbons || {})) inv.ribbons[k] = (inv.ribbons[k] || 0) + n;
  for (const [k, n] of Object.entries(rw.seeds || {})) inv.seeds[k] = (inv.seeds[k] || 0) + n;
  (rw.reveal || []).forEach((k) => learnMeaning(save, k));
}
