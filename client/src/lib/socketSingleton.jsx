// /src/lib/socketSingleton.js
import SocketClient from "@/lib/socketClient";
import { getBrowserId, getTabId } from "@/lib/ids";

let socketInstance = null;
export const getSocketClient = () => {
  if (!socketInstance)
    socketInstance = createProxiedSocketClient(import.meta.env.VITE_SERVER_URL);
  return socketInstance;
};

function createProxiedSocketClient(serverUrl) {
  const bus = new BroadcastChannel("socket-bus");
  const browserId = getBrowserId();
  const tabId = getTabId();

  let isLeader = false;
  let leaderHeartbeat = Date.now();
  let heartbeatTimer = null;
  let leaderSetupDone = false;

  // keep a handle to the real client in the leader
  let leaderClient = null;

  const proxy = {
    socket: null,
    browserId,
    tabId,
    listeners: new Map(),
    joinedRooms: new Set(),
    userId: null,
    isGuest: true,
    _readyCallbacks: new Set(),
    _forceLogoutCallbacks: new Set(),
    _generic: new Map(),

    on(event, cb) {
      if (!this._generic.has(event)) this._generic.set(event, new Set());
      this._generic.get(event).add(cb);
    },
    off(event, cb) {
      this._generic.get(event)?.delete(cb);
      if (this._generic.get(event)?.size === 0) this._generic.delete(event);
    },
    emit(event, payload) {
      emitViaLeader(event, payload);
    },

    onReady(cb) {
      if (isLeader && this.socket?.connected) cb();
      this._readyCallbacks.add(cb);
    },
    offReady(cb) {
      this._readyCallbacks.delete(cb);
    },

    onForceLogout(cb) {
      this._forceLogoutCallbacks.add(cb);
    },
    offForceLogout(cb) {
      this._forceLogoutCallbacks.delete(cb);
    },

    registerUser(userId) {
      const wasGuest = this.isGuest;
      this.userId = userId;
      this.isGuest = !userId;
      if (userId) emitViaLeader("registerUser", userId);
      if (this.isGuest) {
        if (!this.joinedRooms.has("guestRoom")) this.joinRoom("guestRoom");
      } else {
        this.joinRoom(`user:${userId}`);
        if (wasGuest && this.joinedRooms.has("guestRoom"))
          this.leaveRoom("guestRoom");
        if (!this.joinedRooms.has("realtimeDB")) this.joinRoom("realtimeDB");
      }
    },

    joinRoom(room) {
      if (this.joinedRooms.has(room)) return;
      this.joinedRooms.add(room);
      emitViaLeader("joinRoom", room);
    },
    leaveRoom(room) {
      if (!this.joinedRooms.has(room)) return;
      this.joinedRooms.delete(room);
      emitViaLeader("leaveRoom", room);
    },
    sendMessage(room, message) {
      emitViaLeader("message", { room, message });
    },

    onMessage(cb) {
      if (!this.listeners.has("message"))
        this.listeners.set("message", new Set());
      this.listeners.get("message").add(cb);
    },
    offMessage(cb) {
      if (!this.listeners.has("message")) return;
      this.listeners.get("message").delete(cb);
      if (this.listeners.get("message").size === 0)
        this.listeners.delete("message");
    },

    onDbChange(model, action, cb) {
      const key = getKey(model, action);
      if (!this.listeners.has(key)) this.listeners.set(key, new Set());
      this.listeners.get(key).add(cb);
    },
    offDbChange(model, action, cb) {
      const key = getKey(model, action);
      if (this.listeners.has(key)) {
        this.listeners.get(key).delete(cb);
        if (this.listeners.get(key).size === 0) this.listeners.delete(key);
      }
    },

    // 🔧 NEW: expose rehandshake via leader
    rehandshake() {
      if (isLeader && leaderClient) {
        leaderClient.rehandshake();
      } else {
        bus.postMessage({ t: "reh" });
      }
    },

    disconnect() {
      if (isLeader && this.socket) this.socket.disconnect();
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      heartbeatTimer = null;
      this.socket = null;
      isLeader = false;
      leaderSetupDone = false;
      leaderClient = null;
    },

    leaveAllRooms() {
      for (const room of this.joinedRooms) this.leaveRoom(room);
      this.joinedRooms.clear();
    },
  };

  function getKey(m, a) {
    return `${m}:${a}`;
  }
  function dispatchDbChange({ model, action, data }) {
    const exact = getKey(model, action);
    const wild = getKey(model, "*");
    const send = (k) => {
      if (proxy.listeners.has(k)) {
        for (const cb of proxy.listeners.get(k)) cb(action, data);
      }
    };
    send(exact);
    send(wild);
  }
  function dispatchMessage(data) {
    if (proxy.listeners.has("message")) {
      for (const cb of proxy.listeners.get("message")) cb(data);
    }
  }
  function dispatchReady() {
    for (const cb of proxy._readyCallbacks) cb();
  }
  function dispatchForceLogout(data) {
    for (const cb of proxy._forceLogoutCallbacks) cb(data);
    dispatchMessage({ type: "forceLogout", ...data });
    dispatchGeneric("forceLogout", data);
  }
  function dispatchGeneric(ev, data) {
    if (proxy._generic.has(ev)) {
      for (const cb of proxy._generic.get(ev)) cb(data);
    }
  }
  function emitViaLeader(event, payload) {
    if (isLeader && proxy.socket?.connected) proxy.socket.emit(event, payload);
    else bus.postMessage({ t: "emit", event, payload });
  }

  function becomeLeader() {
    if (isLeader) return;
    isLeader = true;

    if (!leaderSetupDone) {
      leaderSetupDone = true;

      const real = new SocketClient(serverUrl, { auth: { browserId, tabId } });
      leaderClient = real; // keep for rehandshake()
      proxy.socket = real.socket;

      const forward = [
        "connect",
        "disconnect",
        "pongCheck",
        "dbChange",
        "message",
        "forceLogout",
        "socketStats",
        "socketCounts",
      ];
      forward.forEach((ev) => {
        real.socket.on(ev, (data) => {
          if (ev === "connect") {
            for (const room of proxy.joinedRooms)
              real.socket.emit("joinRoom", room);
            dispatchReady();
            dispatchGeneric("connect");
          }
          bus.postMessage({ t: "srv", ev, data });
          if (ev === "dbChange") dispatchDbChange(data);
          else if (ev === "message") dispatchMessage(data);
          else if (ev === "forceLogout") dispatchForceLogout(data);
          else dispatchGeneric(ev, data);
        });
      });
    }

    if (!heartbeatTimer) {
      heartbeatTimer = setInterval(() => {
        bus.postMessage({ t: "heartbeat", ts: Date.now() });
      }, 1000);
    }
  }

  function resignLeadership() {
    if (!isLeader) return;
    isLeader = false;
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    heartbeatTimer = null;
    if (proxy.socket) proxy.socket.disconnect();
    proxy.socket = null;
    leaderClient = null;
    leaderSetupDone = false;
  }

  bus.onmessage = (e) => {
    const msg = e.data;
    if (!msg || !msg.t) return;
    if (msg.t === "who-is-leader") {
      if (isLeader) bus.postMessage({ t: "i-am-leader" });
    } else if (msg.t === "i-am-leader") {
      leaderHeartbeat = Date.now();
    } else if (msg.t === "heartbeat") {
      leaderHeartbeat = msg.ts;
    } else if (msg.t === "emit") {
      if (isLeader && proxy.socket?.connected)
        proxy.socket.emit(msg.event, msg.payload);
    } else if (msg.t === "srv") {
      if (msg.ev === "dbChange") dispatchDbChange(msg.data);
      else if (msg.ev === "message") dispatchMessage(msg.data);
      else if (msg.ev === "forceLogout") dispatchForceLogout(msg.data);
      else if (msg.ev === "connect") dispatchReady();
      dispatchGeneric(msg.ev, msg.data);
    } else if (msg.t === "reh") {
      // 🔧 non-leader asked us to rehandshake
      if (isLeader && leaderClient) leaderClient.rehandshake();
    }
  };

  setInterval(() => {
    if (!isLeader && Date.now() - leaderHeartbeat > 2500) becomeLeader();
  }, 1000);

  bus.postMessage({ t: "who-is-leader" });
  setTimeout(() => becomeLeader(), 300);
  window.addEventListener("beforeunload", () => {
    resignLeadership();
  });

  return proxy;
}
