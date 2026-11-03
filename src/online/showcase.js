// Ảnh chụp nông trại công khai: gọn nhẹ, chỉ chứa thứ bạn bè cần để xem (không có tiền, kho đồ).
import { stageOf, isWilted, isSick, growMinutes } from '../systems/farming.js';
import { tierInfo } from '../systems/shop.js';
import { bookProgress } from '../systems/notebook.js';
import { placedToSnapshot, beautyOf } from '../systems/decor.js';

const STATE = { untilled: 0, tilled: 1, growing: 2, ready: 3, dead: 4 };
const STATE_BACK = ['untilled', 'tilled', 'growing', 'ready', 'dead'];

export function buildSnapshot(save) {
  const now = save.time.gameMinutes;
  const t = tierInfo(save.player.reputation);
  const hearts = Object.values(save.regulars || {}).reduce((a, r) => a + (r.hearts || 0), 0);
  return {
    v: 1,
    level: save.player.level,
    reputation: save.player.reputation,
    tier: t.name,
    tierIcon: t.icon,
    served: save.stats.served || 0,
    bouquets: save.stats.bouquets || 0,
    harvested: save.stats.harvested || 0,
    book: save.book ? bookProgress(save).pct : 0,
    hearts,
    // đồ trang trí đặt tự do: [[loại, x, z, góc], ...] (GĐ10)
    deco: placedToSnapshot(save.decor?.placed || []),
    beauty: beautyOf(save.decor?.placed || []),
    plots: save.farm.plots.map((p) => ({
      gh: p.greenhouse ? 1 : 0,
      mc: p.machines?.sprinkler ? 1 : 0,
      mf: p.machines?.feeder ? 1 : 0,
      cv: !p.greenhouse && (p.coverUntil || 0) >= now ? 1 : 0,
      tiles: p.tiles.map((tile) => ({
        s: STATE[tile.state] ?? 0,
        f: tile.flower || undefined,
        v: tile.variant || undefined,
        g: stageOf(tile),
        w: tile.water > 0.25 ? 1 : 0,
        h: isWilted(tile) ? 1 : 0,
        k: isSick(tile) ? 1 : 0,
      })),
    })),
  };
}

/** Dựng lại dữ liệu kiểu "save" tối thiểu để vẽ nông trại của bạn bè */
export function snapshotToFarm(snap) {
  const plots = (snap?.plots?.length ? snap.plots : [{ tiles: Array.from({ length: 9 }, () => ({ s: 0 })) }]).slice(0, 4);
  return {
    time: { gameMinutes: 0 },
    farm: {
      plots: plots.map((p) => ({
        cols: 3, rows: 3, greenhouse: !!p.gh, coverUntil: p.cv ? Infinity : -1, machines: { sprinkler: !!p.mc, feeder: !!p.mf },
        tiles: (p.tiles || []).slice(0, 9).map((t) => {
          const state = STATE_BACK[t.s] || 'untilled';
          const flower = t.f || null;
          const hasPlant = flower && (state === 'growing' || state === 'ready' || state === 'dead');
          const frac = [0.05, 0.3, 0.7, 1][Math.max(0, t.g ?? 0)] ?? 0.05;
          return {
            state: hasPlant || state === 'tilled' || state === 'untilled' ? state : 'untilled',
            flower: hasPlant ? flower : null, variant: t.v || null,
            growth: hasPlant ? growMinutes(flower) * frac : 0,
            water: t.w ? 0.8 : state === 'tilled' ? 0 : 0.1,
            health: t.h ? 30 : 100, fert: 0, sick: t.k ? 'aphid' : null,
          };
        }),
      })),
    },
  };
}
