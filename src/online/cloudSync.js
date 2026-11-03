// =============================================================
//  ĐỒNG BỘ SAVE LÊN CLOUD
//  - Luôn lưu trên máy trước (chơi được khi mất mạng), có mạng thì đẩy lên.
//  - Máy chủ đánh số "rev" mỗi lần ghi. Nếu máy khác đã ghi trong lúc này => "xung đột",
//    người chơi chọn giữ bản nào (bản còn lại được sao lưu trên máy, không mất).
// =============================================================
import { supabase, withTimeout } from './supabase.js';
import { ONLINE } from '../../data/online.js';
import { migrateSave, createNewSave } from '../save/schema.js';
import { readLocalSave, backupSave, deviceName } from '../save/saveManager.js';

/** status: 'synced' | 'pending' | 'syncing' | 'offline' | 'error' | 'conflict' */
export class CloudSync {
  constructor({ userId, saveMgr, emitter }) {
    this.userId = userId;
    this.saveMgr = saveMgr;
    this.emitter = emitter;
    this.status = 'pending';
    this.lastSyncAt = 0;
    this.lastTryAt = 0;
    this.busy = false;
    this.conflict = null;
    this.timer = null;
  }

  setStatus(s, extra) {
    this.status = s;
    this.emitter.emit('sync', { status: s, at: this.lastSyncAt, ...extra });
  }

  get hasPending() {
    const m = this.saveMgr.save?.meta;
    return !!m && m.rev > m.syncedRev;
  }

  async fetchCloud() {
    const { data, error } = await withTimeout((sig) => supabase.from('saves').select('data, rev, version, updated_at, device').eq('user_id', this.userId).abortSignal(sig).retry(false).maybeSingle(), 6000);
    if (error) throw error;
    return data;
  }

  /**
   * Chọn save khi mở game (đã đăng nhập).
   * @param askConflict async (localSave, cloudSave) => 'local' | 'cloud'
   * @returns { save, isNew, source }
   */
  async resolveStartup(askConflict) {
    const uid = this.userId;
    const local = await readLocalSave(uid);
    let cloudRow;
    try {
      cloudRow = await this.fetchCloud();
    } catch (e) {
      console.warn('Không tải được save từ cloud, dùng bản trên máy', e);
      this.setStatus('offline');
      if (local) return { save: local, source: 'local-offline' };
      return { save: await this.adoptGuestOrNew(), isNew: true, source: 'new-offline' };
    }

    const cloud = cloudRow ? this.fromCloud(cloudRow) : null;
    if (!cloud && !local) return { save: await this.adoptGuestOrNew(), isNew: true, source: 'new' };
    if (cloud && !local) return { save: cloud, source: 'cloud' };
    if (!cloud && local) return { save: local, source: 'local' };

    if (local.meta.cloudRev === cloudRow.rev) return { save: local, source: 'local' }; // cloud chưa đổi từ lần đồng bộ trước
    if (local.meta.rev <= local.meta.syncedRev) return { save: cloud, source: 'cloud' }; // máy này không có gì mới
    const choice = await askConflict(local, cloud);
    if (choice === 'cloud') {
      await backupSave(uid, local, `conflict-${Date.now()}`);
      return { save: cloud, source: 'cloud' };
    }
    await backupSave(uid, cloud, `conflict-${Date.now()}`);
    local.meta.cloudRev = cloudRow.rev; // ghi đè lên bản cloud
    return { save: local, source: 'local' };
  }

  fromCloud(row) {
    const s = migrateSave(structuredClone(row.data));
    s.meta.cloudRev = row.rev;
    s.meta.syncedRev = s.meta.rev;
    s.meta.ownerId = this.userId;
    if (row.device) s.meta.device = row.device;
    return s;
  }

  /** Tài khoản mới: nếu đã chơi thử bằng chế độ khách trên máy này thì mang tiến độ đó sang */
  async adoptGuestOrNew() {
    const guest = await readLocalSave('guest');
    const played = guest && (guest.stats?.harvested > 0 || guest.tutorial?.step > 0 || guest.stats?.playMinutes > 3);
    const s = played ? structuredClone(guest) : createNewSave();
    s.meta.ownerId = this.userId;
    s.meta.cloudRev = 0;
    s.meta.syncedRev = 0;
    s.meta.rev = Math.max(1, s.meta.rev);
    this.adoptedGuest = !!played;
    return s;
  }

