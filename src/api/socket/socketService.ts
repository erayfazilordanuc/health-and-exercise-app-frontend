import {io, Socket} from 'socket.io-client';

const SERVER_URL = 'https://eray.ordanuc.com';

class SocketService {
  socket: Socket;

  constructor() {
    console.log('[SocketService] 🔌 Initializing socket...');
    this.socket = io(SERVER_URL, {
      transports: ['websocket'],
      autoConnect: false,
    });

    this.socket.on('connect', () => {
      console.log(
        `[SocketService] ✅ Connected to socket server with id: ${this.socket.id}`,
      );
    });

    this.socket.on('disconnect', reason => {
      console.log(`[SocketService] ❌ Disconnected: ${reason}`);
    });

    this.socket.on('connect_error', error => {
      console.error('[SocketService] ⚠️ Connection error:', error);
    });
  }

  connect() {
    if (!this.socket.connected) {
      console.log('[SocketService] 🚀 Connecting to socket server...');
      this.socket.connect();
    } else {
      console.log('[SocketService] 🟢 Already connected');
    }
  }

  disconnect() {
    if (this.socket.connected) {
      console.log('[SocketService] 🔌 Disconnecting from socket server...');
      this.socket.disconnect();
    } else {
      console.log('[SocketService] 🔘 Already disconnected');
    }
  }

  on(event: string, callback: (...args: any[]) => void) {
    console.log(`[SocketService] 📡 Listening on event: "${event}"`);
    this.socket.on(event, (...args) => {
      console.log(
        `[SocketService] 📨 Event "${event}" triggered with data:`,
        args,
      );
      callback(...args);
    });
  }

  emit(event: string, data: any) {
    console.log(
      `[SocketService] 🚀 Emitting event: "${event}" with data:`,
      data,
    );
    this.socket.emit(event, data);
  }

  off(event: string, callback: (...args: any[]) => void) {
    console.log(`[SocketService] ❎ Removing listener from event: "${event}"`);
    this.socket.off(event, callback);
  }

  isConnected(): boolean {
    console.log(
      `[SocketService] 🔍 Checking connection status: ${this.socket.connected}`,
    );
    return this.socket.connected;
  }
}

export const socketService = new SocketService();
