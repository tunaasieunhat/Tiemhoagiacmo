// Nhiệm vụ ngày / tuần (thuần dữ liệu)
import { QUESTS, QUEST_TEMPLATES } from '../../data/quests.js';

const tierOfLevel = (lv) => (lv >= 7 ? 2 : lv >= 4 ? 1 : 0);

export function createQuestState() {
  return { day: 0, week: 0, daily: [], weekly: [] };
}

function pickQuests(list, count, rng, { level, online }) {
  const pool = list.filter((t) => (!t.minLevel || level >= t.minLevel) && (!t.online || online));
  const out = [];
  const used = new Set();
  while (out.length < count && used.size < pool.length) {
    const t = pool[Math.floor(rng() * pool.length)];
    if (used.has(t.id)) continue;
    used.add(t.id);
    out.push({ id: t.id, n: t.n[tierOfLevel(level)], progress: 0, claimed: false });
  }
  return out;
}

/** Làm mới nhiệm vụ khi sang ngày / tuần game mới. Trả về true nếu có thay đổi */
export function refreshQuests(save, day, { rng = Math.random, online = false } = {}) {
  const q = save.quests || (save.quests = createQuestState());
  const week = Math.floor((day - 1) / 7) + 1;
  let changed = false;
  if (q.day !== day) { q.day = day; q.daily = pickQuests(QUEST_TEMPLATES.daily, QUESTS.perDay, rng, { level: save.player.level, online }); changed = true; }
  if (q.week !== week) { q.week = week; q.weekly = pickQuests(QUEST_TEMPLATES.weekly, QUESTS.perWeek, rng, { level: save.player.level, online }); changed = true; }
  return changed;
}

export const templateOf = (kind, id) => QUEST_TEMPLATES[kind].find((t) => t.id === id);

/** Ghi nhận tiến độ. Trả về danh sách nhiệm vụ vừa hoàn thành */
export function questProgress(save, event, amount = 1) {
  const q = save.quests;
  if (!q) return [];
  const done = [];
  for (const kind of ['daily', 'weekly']) {
    for (const it of q[kind]) {
      const t = templateOf(kind, it.id);
      if (!t || t.event !== event || it.progress >= it.n) continue;
      it.progress = Math.min(it.n, it.progress + amount);
      if (it.progress >= it.n) done.push({ kind, quest: it, template: t });
    }
  }
  return done;
}

export function questReward(save, kind) {
  const tier = tierOfLevel(save.player.level);
  return (kind === 'daily' ? QUESTS.dailyReward : QUESTS.weeklyReward)[tier];
}

/** Nhận thưởng 1 nhiệm vụ. Trả về phần thưởng hoặc null */
export function claimQuest(save, kind, index) {
  const it = save.quests?.[kind]?.[index];
  if (!it || it.claimed || it.progress < it.n) return null;
  it.claimed = true;
  const rw = questReward(save, kind);
  save.player.coins += rw.coins;
  if (rw.fertilizer) save.inventory.items.fertilizer = (save.inventory.items.fertilizer || 0) + rw.fertilizer;
  return rw;
}

export const claimableCount = (save) => ['daily', 'weekly'].reduce((a, k) => a + (save.quests?.[k] || []).filter((q) => !q.claimed && q.progress >= q.n).length, 0);
