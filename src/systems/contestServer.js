// =============================================================
//  XỬ LÝ NỘP BÀI CUỘC THI TRÊN MÁY CHỦ (chạy trong Edge Function "contest-submit")
//  Viết tách khỏi Supabase để có thể kiểm thử bằng Node.
//  db: { loadSave(uid), countEntries(round, uid), insertEntry(row), upsertBest(round, uid, score), rank(round, uid) }
// =============================================================
import { CONTEST } from '../../data/contest.js';
import { PAPERS, RIBBONS } from '../../data/wrapping.js';
import { roundOf, contestScore } from './contest.js';

export async function handleContestSubmit({ uid, body, db, now = Date.now() }) {
  const round = roundOf(now);
  if (!body || body.round !== round.id) return { status: 409, error: 'Mùa thi đã thay đổi, hãy tải lại bảng cuộc thi' };
  const sel = { items: body.items || {}, paper: body.paper, ribbon: body.ribbon };
  const r = contestScore(round.theme, sel);
  if (!r.ok) return { status: 400, error: r.reason };
  const used = await db.countEntries(round.id, uid);
  if (used >= CONTEST.maxEntriesPerRound) return { status: 429, error: `Mỗi tuần chỉ nộp được ${CONTEST.maxEntriesPerRound} bó hoa` };
  // đối chiếu với tiến độ đã đồng bộ: phải thật sự có số hoa / giấy / ruy băng này
  const save = await db.loadSave(uid);
  if (!save) return { status: 400, error: 'Hãy đồng bộ tiến độ lên mạng trước khi dự thi' };
  for (const [k, n] of Object.entries(sel.items)) {
    if (n > 0 && !((save.inventory?.flowers?.[k] || 0) >= n)) return { status: 400, error: 'Bạn không có đủ hoa này (theo tiến độ đã đồng bộ)' };
  }
  if (!PAPERS[sel.paper].free && !((save.inventory?.papers?.[sel.paper] || 0) >= 1)) return { status: 400, error: 'Bạn không có giấy gói này' };
  if (!RIBBONS[sel.ribbon].free && !((save.inventory?.ribbons?.[sel.ribbon] || 0) >= 1)) return { status: 400, error: 'Bạn không có ruy băng này' };
  await db.insertEntry({ round: round.id, user_id: uid, score: r.score, entry: { items: sel.items, paper: sel.paper, ribbon: sel.ribbon, parts: r.parts, rareBonus: r.rareBonus } });
  await db.upsertBest(round.id, uid, r.score);
  const rank = await db.rank(round.id, uid);
  return { status: 200, data: { score: r.score, base: r.base, parts: r.parts, rareBonus: r.rareBonus, entries: used + 1, ...rank } };
}
