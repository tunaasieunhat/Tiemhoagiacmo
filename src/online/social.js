// Gọi các hàm máy chủ về bạn bè (xem supabase/migrations/…_gd7_social.sql)
import { supabase, withTimeout } from './supabase.js';

async function rpc(name, args = {}) {
  const { data, error } = await withTimeout((sig) => supabase.rpc(name, args).abortSignal(sig), 12000);
  if (error) throw error;
  return data;
}

export const social = {
  overview: () => rpc('social_overview'),
  search: (q) => rpc('search_players', { q }),
  request: (target) => rpc('send_friend_request', { target }),
  respond: (requestId, accept) => rpc('respond_friend_request', { request_id: requestId, accept }),
  remove: (friend) => rpc('remove_friend', { friend }),
  visit: (friend) => rpc('visit_farm', { friend }),
  helpWater: (friend) => rpc('help_water', { friend }),
  claimHelps: () => rpc('claim_helps'),
  sendGift: (friend, kind, key, qty, message) => rpc('send_gift', { friend, p_kind: kind, p_key: key, p_qty: qty, p_message: message || null }),
  claimGifts: () => rpc('claim_gifts'),
  post: (owner, text) => rpc('post_message', { farm_owner: owner, p_text: text }),
  deleteMessage: (id) => rpc('delete_message', { message_id: id }),
  myGuestbook: () => rpc('my_guestbook'),
  publish: (snapshot) => rpc('publish_showcase', { p_snapshot: snapshot }),
};

// Giới hạn quà (khớp với máy chủ) — dùng để hiển thị
export const GIFT_LIMITS = { flower: 10, seed: 10, item: 5, coins: 500 };
