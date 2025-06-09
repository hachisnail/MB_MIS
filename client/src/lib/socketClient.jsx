import { io } from "socket.io-client";

class SocketClient {
  constructor(serverUrl, options = {}) {
    this.socket = io(serverUrl, { withCredentials: true, ...options });
    this.listeners = new Map();

    this.socket.on("connect", () => {
      console.log("Socket connected:", this.socket.id);
    });

    this.socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
    });

    this.socket.on("dbChange", (payload) => {
      // console.log("dbchange");
      this.handleDbChange(payload);
    });
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
    if (this.listeners.has(exactKey)) {
      for (const cb of this.listeners.get(exactKey)) {
        cb(data);
      }
    }

    const wildcardKey = this._getKey(model, "*");
    if (this.listeners.has(wildcardKey)) {
      for (const cb of this.listeners.get(wildcardKey)) {
        cb(action, data);
      }
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
