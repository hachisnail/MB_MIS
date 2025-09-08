// /src/lib/socketClient.js
import { io } from "socket.io-client";
import { getBrowserId, getTabId } from "@/lib/ids";

class SocketClient {
  constructor(serverUrl, options = {}) {
    this.browserId = getBrowserId();
    this.tabId = getTabId();

    this.socket = io(serverUrl, {
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      transports: ["websocket", "polling"],
      upgrade: true,
      rememberUpgrade: true,
      auth: { browserId: this.browserId, tabId: this.tabId },
      ...options,
    });

    this.listeners = new Map();
    this.joinedRooms = new Set();
    this.userId = null;
    this.isGuest = false;

    this.readyCallbacks = new Set();
    this.forceLogoutCallbacks = new Set();

    this.lastPongTime = Date.now();
    this.healthCheckInterval = null;
    this.healthTimeout = 15000;

    this._setupSocketListeners();
    this._startHealthCheck();
  }

  // ---- Room derivation & syncing (atomic) ----
  _desiredRooms() {
    const desired = new Set();
    if (this.isGuest) {
      desired.add("guestRoom");
    } else if (this.userId) {
      desired.add(`user:${this.userId}`);
      desired.add("realtimeDB");
    }
    return desired;
  }

  _applyRoomsToServer(desired) {
    // Leave anything not desired
    for (const room of Array.from(this.joinedRooms)) {
      if (!desired.has(room)) {
        this.joinedRooms.delete(room);
        if (this.socket.connected) this.socket.emit("leaveRoom", room);
      }
    }
    // Join anything missing
    for (const room of desired) {
      if (!this.joinedRooms.has(room)) {
        this.joinedRooms.add(room);
        if (this.socket.connected) this.socket.emit("joinRoom", room);
      }
    }
  }

  _syncRooms() {
    const desired = this._desiredRooms();
    this._applyRoomsToServer(desired);
  }

  // 🔧 force a new Engine.IO handshake so server re-reads cookies
  rehandshake() {
    try {
      this.socket.auth = { browserId: this.browserId, tabId: this.tabId };
      if (this.socket.connected) {
        this.socket.disconnect();
      }
      setTimeout(() => this.socket.connect(), 30);
    } catch (e) {
      console.warn("[Socket] rehandshake error:", e);
    }
  }

  _setupSocketListeners() {
    this.socket.on("connect_error", (err) => {
      console.warn("[Socket] connect_error:", err?.message || err);
    });
    this.socket.on("error", (err) => {
      console.warn("[Socket] error:", err);
    });

    this.socket.on("connect", () => {
      setTimeout(() => {
        // Register first (if user), then sync rooms in one atomic diff
        if (this.userId && !this.isGuest) {
          this.socket.emit("registerUser", this.userId);
        } else {
          // Explicitly clear any server-side user context
          this.socket.emit("registerUser", null);
        }
        this._syncRooms();
        this.readyCallbacks.forEach((cb) => cb());
      }, 20);
    });

    this.socket.on("disconnect", (reason) => {
      console.warn("[Socket] Disconnected:", reason);
    });

    this.socket.on("dbChange", (payload) => this.handleDbChange(payload));

    this.socket.on("forceLogout", (data) => {
      // Flip to guest immediately and atomically sync rooms
      this.userId = null;
      this.isGuest = true;

      if (this.socket.connected) this.socket.emit("registerUser", null);
      this._syncRooms();

      this.handleMessage({ type: "forceLogout", ...data });
      this.forceLogoutCallbacks.forEach((cb) => cb(data));
    });

    this.socket.on("message", (data) => this.handleMessage(data));

    this.socket.on("socketStats", (p) => this._emitLocal("socketStats", p));
    this.socket.on("socketCounts", (p) => this._emitLocal("socketCounts", p));

    this.socket.on("pongCheck", () => {
      this.lastPongTime = Date.now();
    });
  }

  _startHealthCheck() {
    if (this.healthCheckInterval) clearInterval(this.healthCheckInterval);
    this.healthCheckInterval = setInterval(() => {
      const now = Date.now();
      if (this.socket.connected) this.socket.emit("pingCheck");
      if (now - this.lastPongTime > this.healthTimeout) {
        console.warn("[Socket] Health check lagging (no pong yet).");
      }
    }, 5000);
  }

  // local event bus (unchanged)
  on(event, handler) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event).add(handler);
  }
  off(event, handler) {
    if (!this.listeners.has(event)) return;
    this.listeners.get(event).delete(handler);
    if (this.listeners.get(event).size === 0) this.listeners.delete(event);
  }
  _emitLocal(event, payload) {
    if (!this.listeners.has(event)) return;
    for (const cb of this.listeners.get(event)) cb(payload);
  }

  onReady(callback) {
    if (this.socket.connected) callback();
    else this.readyCallbacks.add(callback);
  }
  offReady(callback) {
    this.readyCallbacks.delete(callback);
  }

  onForceLogout(callback) {
    this.forceLogoutCallbacks.add(callback);
  }
  offForceLogout(callback) {
    this.forceLogoutCallbacks.delete(callback);
  }

  registerUser(userId) {
    this.userId = userId || null;
    this.isGuest = !userId;

    if (this.socket.connected) {
      this.socket.emit("registerUser", this.userId || null);
      this._syncRooms();
    }
    // Not connected: rooms will sync on connect.
  }

  joinRoom(roomName) {
    // Guards against illegal/system rooms from external callers
    if (roomName === "guestRoom" && !this.isGuest) {
      // ensure we’re not in it (defensive)
      if (this.joinedRooms.has("guestRoom")) {
        this.joinedRooms.delete("guestRoom");
        if (this.socket.connected) this.socket.emit("leaveRoom", "guestRoom");
      }
      return;
    }
    if (roomName.startsWith("user:")) {
      if (this.isGuest) return;
      if (!this.userId || roomName !== `user:${this.userId}`) return;
    }

    if (this.joinedRooms.has(roomName)) return;
    this.joinedRooms.add(roomName);
    if (this.socket.connected) this.socket.emit("joinRoom", roomName);
  }

  leaveRoom(roomName) {
    if (!this.joinedRooms.has(roomName)) return;
    this.joinedRooms.delete(roomName);
    if (this.socket.connected) this.socket.emit("leaveRoom", roomName);
  }

  sendMessage(roomName, message) {
    this.socket.emit("message", { room: roomName, message });
  }

  onDbChange(model, action, callback) {
    const key = this._getKey(model, action);
    if (!this.listeners.has(key)) this.listeners.set(key, new Set());
    this.listeners.get(key).add(callback);
  }
  offDbChange(model, action, callback) {
    const key = this._getKey(model, action);
    if (!this.listeners.has(key)) return;
    this.listeners.get(key).delete(callback);
    if (this.listeners.get(key).size === 0) this.listeners.delete(key);
  }

  handleDbChange({ model, action, data }) {
    const exactKey = this._getKey(model, action);
    const wildcardKey = this._getKey(model, "*");
    const notify = (key) => {
      if (this.listeners.has(key)) {
        for (const cb of this.listeners.get(key)) cb(action, data);
      }
    };
    notify(exactKey);
    notify(wildcardKey);
  }

  _getKey(model, action) {
    return `${model}:${action}`;
  }

  disconnect() {
    this.socket.disconnect();
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  leaveAllRooms() {
    for (const room of this.joinedRooms) this.leaveRoom(room);
    this.joinedRooms.clear();
  }

  handleMessage(data) {
    if (this.listeners.has("message")) {
      for (const cb of this.listeners.get("message")) cb(data);
    }
  }
}

export default SocketClient;