  start() {
    this.timer = setInterval(() => this.tick(), 5000);
    addEventListener('online', () => this.push());
    addEventListener('offline', () => this.setStatus('offline'));
    this.push();
  }

  tick() {
    if (this.status === 'conflict' || this.busy) return;
    const now = Date.now();
    const wait = (this.status === 'error' || this.status === 'offline' ? ONLINE.retrySeconds : ONLINE.cloudSyncSeconds) * 1000;
    if (this.hasPending && now - this.lastTryAt >= wait) this.push();
  }

  /** SaveManager gọi sau mỗi lần lưu trên máy */
  notify(reason) {
    if (this.status === 'conflict') return;
    if (['exit', 'manual', 'boot', 'reset'].includes(reason)) this.push();
    else if (this.status === 'synced' && this.hasPending) this.setStatus('pending');
  }

  async push({ force = false } = {}) {
    if (this.status === 'conflict' && !force) return;
    if (!this.hasPending && !force) { if (this.status !== 'synced') this.setStatus('synced'); return; }
    if (typeof navigator !== 'undefined' && navigator.onLine === false) { this.setStatus('offline'); return; }
    if (this.busy) { this.again = true; return this.inflight; }
    this.busy = true;
    let done;
    this.inflight = new Promise((r) => { done = r; });
    this.lastTryAt = Date.now();
    this.setStatus('syncing');
    const s = this.saveMgr.save;
    const sentRev = s.meta.rev;
    try {
      const { data, error } = await withTimeout((sig) => supabase.rpc('push_save', {
        p_data: structuredClone(s), p_version: s.version, p_base_rev: s.meta.cloudRev || 0, p_device: deviceName(),
      }).abortSignal(sig), 15000);
      if (error) throw error;
      this.lastResult = data.status;
      if (data.status === 'ok') {
        s.meta.cloudRev = data.rev;
        s.meta.syncedRev = Math.max(s.meta.syncedRev, sentRev);
        this.lastSyncAt = Date.now();
        await this.saveMgr.writeLocal();
        this.setStatus(this.hasPending ? 'pending' : 'synced');
      } else if (data.status === 'rate_limited') {
        this.lastTryAt = Date.now() - ONLINE.cloudSyncSeconds * 1000 + 5000; // thử lại sau ~5 giây
        this.setStatus('pending');
      } else if (data.status === 'conflict') {
        this.conflict = data;
        this.setStatus('conflict');
        this.emitter.emit('cloud-conflict', { local: s, cloud: this.fromCloud(data), row: data });
      }
    } catch (e) {
      console.warn('Đồng bộ thất bại', e);
      const offline = /fetch|network|load failed|abort/i.test(String(e?.message || e));
      this.setStatus(offline ? 'offline' : 'error', { message: e?.message });
    } finally {
      this.busy = false;
      done();
      if (this.again) { this.again = false; setTimeout(() => this.push(), 3500); }
    }
  }

  /** Đợi đến khi save trên máy đã lên mạng (dùng trước khi tặng quà). Trả về true nếu thành công */
  async flush(maxMs = 10000) {
    const end = Date.now() + maxMs;
    while (Date.now() < end) {
      if (this.busy) { await this.inflight; continue; }
      if (!this.hasPending) return true;
      if (this.status === 'conflict') return false;
      this.lastResult = null;
      await this.push();
      if (!this.hasPending) return true;
      if (this.lastResult === 'rate_limited') await new Promise((r) => setTimeout(r, 3200));
      else if (this.status === 'offline' || this.status === 'error') return false;
    }
    return !this.hasPending;
  }

  /** Người chơi chọn cách giải quyết xung đột giữa 2 máy */
  async resolveConflict(choice) {
    const row = this.conflict;
    if (!row) return;
    const s = this.saveMgr.save;
    if (choice === 'cloud') {
      await backupSave(this.userId, s, `conflict-${Date.now()}`);
      this.saveMgr.use(this.fromCloud(row));
      await this.saveMgr.writeLocal();
      location.reload();
      return;
    }
    await backupSave(this.userId, this.fromCloud(row), `conflict-${Date.now()}`);
    s.meta.cloudRev = row.rev;
    this.conflict = null;
    this.status = 'pending';
    await this.push({ force: true });
  }
}
