// Bảng xếp hạng & cuộc thi hoa: gọi máy chủ
import { supabase, withTimeout } from './supabase.js';
import { roundOf, previousRound } from '../systems/contest.js';

async function rpc(name, args = {}) {
  const { data, error } = await withTimeout((sig) => supabase.rpc(name, args).abortSignal(sig), 12000);
  if (error) throw error;
  return data;
}

export const submitScores = () => rpc('submit_scores');
export const leaderboard = (board, period, scope, round = null) => rpc('get_leaderboard', { p_board: board, p_period: period, p_scope: scope, p_round: round });
export const contestStatus = () => rpc('contest_status', { p_current: roundOf().id, p_previous: previousRound().id });
export const claimContest = (round) => rpc('claim_contest_reward', { p_round: round });

/** Nộp bài dự thi qua Edge Function (máy chủ tự chấm lại điểm) */
export async function submitContest(sel) {
  const body = { round: roundOf().id, items: sel.items, paper: sel.paper, ribbon: sel.ribbon };
  const { data, error } = await supabase.functions.invoke('contest-submit', { body });
  if (error) {
    let msg = error.message;
    try { const j = await error.context?.json?.(); if (j?.error) msg = j.error; } catch { /* bỏ qua */ }
    if (/Failed to send|fetch/i.test(msg)) msg = 'Không kết nối được máy chủ cuộc thi (Edge Function "contest-submit" đã được cài chưa?)';
    throw new Error('SOCIAL: ' + msg);
  }
  return data;
}
