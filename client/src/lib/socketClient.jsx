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
      this.isGuest = false; // [GUEST SUPPORT]
      this.readyCallbacks = new Set();

      this.socket.on("connect", () => {
        // console.log("[Socket] Connected:", this.socket.id);

        setTimeout(() => {
          if (this.userId && !this.isGuest) {
            // console.log(
            //   `[Socket] Authenticated user detected. Registering userId: ${this.userId}`
            // );
            this.socket.emit("registerUser", this.userId);
          } else {
            // console.log(
            //   "[Socket] Guest mode detected. Joining guestRoom automatically."
            // );
            this.joinRoom("guestRoom");
          }

          // Always join realtimeDB for dbChange events (if you want guests to have it, else condition this)
          if (!this.isGuest) {
            this.joinRoom("realtimeDB");
          }

          // Join all other joinedRooms for authenticated users
          if (!this.isGuest) {
            for (const room of this.joinedRooms) {
              // console.log(`[Socket] Joining room: ${room}`);
              this.socket.emit("joinRoom", room);
            }
          }

          this.readyCallbacks.forEach((cb) => cb());
        }, 50);
      });

      this.socket.on("disconnect", (reason) => {
        // console.log("[Socket] Disconnected:", reason);
      });

      this.socket.on("dbChange", (payload) => this.handleDbChange(payload));

      this.socket.on("forceLogout", (data) => {
        console.warn("[Socket] Force logout received:", data);
        this.handleMessage({ type: "forceLogout", ...data }); 
      });

      this.socket.on("message", (data) => {
        // console.log("[Socket] Message received:", data);
        this.handleMessage(data);
      });
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
        // console.log(
        //   "[Socket] registerUser() called with no userId — setting mode: GUEST"
        // );
        // Join guestRoom if connected and not already joined
        if (this.socket.connected && !this.joinedRooms.has("guestRoom")) {
          this.joinRoom("guestRoom");
        }
      } else {
        // console.log(`[Socket] registerUser() called — setting userId: ${userId}`);
        if (this.socket.connected) {
          this.socket.emit("registerUser", userId);
          this.socket.emit("joinRoom", `user:${userId}`);
          this.joinedRooms.add(`user:${userId}`);
          // If previously guest, leave guestRoom
          if (wasGuest && this.joinedRooms.has("guestRoom")) {
            this.leaveRoom("guestRoom");
          }
          // Always join realtimeDB if authenticated
          if (!this.joinedRooms.has("realtimeDB")) {
            this.joinRoom("realtimeDB");
          }
        }
      }
    }

    joinRoom(roomName) {
      // console.log(`[Socket] Request to join room: ${roomName}`);
      this.joinedRooms.add(roomName);
      if (this.socket.connected) {
        this.socket.emit("joinRoom", roomName);
      }
    }

    leaveRoom(roomName) {
      // console.log(`[Socket] Request to leave room: ${roomName}`);
      this.joinedRooms.delete(roomName);
      if (this.socket.connected) {
        this.socket.emit("leaveRoom", roomName);
      }
    }

    sendMessage(roomName, message) {
      // console.log(`[Socket] Sending message to room: ${roomName}`, message);
      this.socket.emit("message", { room: roomName, message });
    }

    onDbChange(model, action, callback) {
      const key = this._getKey(model, action);
      if (!this.listeners.has(key)) {
        this.listeners.set(key, new Set());
      }
      this.listeners.get(key).add(callback);
      // console.log(`[Socket] Subscribed to dbChange: ${key}`);
    }

    offDbChange(model, action, callback) {
      const key = this._getKey(model, action);
      if (this.listeners.has(key)) {
        this.listeners.get(key).delete(callback);
        if (this.listeners.get(key).size === 0) {
          this.listeners.delete(key);
        }
      }
      // console.log(`[Socket] Unsubscribed from dbChange: ${key}`);
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

      // console.log(
      //   `[Socket] dbChange received - Model: ${model}, Action: ${action}`
      // );
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
      // console.log("[Socket] Message listener added");
    }

    offMessage(callback) {
      if (this.listeners.has("message")) {
        this.listeners.get("message").delete(callback);
        // console.log("[Socket] Message listener removed");
      }
    }

    _getKey(model, action) {
      return `${model}:${action}`;
    }

    disconnect() {
      // console.log("[Socket] Manually disconnecting socket...");
      this.socket.disconnect();
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
