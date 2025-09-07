// socketServer.js
import { Server as SocketIOServer } from "socket.io";
import cookie from "cookie";
import signature from "cookie-signature";
import sessionStore from "./sessionStore.js";

let io;

export function initializeSocket(server, corsOrigin) {
  io = new SocketIOServer(server, {
    cors: { origin: corsOrigin, credentials: true },
    connectionStateRecovery: { maxDisconnectionDuration: 60_000 },
  });

  io.engine.on("connection_error", (err) => {
    console.warn("[engine.io connection_error]", {
      code: err.code, message: err.message, context: err.context,
    });
  });

  // ===== Auth / tagging =====
  io.use(async (socket, next) => {
    try {
      const { browserId, tabId } = socket.handshake.auth || {};
      socket.browserId = typeof browserId === "string" ? browserId : null;
      socket.tabId = typeof tabId === "string" ? tabId : null;

      const rawCookie = socket.handshake.headers.cookie;
      if (!rawCookie) {
        socket.userId = "guest";
        socket.sessionId = null;
        socket.session = null;
        socket.user = null;
        return next();
      }

      const cookies = cookie.parse(rawCookie);
      let sessionId = cookies["connect.sid"];
      if (!sessionId) {
        socket.userId = "guest";
        socket.sessionId = null;
        socket.session = null;
        socket.user = null;
        return next();
      }

      if (sessionId.startsWith("s:")) {
        sessionId = signature.unsign(sessionId.slice(2), process.env.SESSION_SECRET);
      }
      if (!sessionId) {
        socket.userId = "guest";
        socket.sessionId = null;
        socket.session = null;
        socket.user = null;
        return next();
      }

      socket.sessionId = sessionId;

      sessionStore.get(sessionId, (err, session) => {
        if (err || !session?.userId) {
          socket.userId = "guest";
          socket.session = null;
          socket.user = null;
          return next();
        }

        const roleId =
          session.roleId ??
          session.user?.roleId ??
          session.user?.role?.id ??
          session.user?.role_id ??
          null;

        socket.session = session;
        socket.userId = session.userId;
        socket.user = { id: session.userId, roleId, ...(session.user || {}) };
        next();
      });
    } catch (err) {
      console.error("[Socket Auth Error]:", err);
      return next(new Error("Internal error"));
    }
  });

  // ===== Helpers =====
  function collectSocketStats() {
    const list = [];
    for (const [id, s] of io.sockets.sockets) {
      const isGuest = s.userId === "guest" || !s.user?.id;
      list.push({
        socketId: id,
        userId: isGuest ? null : (s.user?.id ?? s.userId ?? null),
        isGuest,
        rooms: [...s.rooms],
        browserId: s.browserId ?? null,
        tabId: s.tabId ?? null,
      });
    }
    return list;
  }

  function collectSocketCounts() {
    let total = 0, guests = 0, users = 0;
    const browsers = new Set();
    for (const [, s] of io.sockets.sockets) {
      total++;
      if (s.userId === "guest" || !s.user?.id) guests++;
      else users++;
      if (s.browserId) browsers.add(s.browserId);
    }
    return { total, guests, users, browsers: browsers.size, at: Date.now() };
  }

  const emitSocketStatsToAdmins = () =>
    io.to("adminRoom").emit("socketStats", collectSocketStats());
  const broadcastCounts = () =>
    io.emit("socketCounts", collectSocketCounts());

  // ===== Browser lock =====
  const browserLocks = new Map(); // browserId -> { socketId, lastSeen }
  const STALE_MS = 30_000;

  function markSeen(socket) {
    if (!socket.browserId) return;
    const entry = browserLocks.get(socket.browserId);
    if (entry && entry.socketId === socket.id) entry.lastSeen = Date.now();
  }

  function acquireBrowserLock(socket) {
    const key = socket.browserId;
    if (!key) return true;

    const entry = browserLocks.get(key);
    const now = Date.now();

    if (!entry) {
      browserLocks.set(key, { socketId: socket.id, lastSeen: now });
      return true;
    }

    const holder = io.sockets.sockets.get(entry.socketId);
    if (!holder) {
      browserLocks.set(key, { socketId: socket.id, lastSeen: now });
      return true;
    }

    const stale = now - entry.lastSeen > STALE_MS || holder.disconnected;
    if (stale) {
      console.log(`[BrowserLock] Preempting STALE old=${entry.socketId} with new=${socket.id} for browser=${key}`);
      try { holder.disconnect(true); } catch {}
      browserLocks.set(key, { socketId: socket.id, lastSeen: now });
      return true;
    }

    console.log(`[BrowserLock] Rejecting NEW (healthy holder) for browser=${key} (existing=${entry.socketId}, new=${socket.id}, userId=${socket.userId}, tabId=${socket.tabId})`);
    socket.disconnect(true);
    return false;
  }

  function releaseBrowserLock(socket) {
    const key = socket.browserId;
    if (!key) return;
    const entry = browserLocks.get(key);
    if (entry?.socketId === socket.id) browserLocks.delete(key);
  }

  // ===== Downgrade a socket to guest (used by forceLogoutUser) =====
  function markAsGuest(s, { reason = "Logged out", silent = false } = {}) {
    try {
      if (s.userId && s.userId !== "guest") {
        s.leave(`user:${s.userId}`);
      }
      s.join("guestRoom");
      s.userId = "guest";
      s.user = null;
      s.session = null;
      if (!silent) s.emit("forceLogout", { reason });
    } catch {}
  }

  // ===== Force logout utility (exported) =====
  function _forceLogoutUser(userId, { exceptBrowserId = null, reason = "Logged out from another session" } = {}) {
    if (!userId) return;
    for (const [, s] of io.sockets.sockets) {
      const isSameUser = s.userId && s.userId !== "guest" && String(s.userId) === String(userId);
      const isExcepted = exceptBrowserId && s.browserId === exceptBrowserId;
      if (isSameUser && !isExcepted) {
        // downgrade to guest and notify
        markAsGuest(s, { reason });
      }
    }
    emitSocketStatsToAdmins();
    broadcastCounts();
  }

  // expose for HTTP routes
  io.forceLogoutUser = _forceLogoutUser;

  // ===== Main connection handler =====
  io.on("connection", (socket) => {
    if (!acquireBrowserLock(socket)) return;
    markSeen(socket);

    console.log(`Socket connected: ${socket.id} | userId=${socket.userId} | browserId=${socket.browserId} | tabId=${socket.tabId}`);

    const isAdmin =
      socket.user?.roleId === 1 ||
      socket.session?.roleId === 1 ||
      socket.session?.user?.roleId === 1 ||
      socket.session?.user?.role?.id === 1 ||
      socket.session?.user?.role_id === 1;

    if (socket.userId === "guest") {
      socket.join("guestRoom");
      console.log(`Guest socket ${socket.id} joined guestRoom`);
    } else {
      socket.join(`user:${socket.userId}`);
      if (isAdmin) {
        socket.join("adminRoom");
        socket.emit("socketStats", collectSocketStats());
      }
    }

    socket.on("joinRoom", (room) => {
      if (!socket.rooms.has(room)) {
        socket.join(room);
        console.log(`Socket ${socket.id} joined room ${room}`);
      }
    });

    socket.on("leaveRoom", (room) => {
      if (socket.rooms.has(room)) {
        socket.leave(room);
        console.log(`Socket ${socket.id} left room ${room}`);
      }
    });

    socket.on("registerUser", (userId) => {
      if (!userId) return;
      if (!socket.userId || socket.userId === "guest") {
        console.warn(`[registerUser] Guest or unauthenticated socket ${socket.id} cannot register userId`);
        return;
      }
      if (String(userId) === String(socket.userId)) {
        const room = `user:${userId}`;
        if (!socket.rooms.has(room)) socket.join(room);
        console.log(`registerUser confirmed: ${socket.id} joined ${room}`);
        if (isAdmin) socket.join("adminRoom");
      } else {
        console.warn(`registerUser mismatch: tried ${userId}, actual ${socket.userId}`);
      }
    });

    socket.on("message", ({ room, message }) => {
      socket.to(room).emit("message", message);
    });

    socket.on("pingCheck", () => {
      markSeen(socket);
      socket.emit("pongCheck", Date.now());
    });

    // Admin-only detailed stats
    socket.on("requestSocketStats", () => {
      if (!isAdmin) {
        console.warn(`[SocketStats] Unauthorized request by ${socket.id}`);
        return;
      }
      socket.emit("socketStats", collectSocketStats());
    });

    // Public counts (anyone can request)
    socket.on("requestSocketCounts", () => {
      socket.emit("socketCounts", collectSocketCounts());
    });

    socket.on("disconnect", () => {
      releaseBrowserLock(socket);
      emitSocketStatsToAdmins();
      broadcastCounts();
    });

    // push on connect
    emitSocketStatsToAdmins();
    broadcastCounts();
  });

  // periodic pushes
  setInterval(() => {
    emitSocketStatsToAdmins();
    broadcastCounts();
  }, 15000);

  return io;
}

export function getIO() {
  if (!io) throw new Error("Socket.io not initialized!");
  return io;
}

// exported helper for HTTP routes
export function forceLogoutUser(userId, opts) {
  if (!io?.forceLogoutUser) return;
  io.forceLogoutUser(userId, opts);
}
