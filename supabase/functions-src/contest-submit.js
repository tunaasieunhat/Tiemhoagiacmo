// Nguồn của Edge Function "contest-submit". KHÔNG sửa file trong supabase/functions/ (do máy tạo ra).
// Tạo lại bằng lệnh:  npm run build:functions
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { handleContestSubmit } from '../../src/systems/contestServer.js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const reply = (status, obj) => new Response(JSON.stringify(obj), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return reply(405, { error: 'Method not allowed' });
  // khóa service_role chỉ nằm trên máy chủ Supabase (biến môi trường tự có), KHÔNG ở trình duyệt
  const admin = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false } });
  const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  const { data: userData, error: authErr } = await admin.auth.getUser(token);
  if (authErr || !userData?.user) return reply(401, { error: 'Hãy đăng nhập lại' });
  const uid = userData.user.id;
  let body;
  try { body = await req.json(); } catch { return reply(400, { error: 'Dữ liệu không hợp lệ' }); }

  const db = {
    async loadSave(id) {
      const { data } = await admin.from('saves').select('data').eq('user_id', id).maybeSingle();
      return data?.data || null;
    },
    async countEntries(round, id) {
      const { count } = await admin.from('contest_entries').select('id', { count: 'exact', head: true }).eq('round', round).eq('user_id', id);
      return count || 0;
    },
    async insertEntry(row) {
      const { error } = await admin.from('contest_entries').insert(row);
      if (error) throw error;
    },
    async upsertBest(round, id, score) {
      const { data } = await admin.from('contest_best').select('best').eq('round', round).eq('user_id', id).maybeSingle();
      if (!data) await admin.from('contest_best').insert({ round, user_id: id, best: score });
      else if (score > data.best) await admin.from('contest_best').update({ best: score, updated_at: new Date().toISOString() }).eq('round', round).eq('user_id', id);
    },
    async rank(round, id) {
      const { data } = await admin.rpc('contest_rank', { p_round: round, uid: id });
      return data || {};
    },
  };

  try {
    const r = await handleContestSubmit({ uid, body, db });
    return r.status === 200 ? reply(200, r.data) : reply(r.status, { error: r.error });
  } catch (e) {
    console.error(e);
    return reply(500, { error: 'Máy chủ gặp lỗi, thử lại sau' });
  }
});
