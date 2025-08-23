import apiClient from '../api/axios/axios';
import 'react-native-get-random-values';
import {AppState, AppStateStatus, NativeEventSubscription} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import {v4 as uuidv4} from 'uuid';

const HEARTBEAT_MS = 30_000;
const GRACE_CLOSE_MS = 10_000;

const HISTORY_KEY = 'session_history';
const MAX_HISTORY = 200;

/** ----- Tipler ----- */
type StopReason = 'logout' | 'close';

/** Lokal arşiv (görsel/analitik için) */
type CompletedSessionLocal = {
  sessionId: string;
  userId: number;
  startedAt: string; // ISO (lokal)
  endedAt: string; // ISO (lokal close anı)
  activeMs: number;
  appVersion?: string;
  deviceModel?: string;
  reason: StopReason;
};

/** Kuyruk item’ları — Server artık sadece query param bekliyor */
type QueueHeartbeat = {kind: 'heartbeat'; sessionId: string};
type QueuePartial = {kind: 'partial'; sessionId: string; activeMs: number};
type QueueClose = {
  kind: 'close';
  sessionId: string;
  activeMs: number;
  reason: StopReason;
};
type QueueItem = QueueHeartbeat | QueuePartial | QueueClose;

class SessionManager {
  private static _i: SessionManager;
  static get I() {
    return (this._i ??= new SessionManager());
  }

  private appState: AppStateStatus = 'active';
  private hbTimer: ReturnType<typeof setInterval> | null = null;
  private bgCloseTimer: ReturnType<typeof setTimeout> | null = null;
  private appStateSub: NativeEventSubscription | null = null;
  private state: SessionState | null = null;

  /** Uygulama açılışında çağır */
  async init(userId: number, appVersion?: string, deviceModel?: string) {
    await this.flushPendingQueue();
    await this.closeStaleIfAny();

    const sessionId = uuidv4();
    const nowISO = new Date().toISOString();

    this.state = {
      sessionId,
      userId,
      startedAt: nowISO,
      activeMs: 0,
      foregroundSince: Date.now(),
      appVersion,
      deviceModel,
    };
    await AsyncStorage.setItem('session_state', JSON.stringify(this.state));

    // AppState dinle
    this.appStateSub?.remove();
    this.appStateSub = AppState.addEventListener(
      'change',
      this.onAppStateChange,
    );

    // HB başlat
    this.hbTimer && clearInterval(this.hbTimer);
    this.hbTimer = setInterval(
      () => this.sendHeartbeat().catch(() => {}),
      HEARTBEAT_MS,
    );

    // Server tarafında startedAt oluşturmak için ilk partial (0 ms) göndermek istersen (opsiyonel):
    try {
      await this.partialStop(false);
    } catch {}
  }

  private onAppStateChange = async (next: AppStateStatus) => {
    const prev = this.appState;
    this.appState = next;
    if (!this.state) return;

    // active -> bg/inactive: aktif süre biriktir, partial gönder, grace sonra close
    if (prev === 'active' && next.match(/inactive|background/)) {
      if (this.state.foregroundSince) {
        this.state.activeMs += Date.now() - this.state.foregroundSince;
        this.state.foregroundSince = undefined;
      }
      this.state.pauseAt = Date.now();
      await AsyncStorage.setItem('session_state', JSON.stringify(this.state));

      this.bgCloseTimer && clearTimeout(this.bgCloseTimer);
      this.bgCloseTimer = setTimeout(async () => {
        if (this.appState.match(/inactive|background/) && this.state) {
          await this.stopSession('close');
        }
      }, GRACE_CLOSE_MS);

      await this.partialStop(false).catch(() => {});
    }

    // bg/inactive -> active: grace iptal, foregroundSince tekrar başlasın, heartbeat at
    if (prev.match(/inactive|background/) && next === 'active') {
      this.bgCloseTimer && clearTimeout(this.bgCloseTimer);
      this.bgCloseTimer = null;
      this.state.foregroundSince = Date.now();
      await AsyncStorage.setItem('session_state', JSON.stringify(this.state));
      await this.sendHeartbeat().catch(() => {});
    }
  };

  /** Oturumu kapat (logout/close) */
  async stopSession(reason: StopReason = 'close') {
    if (!this.state) return;

    // aktif süreyi son kez topla
    if (this.state.foregroundSince) {
      this.state.activeMs += Date.now() - this.state.foregroundSince;
      this.state.foregroundSince = undefined;
    }

    const endedAtLocal = new Date().toISOString();
    const {sessionId, activeMs} = this.state;

    // HB ve AppState dinleyicilerini durdur
    this.hbTimer && clearInterval(this.hbTimer);
    this.hbTimer = null;
    this.bgCloseTimer && clearTimeout(this.bgCloseTimer);
    this.bgCloseTimer = null;
    this.appStateSub?.remove();
    this.appStateSub = null;

    // Server’a close (query params)
    const net = await NetInfo.fetch();
    if (net.isConnected) {
      await apiClient.post('/sessions/close', null, {
        params: {sessionId, activeMs, reason},
      });
    } else {
      await this.enqueue({kind: 'close', sessionId, activeMs, reason});
    }

    // Lokal arşive yaz (ekranlarda göstermek için)
    await this.appendToHistory({
      sessionId,
      userId: this.state.userId,
      startedAt: this.state.startedAt,
      endedAt: endedAtLocal,
      activeMs,
      appVersion: this.state.appVersion,
      deviceModel: this.state.deviceModel,
      reason,
    }).catch(() => {});

    await AsyncStorage.removeItem('session_state');
    this.state = null;
  }

