// 🧪 BẢN THỬ (0.28): chỉ bật khi build với VITE_TEST_BUILD=1 (bản chơi thử riêng cho chủ dự án duyệt trước khi phát hành).
// Mở sẵn mọi tính năng trên save khách: cấp cao, nhiều tiền, các đảo / khu đã mở, đủ mồi câu, hạt, hoa, trứng, Xu Vui...
// Bản phát hành thật (Netlify, APK) KHÔNG có cờ này nên không bị ảnh hưởng.
import { xpForLevel } from './systems/progression.js';

export const TEST_BUILD = import.meta.env.VITE_TEST_BUILD === '1';

const FLAGS = ['boat_ready', 'e1_sao', 'co_open', 'co_fish', 'hg_bridge', 'hg_shop', 'hg_kept', 'fun_open', 'party_open', 'branch_open'];

/** Gọi 1 lần cho mỗi save (đánh dấu save.testUnlocked) */
export function applyTestUnlock(save) {
  if (!TEST_BUILD) return false;
  if (save.testUnlocked) { // save thử từ bản cũ: chỉ bổ sung đồ thử của bản mới
    if ((save.testUnlocked || 0) >= 2) return false;
    save.testUnlocked = 2;
    extras031(save);
    return true;
  }
  save.testUnlocked = 2;
  extras031(save);
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

/** (0.31) đồ thử cho gói chiều sâu */
function extras031(save) {
  // (0.31) đồ thử cho gói chiều sâu: cây lâu năm, vật tư chỉnh đất, 2 dòng giống, vài bông hoa có ý nghĩa để gói cho khách tâm sự
  for (const k of ['climbrose:pink', 'bougain:magenta', 'mai:yellow', 'dao:pink']) save.inventory.seeds[k] = (save.inventory.seeds[k] || 0) + 3;
  save.inventory.items = save.inventory.items || {};
  for (const [k, n] of [['lime', 5], ['peat', 5], ['fishmeal', 5]]) save.inventory.items[k] = (save.inventory.items[k] || 0) + n;
  save.garden = save.garden || { strains: {}, sseeds: {}, next: 1, breed: null };
  save.garden.strains = save.garden.strains || {}; save.garden.sseeds = save.garden.sseeds || {};
  save.garden.strains.t1 = { sp: 'rose', v: 'pink', g: { size: 3, bloom: 2, hardy: 3, speed: 2 }, gen: 1, from: null, name: 'dòng Thử F1·A' };
  save.garden.strains.t2 = { sp: 'rose', v: 'red', g: { size: 2, bloom: 4, hardy: 2, speed: 3 }, gen: 1, from: null, name: 'dòng Thử F1·B' };
  save.garden.sseeds.t1 = 3; save.garden.sseeds.t2 = 3;
  for (const [k, n] of [['tulip:white|2', 6], ['rose:red|2', 6], ['daisy:white|2', 6], ['sunflower:yellow|2', 6], ['lavender:purple|2', 5]]) save.inventory.flowers[k] = (save.inventory.flowers[k] || 0) + n;
}
