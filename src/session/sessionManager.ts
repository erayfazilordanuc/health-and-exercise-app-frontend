import apiClient from '../api/axios/axios';
import 'react-native-get-random-values';
import {AppState, AppStateStatus, NativeEventSubscription} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import {v4 as uuidv4} from 'uuid';

const HEARTBEAT_MS = 30_000;
const GRACE_CLOSE_MS = 10_000;

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

    this.appStateSub?.remove();
    this.appStateSub = AppState.addEventListener(
      'change',
      this.onAppStateChange,
    );

    this.hbTimer && clearInterval(this.hbTimer);
    this.hbTimer = setInterval(
      () => this.sendHeartbeat().catch(() => {}),
      HEARTBEAT_MS,
    );
  }

  private onAppStateChange = async (next: AppStateStatus) => {
    const prev = this.appState;
    this.appState = next;
    if (!this.state) return;

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

    if (prev.match(/inactive|background/) && next === 'active') {
      this.bgCloseTimer && clearTimeout(this.bgCloseTimer);
      this.bgCloseTimer = null;
      this.state.foregroundSince = Date.now();
      await AsyncStorage.setItem('session_state', JSON.stringify(this.state));
      await this.sendHeartbeat().catch(() => {});
    }
  };

  async stopSession(reason: 'logout' | 'close' = 'close') {
    if (!this.state) return;

    if (this.state.foregroundSince) {
      this.state.activeMs += Date.now() - this.state.foregroundSince;
      this.state.foregroundSince = undefined;
    }

    const endedAt = new Date().toISOString();
    const payload = {
      sessionId: this.state.sessionId,
      userId: this.state.userId,
      startedAt: this.state.startedAt,
      endedAt,
      activeMs: this.state.activeMs,
      appVersion: this.state.appVersion,
      deviceModel: this.state.deviceModel,
      reason,
    };

    this.hbTimer && clearInterval(this.hbTimer);
    this.hbTimer = null;
    this.bgCloseTimer && clearTimeout(this.bgCloseTimer);
    this.bgCloseTimer = null;

    this.appStateSub?.remove();
    this.appStateSub = null;

    const net = await NetInfo.fetch();
    if (net.isConnected) await apiClient.post('/sessions/close', payload);
    else await this.enqueue(payload);

    await AsyncStorage.removeItem('session_state');
    this.state = null;
  }

  private async sendHeartbeat() {
    if (!this.state) return;
    const now = new Date();
    this.state.lastHeartbeatAt = now.toISOString();
    const payload = {
      sessionId: this.state.sessionId,
      userId: this.state.userId,
      at: now.toISOString(),
    };
    const net = await NetInfo.fetch();
    if (net.isConnected) {
      await apiClient.post('/sessions/heartbeat', payload);
    } else {
      await this.enqueue({...payload, type: 'heartbeat'});
    }
  }

  private async partialStop(isCrash: boolean) {
    if (!this.state) return;
    const payload = {
      sessionId: this.state.sessionId,
      userId: this.state.userId,
      at: new Date().toISOString(),
      activeMs: this.state.activeMs,
      isCrash,
    };
    const net = await NetInfo.fetch();
    if (net.isConnected) {
      await apiClient.post('/sessions/partial', payload);
    } else {
      await this.enqueue({...payload, type: 'partial'});
    }
  }

  private async closeStaleIfAny() {
    const cached = await AsyncStorage.getItem('session_state');
    if (!cached) return;
    try {
      const old: SessionState = JSON.parse(cached);
      if (!old.foregroundSince && old.pauseAt) {
        const endedAt = new Date(old.pauseAt).toISOString();
        const payload = {
          sessionId: old.sessionId,
          userId: old.userId,
          startedAt: old.startedAt,
          endedAt,
          activeMs: old.activeMs,
          appVersion: old.appVersion,
          deviceModel: old.deviceModel,
          reason: 'close',
        };
        const net = await NetInfo.fetch();
        if (net.isConnected) {
          await apiClient.post('/sessions/close', payload);
        } else {
          await this.enqueue(payload);
        }
      }
    } finally {
      await AsyncStorage.removeItem('session_state');
    }
  }

  private async enqueue(item: any) {
    const qRaw = await AsyncStorage.getItem('session_queue');
    const q = qRaw ? JSON.parse(qRaw) : [];
    q.push(item);
    await AsyncStorage.setItem('session_queue', JSON.stringify(q));
  }

  private async flushPendingQueue() {
    const qRaw = await AsyncStorage.getItem('session_queue');
    if (!qRaw) return;
    const q = JSON.parse(qRaw);
    if (q.length === 0) return;
    const net = await NetInfo.fetch();
    if (!net.isConnected) return;
    for (const item of q) {
      if (item.type === 'heartbeat')
        await apiClient.post('/sessions/heartbeat', item);
      else if (item.type === 'partial')
        await apiClient.post('/sessions/partial', item);
      else await apiClient.post('/sessions/close', item);
    }
    await AsyncStorage.removeItem('session_queue');
  }
}

const sessionManager = SessionManager.I;
export default sessionManager;