  /** Heartbeat: server sadece sessionId bekliyor */
  private async sendHeartbeat() {
    if (!this.state) return;
    const nowISO = new Date().toISOString();
    this.state.lastHeartbeatAt = nowISO;
    await AsyncStorage.setItem('session_state', JSON.stringify(this.state));

    const {sessionId} = this.state;
    const net = await NetInfo.fetch();
    if (net.isConnected) {
      await apiClient.post('/sessions/heartbeat', null, {
        params: {sessionId},
      });
    } else {
      await this.enqueue({kind: 'heartbeat', sessionId});
    }
  }

  /** Partial (checkpoint): server sessionId + activeMs bekliyor */
  private async partialStop(_isCrash: boolean) {
    if (!this.state) return;
    const {sessionId, activeMs} = this.state;
    const net = await NetInfo.fetch();
    if (net.isConnected) {
      await apiClient.post('/sessions/partial', null, {
        params: {sessionId, activeMs},
      });
    } else {
      await this.enqueue({kind: 'partial', sessionId, activeMs});
    }
  }

  /** Uygulama kill/crash sonrası kaldığı yerden kapat (stale close) */
  private async closeStaleIfAny() {
    const cached = await AsyncStorage.getItem('session_state');
    if (!cached) return;
    try {
      const old: SessionState = JSON.parse(cached);

      // foregroundSince yok ve pauseAt varsa: arka planda kalmış ve kapanmış say
      if (!old.foregroundSince && old.pauseAt) {
        const {sessionId, activeMs} = old;
        const net = await NetInfo.fetch();
        if (net.isConnected) {
          await apiClient.post('/sessions/close', null, {
            params: {sessionId, activeMs, reason: 'close'},
          });
        } else {
          await this.enqueue({
            kind: 'close',
            sessionId,
            activeMs,
            reason: 'close',
          });
        }

        // Lokal arşive de yaz
        await this.appendToHistory({
          sessionId: old.sessionId,
          userId: old.userId,
          startedAt: old.startedAt,
          endedAt: new Date(old.pauseAt).toISOString(),
          activeMs: old.activeMs,
          appVersion: old.appVersion,
          deviceModel: old.deviceModel,
          reason: 'close',
        }).catch(() => {});
      }
    } finally {
      await AsyncStorage.removeItem('session_state');
    }
  }

  /** ---- Kuyruk yönetimi (offline) ---- */
  private async enqueue(item: QueueItem) {
    const qRaw = await AsyncStorage.getItem('session_queue');
    const q: QueueItem[] = qRaw ? JSON.parse(qRaw) : [];
    q.push(item);
    await AsyncStorage.setItem('session_queue', JSON.stringify(q));
  }

  private async flushPendingQueue() {
    const qRaw = await AsyncStorage.getItem('session_queue');
    if (!qRaw) return;
    const q: QueueItem[] = JSON.parse(qRaw);
    if (q.length === 0) return;
    const net = await NetInfo.fetch();
    if (!net.isConnected) return;

    for (const item of q) {
      try {
        if (item.kind === 'heartbeat') {
          await apiClient.post('/sessions/heartbeat', null, {
            params: {sessionId: item.sessionId},
          });
        } else if (item.kind === 'partial') {
          await apiClient.post('/sessions/partial', null, {
            params: {sessionId: item.sessionId, activeMs: item.activeMs},
          });
        } else {
          // close
          await apiClient.post('/sessions/close', null, {
            params: {
              sessionId: item.sessionId,
              activeMs: item.activeMs,
              reason: item.reason,
            },
          });
        }
      } catch {
        // gönderilemeyeni bırak, kalanları dene
      }
    }
    await AsyncStorage.removeItem('session_queue');
  }

  /** ---- Lokal arşiv (UI göstermek için) ---- */
  private async appendToHistory(entry: CompletedSessionLocal) {
    try {
      const raw = await AsyncStorage.getItem(HISTORY_KEY);
      const list: CompletedSessionLocal[] = raw ? JSON.parse(raw) : [];
      list.unshift(entry);
      if (list.length > MAX_HISTORY) list.length = MAX_HISTORY;
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(list));
    } catch {}
  }

  async getSessionHistory(): Promise<CompletedSessionLocal[]> {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as CompletedSessionLocal[]) : [];
  }

  async getSessionHistoryByUser(
    userId: number,
  ): Promise<CompletedSessionLocal[]> {
    const all = await this.getSessionHistory();
    return all.filter(s => s.userId === userId);
  }

  async clearSessionHistory(): Promise<void> {
    await AsyncStorage.removeItem(HISTORY_KEY);
  }

  async pruneSessionHistory(max: number = MAX_HISTORY): Promise<void> {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    if (!raw) return;
    const list: CompletedSessionLocal[] = JSON.parse(raw);
    if (list.length <= max) return;
    list.length = max;
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(list));
  }
}

const sessionManager = SessionManager.I;
export default sessionManager;
