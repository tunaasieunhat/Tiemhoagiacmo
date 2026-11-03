// Quản lý bạn bè phía game: hỏi máy chủ định kỳ, nhận lượt tưới giúp, đăng ảnh nông trại công khai.
import { social } from './social.js';
import { buildSnapshot } from './showcase.js';
import { viError } from './errors.js';

const POLL_MS = 45000;
const PUBLISH_MS = 90000;
const SEEN_KEY = (uid) => `thgm:guestbook-seen:${uid}`;

export class SocialManager {
  constructor({ game, emitter, userId }) {
    this.game = game;
    this.emitter = emitter;
    this.userId = userId;
    this.overview = null;
    this.lastPublish = 0;
    this.timer = null;
    this.busy = false;
  }

  start() {
    this.poll();
    this.timer = setInterval(() => this.poll(), POLL_MS);
    addEventListener('online', () => this.poll());
  }

  get seenMessage() { try { return +localStorage.getItem(SEEN_KEY(this.userId)) || 0; } catch { return 0; } }
  markMessagesSeen() {
    try { localStorage.setItem(SEEN_KEY(this.userId), String(this.overview?.latest_message || 0)); } catch { /* bỏ qua */ }
    this.emitter.emit('social', this.overview);
  }

  /** Số việc chờ: lời mời + quà + lời nhắn mới */
  get badge() {
    const o = this.overview;
    if (!o) return 0;
    return (o.incoming?.length || 0) + (o.gifts_waiting || 0) + ((o.latest_message || 0) > this.seenMessage ? 1 : 0);
  }

  async poll() {
    if (this.busy || navigator.onLine === false) return;
    this.busy = true;
    try {
      this.overview = await social.overview();
      if (this.overview.helps_waiting > 0) {
        const helps = await social.claimHelps();
        if (helps.length) this.game.receiveWaterHelp(helps);
        this.overview.helps_waiting = 0;
      }
      if (Date.now() - this.lastPublish > PUBLISH_MS) await this.publish();
      this.emitter.emit('social', this.overview);
    } catch (e) {
      console.warn('Không tải được dữ liệu bạn bè', e);
    } finally {
      this.busy = false;
    }
  }

  async publish() {
    try {
      await social.publish(buildSnapshot(this.game.save));
      this.lastPublish = Date.now();
    } catch (e) { console.warn('Không đăng được ảnh nông trại', e); }
  }

  /** Gọi 1 hàm máy chủ, báo lỗi tiếng Việt, rồi làm mới tổng quan */
  async act(fn, okMsg) {
    try {
      const r = await fn();
      if (okMsg) this.game.toast(okMsg, 'good');
      this.poll();
      return r ?? true;
    } catch (e) {
      this.game.toast(viError(e), 'warn');
      return null;
    }
  }
}
