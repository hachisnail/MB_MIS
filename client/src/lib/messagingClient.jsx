// src/lib/messagingClient.js
import { getSocketClient } from "./socketSingleton";
import { mapMessageToLane } from "../utils/messageUtils";

class MessagingClient {
  constructor() {
    this.socket = getSocketClient();
    this._joinedRooms = new Map(); // room -> { guestId, contributionId }
    this._handlers = new Set();
    this._outbox = []; // [{event, data}]

    this._bindSocketEvents();
  }

  /* ======================= socket lifecycle ======================= */

  _bindSocketEvents() {
    const s = this.socket;
    const on = s.on?.bind(s);
    const off = s.off?.bind(s);

    const onConnect = (cb) =>
      s.onConnect ? s.onConnect(cb) : on && on("connect", cb);
    const onReconnect = (cb) =>
      s.onReconnect
        ? s.onReconnect(cb)
        : (s.io && s.io.on && s.io.on("reconnect", cb)) ||
          (on && on("reconnect", cb));

    onConnect(() => {
      this._rejoinAll();
      this._flushOutbox();
    });

    onReconnect(() => {
      this._rejoinAll();
      this._flushOutbox();
    });

    // Optional: observe disconnect/errors for logging
    on && on("disconnect", (reason) => {
      // keep state; we'll rejoin/flush when we reconnect
      if (process.env.NODE_ENV !== "production") {
        console.debug("[MessagingClient] disconnect:", reason);
      }
    });
    on && on("connect_error", (err) => {
      if (process.env.NODE_ENV !== "production") {
        console.debug("[MessagingClient] connect_error:", err?.message || err);
      }
    });
  }

  _rejoinAll() {
    for (const [room, payload] of this._joinedRooms.entries()) {
      this._join(room, payload);
    }
  }

  _join(room, payload) {
    try {
      if (this.socket.joinRoom) {
        this.socket.joinRoom(room, payload);
      } else {
        this.socket.emit("joinRoom", { room, payload });
      }
    } catch (e) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[MessagingClient] join failed:", e);
      }
    }
  }

  _send(event, data) {
    const packet = { ...data };
    if (this.isConnected()) {
      this.socket.emit(event, packet);
    } else {
      this._outbox.push({ event, data: packet });
    }
  }

  _flushOutbox() {
    while (this._outbox.length > 0 && this.isConnected()) {
      const { event, data } = this._outbox.shift();
      this.socket.emit(event, data);
    }
  }

  /* ======================= public API ======================= */

  // connection state
  isConnected() {
    const s = this.socket;
    return !!(s?.connected || s?.socket?.connected || s?.io?.connected);
  }

  onConnect(cb) {
    if (this.socket.onConnect) this.socket.onConnect(cb);
    else this.socket.on?.("connect", cb);
  }

  onReconnect(cb) {
    if (this.socket.onReconnect) this.socket.onReconnect(cb);
    else this.socket.io?.on?.("reconnect", cb);
  }

  // rooms
  joinConversation(conversationId, { guestId = null, contributionId = null } = {}) {
    const room = `conversation:${conversationId}`;
    const payload = { guestId, contributionId };
    if (!this._joinedRooms.has(room)) {
      this._joinedRooms.set(room, payload);
    } else {
      // update payload in case guestId/contributionId changed
      this._joinedRooms.set(room, payload);
    }

    if (this.isConnected()) {
      this._join(room, payload);
    }
  }

  leaveConversation(conversationId) {
    const room = `conversation:${conversationId}`;
    if (!this._joinedRooms.has(room)) return;
    try {
      if (this.socket.leaveRoom) this.socket.leaveRoom(room);
      else this.socket.emit("leaveRoom", room);
    } finally {
      this._joinedRooms.delete(room);
    }
  }

  // sending
  sendUserMessage(conversationId, text, extra = {}) {
    const room = `conversation:${conversationId}`;
    this._send("message", {
      room,
      text: String(text || "").trim(),
      ...extra,
    });
  }

// send a guest-safe "system-like" note (queued if offline)
sendClientSystemNote(conversationId, text, meta = null) {
  const room = `conversation:${conversationId}`;
  this._send("clientSystemNote", {
    room,
    text: String(text || "").trim(),
    meta,
  });
}


  // only for admins; server will authorize again
  sendSystemMessage(conversationId, text, meta = null) {
    const room = `conversation:${conversationId}`;
    this._send("systemMessage", {
      room,
      text: String(text || "").trim(),
      meta,
    });
  }

  // receiving
  onMessage(cb) {
    const handler = (raw) => {
      const normalized = {
        message_id: raw.message_id ?? raw.id ?? null,
        conversation_id: raw.conversation_id ?? raw.conversationId ?? null,
        sender_user_id: raw.sender_user_id ?? raw.sender?.userId ?? null,
        sender_guest_id: raw.sender_guest_id ?? raw.sender?.guestId ?? null,
        message: raw.message ?? raw.text ?? "",
        type: raw.type || null,
        status: raw.status ?? "sent",
        created_at: raw.created_at ?? raw.createdAt ?? new Date().toISOString(),
      };
      cb(normalized);
    };

    if (this.socket.onMessage) this.socket.onMessage(handler);
    else this.socket.on?.("message", handler);

    this._handlers.add(handler);
    return () => this.offMessage(handler);
  }

  offMessage(handler) {
    if (this.socket.offMessage) this.socket.offMessage(handler);
    else this.socket.off?.("message", handler);
    this._handlers.delete(handler);
  }
  

  dispose() {
    for (const h of this._handlers) this.offMessage(h);
    this._handlers.clear();
    for (const room of [...this._joinedRooms.keys()]) {
      this.leaveConversation(room.replace("conversation:", ""));
    }
    this._outbox = [];
  }
}

let singleton;
export function getMessagingClient() {
  if (!singleton) singleton = new MessagingClient();
  return singleton;
}

// optional: one-liners the UI can use
export function toTimelineItem(msg, currentUser) {
  return mapMessageToLane(msg, currentUser);
}
