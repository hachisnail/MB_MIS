import { io } from "socket.io-client";

class SocketClient {
  constructor(serverUrl, options = {}) {
    this.socket = io(serverUrl, {
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      ...options,
    });

    this.listeners = new Map();

    this.socket.on("connect", () => {
      console.log("[Socket] Connected:", this.socket.id);
    });

    this.socket.on("disconnect", (reason) => {
      console.log("[Socket] Disconnected:", reason);
    });

    this.socket.on("dbChange", (payload) => this.handleDbChange(payload));

    this.socket.on("forceLogout", (data) => {
      console.warn("[Socket] Force logout received:", data);
    });

    this.socket.on("message", (data) => {
      console.log("[Socket] Message received:", data);
      this.handleMessage(data);
    });
  }

  registerUser(userId) {
    if (!userId) return;
    if (this.socket.connected) {
      this.socket.emit("registerUser", userId);
    } else {
      this.socket.once("connect", () => {
        this.socket.emit("registerUser", userId);
      });
    }
  }

  joinRoom(roomName) {
    if (this.socket.connected) {
      this.socket.emit("joinRoom", roomName);
    } else {
      this.socket.once("connect", () => {
        this.socket.emit("joinRoom", roomName);
      });
    }
  }

  leaveRoom(roomName) {
    if (this.socket.connected) {
      this.socket.emit("leaveRoom", roomName);
    }
  }

  sendMessage(roomName, message) {
    this.socket.emit("message", { room: roomName, message });
  }

  onDbChange(model, action, callback) {
    const key = this._getKey(model, action);
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key).add(callback);
  }

  offDbChange(model, action, callback) {
    const key = this._getKey(model, action);
    if (this.listeners.has(key)) {
      this.listeners.get(key).delete(callback);
      if (this.listeners.get(key).size === 0) {
        this.listeners.delete(key);
      }
    }
  }

  handleDbChange({ model, action, data }) {
    const exactKey = this._getKey(model, action);
    const wildcardKey = this._getKey(model, "*");

    const notify = (key) => {
      if (this.listeners.has(key)) {
        for (const cb of this.listeners.get(key)) {
          cb(action, data);
        }
      }
    };

    notify(exactKey);
    notify(wildcardKey);
  }

  handleMessage(data) {
    if (this.listeners.has("message")) {
      for (const cb of this.listeners.get("message")) {
        cb(data);
      }
    }
  }

  onMessage(callback) {
    if (!this.listeners.has("message")) {
      this.listeners.set("message", new Set());
    }
    this.listeners.get("message").add(callback);
  }

  offMessage(callback) {
    if (this.listeners.has("message")) {
      this.listeners.get("message").delete(callback);
    }
  }

  _getKey(model, action) {
    return `${model}:${action}`;
  }

  disconnect() {
    this.socket.disconnect();
  }
}

export default SocketClient;
