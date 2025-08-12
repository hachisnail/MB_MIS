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
    this.joinedRooms = new Set();
    this.userId = null;
    this.isGuest = false;
    this.readyCallbacks = new Set();

    // Health check state
    this.lastPongTime = Date.now();
    this.healthCheckInterval = null;
    this.healthTimeout = 10000; // 10s threshold before reconnect

    this._setupSocketListeners();
    this._startHealthCheck();
  }

  _setupSocketListeners() {
    this.socket.on("connect", () => {
      setTimeout(() => {
        if (this.userId && !this.isGuest) {
          this.socket.emit("registerUser", this.userId);
        } else {
          this.joinRoom("guestRoom");
        }

        if (!this.isGuest) {
          this.joinRoom("realtimeDB");
          for (const room of this.joinedRooms) {
            this.socket.emit("joinRoom", room);
          }
        }

        this.readyCallbacks.forEach((cb) => cb());
      }, 50);
    });

    this.socket.on("disconnect", (reason) => {
      console.warn("[Socket] Disconnected:", reason);
    });

    this.socket.on("dbChange", (payload) => this.handleDbChange(payload));

    this.socket.on("forceLogout", (data) => {
      this.handleMessage({ type: "forceLogout", ...data });
    });

    this.socket.on("message", (data) => {
      this.handleMessage(data);
    });

    // Health check pong listener
    this.socket.on("pongCheck", (serverTime) => {
      this.lastPongTime = Date.now();
      // console.log(`[Socket] PongCheck received, server time: ${serverTime}`);
    });
  }

  _startHealthCheck() {
    if (this.healthCheckInterval) clearInterval(this.healthCheckInterval);

    this.healthCheckInterval = setInterval(() => {
      const now = Date.now();

      if (!this.socket.connected) {
        console.warn("[Socket] Not connected, attempting reconnect...");
        this.socket.connect();
      } else {
        // Ask server for pong
        this.socket.emit("pingCheck");
      }

      // If no pong in last 10s, reconnect
      if (now - this.lastPongTime > this.healthTimeout) {
        console.warn("[Socket] Health check failed — forcing reconnect...");
        this.socket.disconnect();
        this.socket.connect();
      }
    }, 5000); // every 5 seconds
  }

  onReady(callback) {
    if (this.socket.connected) {
      callback();
    } else {
      this.readyCallbacks.add(callback);
    }
  }

  registerUser(userId) {
    const wasGuest = this.isGuest;
    this.userId = userId;
    this.isGuest = !userId;

    if (this.isGuest) {
      if (this.socket.connected && !this.joinedRooms.has("guestRoom")) {
        this.joinRoom("guestRoom");
      }
    } else {
      if (this.socket.connected) {
        this.socket.emit("registerUser", userId);
        this.socket.emit("joinRoom", `user:${userId}`);
        this.joinedRooms.add(`user:${userId}`);

        if (wasGuest && this.joinedRooms.has("guestRoom")) {
          this.leaveRoom("guestRoom");
        }
        if (!this.joinedRooms.has("realtimeDB")) {
          this.joinRoom("realtimeDB");
        }
      }
    }
  }

  joinRoom(roomName) {
    this.joinedRooms.add(roomName);
    if (this.socket.connected) {
      this.socket.emit("joinRoom", roomName);
    }
  }

  leaveRoom(roomName) {
    this.joinedRooms.delete(roomName);
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
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  leaveAllRooms() {
    for (const room of this.joinedRooms) {
      this.leaveRoom(room);
    }
    this.joinedRooms.clear();
  }

  onForceLogout(callback) {
    if (!this.listeners.has("forceLogout")) {
      this.listeners.set("forceLogout", new Set());
    }
    this.listeners.get("forceLogout").add(callback);
  }

  handleMessage(data) {
    if (data.type === "forceLogout" && this.listeners.has("forceLogout")) {
      for (const cb of this.listeners.get("forceLogout")) cb(data);
    }

    if (this.listeners.has("message")) {
      for (const cb of this.listeners.get("message")) {
        cb(data);
      }
    }
  }
}

export default SocketClient;
