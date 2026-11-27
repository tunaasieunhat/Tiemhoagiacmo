// 🧪 BẢN THỬ (0.28): chỉ bật khi build với VITE_TEST_BUILD=1 (bản chơi thử riêng cho chủ dự án duyệt trước khi phát hành).
// Mở sẵn mọi tính năng trên save khách: cấp cao, nhiều tiền, các đảo / khu đã mở, đủ mồi câu, hạt, hoa, trứng, Xu Vui...
// Bản phát hành thật (Netlify, APK) KHÔNG có cờ này nên không bị ảnh hưởng.
import { xpForLevel } from './systems/progression.js';

export const TEST_BUILD = import.meta.env.VITE_TEST_BUILD === '1';

const FLAGS = ['boat_ready', 'e1_sao', 'co_open', 'co_fish', 'hg_bridge', 'hg_shop', 'hg_kept', 'fun_open', 'party_open', 'branch_open'];

/** Gọi 1 lần cho mỗi save (đánh dấu save.testUnlocked) */
export function applyTestUnlock(save) {
  if (!TEST_BUILD || save.testUnlocked) return false;
  save.testUnlocked = 1;
  const lv = 30;
  save.player.level = lv;
  save.player.xp = xpForLevel(lv);
  save.player.coins = Math.max(save.player.coins, 500000);
  save.player.reputation = Math.max(save.player.reputation, 800);
  save.tutorial = { ...(save.tutorial || {}), done: true };
  save.story = save.story || {};
  save.story.flags = save.story.flags || {};
  save.story.seen = save.story.seen || {};
  save.story.seen.c1_letter = 1; // bỏ qua cảnh mở đầu
  for (const f of FLAGS) save.story.flags[f] = 1;
  save.stats = { ...(save.stats || {}), harvested: Math.max(save.stats?.harvested || 0, 50) };
  // hoa, hạt, đồ câu, trứng, Xu Vui, vé
  const fl = save.inventory.flowers;
  for (const k of ['rose:red|3', 'rose:pink|2', 'tulip:purple|2', 'daisy:white|2', 'sunflower:yellow|2', 'lavender:purple|2', 'lily:white|2', 'marigold:yellow|2', 'hydrangea:blue|2', 'carnation:pink|2']) fl[k] = (fl[k] || 0) + 30;
  for (const k of ['rose:pink', 'tulip:purple', 'daisy:white', 'sunflower:yellow', 'lavender:purple', 'lily:white']) save.inventory.seeds[k] = (save.inventory.seeds[k] || 0) + 20;
  save.fish = save.fish || {};
  save.fish.bait = { ...(save.fish.bait || {}), worm: 99, shrimp: 99, crab: 99, petal: 99, glow: 99 };
  save.pets = save.pets || {};
  save.pets.eggs = [...(save.pets.eggs || []), { id: 9001, kind: 'common', inc: null }, { id: 9002, kind: 'rare', inc: null }, { id: 9003, kind: 'star', inc: null }];
  save.pets.seq = Math.max(save.pets.seq || 1, 9100);
  save.fun = { ...(save.fun || {}), xu: (save.fun?.xu || 0) + 500 };
  save.luck = save.luck || {};
  save.luck.tickets = { ...(save.luck.tickets || {}), luck: (save.luck.tickets?.luck || 0) + 20, gold: (save.luck.tickets?.gold || 0) + 5 };
  return true;
}
