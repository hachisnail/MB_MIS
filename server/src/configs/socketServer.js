// socketServer.js
import { Server as SocketIOServer } from "socket.io";
import cookie from "cookie";
import signature from "cookie-signature";
import sessionStore from "./sessionStore.js";
import ConversationController from "../controllers/conversationController.js";

let io;

export function initializeSocket(server, corsOrigins) {
  const ALLOWED_ORIGINS = Array.isArray(corsOrigins)
    ? corsOrigins
    : String(corsOrigins || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

  io = new SocketIOServer(server, {
    path: "/socket.io",
    transports: ["websocket", "polling"], // websocket preferred; polling still allowed
    cors: {
      origin: (origin, cb) => {
        if (!origin) return cb(null, true); // same-origin / server-to-server
        cb(null, ALLOWED_ORIGINS.includes(origin));
      },
      credentials: true,
      methods: ["GET", "POST", "OPTIONS"],
      allowedHeaders: ["x-browser-id", "authorization", "content-type"],
    },
    allowEIO3: false,
    connectionStateRecovery: { maxDisconnectionDuration: 60_000 },
  });

  io.engine.on("connection_error", (err) => {
    console.warn("[engine.io connection_error]", {
      code: err.code,
      message: err.message,
      context: err.context,
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
        sessionId = signature.unsign(
          sessionId.slice(2),
          process.env.SESSION_SECRET
        );
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

        socket.guestId = session?.guest_identity?.guest_id || null;

        socket.user = { id: session.userId, roleId, ...(session.user || {}) };
        next();
      });
    } catch (err) {
      console.error("[Socket Auth Error]:", err);
      return next(new Error("Internal error"));
    }
  });

  // ===== Helpers / presence / locks (unchanged from your version) =====
  function normalizeOut(saved, { type = "user" } = {}) {
    return {
      id: saved.message_id,
      conversationId: saved.conversation_id,
      text: saved.message,
      sender: {
        userId: saved.sender_user_id || null,
        guestId: saved.sender_guest_id || null,
      },
      type, // <— "user" | "system"
      status: saved.status || "sent",
      createdAt: saved.created_at,
    };
  }
  function collectSocketStats() {
    const list = [];
    for (const [id, s] of io.sockets.sockets) {
      const isGuest = s.userId === "guest" || !s.user?.id;
      list.push({
        socketId: id,
        userId: isGuest ? null : s.user?.id ?? s.userId ?? null,
        isGuest,
        rooms: [...s.rooms],
        browserId: s.browserId ?? null,
        tabId: s.tabId ?? null,
      });
    }
    return list;
  }

  function collectSocketCounts() {
    let total = 0,
      guests = 0,
      users = 0;
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
  const broadcastCounts = () => io.emit("socketCounts", collectSocketCounts());

  const presenceIndex = new Map();

  function indexKeyForViewer(socket, tabId) {
    const uid =
      socket.userId && socket.userId !== "guest"
        ? String(socket.userId)
        : "guest";
    const bid = socket.browserId || "noBrowser";
    const tid = tabId || socket.tabId || "noTab";
    return `${uid}|${bid}|${tid}`;
  }

  function viewerInfo(socket, tabId, { at, title, meta } = {}) {
    const isGuest = socket.userId === "guest" || !socket.user?.id;
    return {
      userId: isGuest ? null : socket.user?.id ?? socket.userId ?? null,
      isGuest,
      browserId: socket.browserId ?? null,
      tabId: tabId || socket.tabId || null,
      at: at || Date.now(),
      title: title ?? null,
      meta: meta ?? null,
    };
  }

  function addPresence(
    socket,
    { page, title = null, meta = null, tabId = null, at = Date.now() }
  ) {
    if (!page) return;
    if (!socket.presenceTabs) socket.presenceTabs = new Map();
    const tid = tabId || socket.tabId || "noTab";

    const prev = socket.presenceTabs.get(tid);
    if (prev?.page && presenceIndex.has(prev.page)) {
      const entry = presenceIndex.get(prev.page);
      const key = indexKeyForViewer(socket, tid);
      entry.viewers.delete(key);
      entry.count = entry.viewers.size;
      if (entry.viewers.size === 0) presenceIndex.delete(prev.page);
    }

    socket.presenceTabs.set(tid, { page, title, meta, at });

    let entry = presenceIndex.get(page);
    if (!entry) {
      entry = { count: 0, viewers: new Map(), sampleTitles: new Set() };
      presenceIndex.set(page, entry);
    }
    const key = indexKeyForViewer(socket, tid);
    entry.viewers.set(key, viewerInfo(socket, tid, { at, title, meta }));
    entry.count = entry.viewers.size;
    if (title) {
      if (entry.sampleTitles.size < 5) entry.sampleTitles.add(title);
    }
  }

  function removePresence(socket, { page = null, tabId = null } = {}) {
    if (!socket.presenceTabs) return;
    const tid = tabId || socket.tabId || "noTab";
    const prev = socket.presenceTabs.get(tid);
    if (!prev) return;

    const prevPage = page || prev.page;
    if (prevPage && presenceIndex.has(prevPage)) {
      const entry = presenceIndex.get(prevPage);
      const key = indexKeyForViewer(socket, tid);
      entry.viewers.delete(key);
      entry.count = entry.viewers.size;
      if (entry.viewers.size === 0) presenceIndex.delete(prevPage);
    }
    socket.presenceTabs.delete(tid);
  }

  function removeAllPresenceForSocket(socket) {
    if (!socket.presenceTabs) return;
    for (const [tid, info] of socket.presenceTabs) {
      if (info?.page && presenceIndex.has(info.page)) {
        const entry = presenceIndex.get(info.page);
        const key = indexKeyForViewer(socket, tid);
        entry.viewers.delete(key);
        entry.count = entry.viewers.size;
        if (entry.viewers.size === 0) presenceIndex.delete(info.page);
      }
    }
    socket.presenceTabs.clear();
  }

  function aggregatedPresenceCounts() {
    const rows = [];
    for (const [page, entry] of presenceIndex) {
      rows.push({
        page,
        count: entry.count,
        titles: Array.from(entry.sampleTitles),
      });
    }
    rows.sort((a, b) => b.count - a.count);
    return { at: Date.now(), rows };
  }

  const broadcastPresenceCounts = () => {
    io.emit("presenceCounts", aggregatedPresenceCounts());
  };

  function presenceSnapshotForAdmins() {
    const rows = [];

    for (const [page, entry] of presenceIndex) {
      // entry.viewers is Map<key, viewerInfo>
      const viewers = Array.from(entry.viewers.values()).map((v) => ({
        userId: v.userId, // null for guests
        isGuest: v.isGuest === true,
        browserId: v.browserId || null,
        tabId: v.tabId || null,
        at: v.at || Date.now(), // last activity timestamp
        title: v.title || null, // last reported document.title
        meta: v.meta || null, // any extra metadata you sent
      }));

      // optional: newest first
      viewers.sort((a, b) => (b.at || 0) - (a.at || 0));

      rows.push({
        page,
        count: entry.count,
        titles: Array.from(entry.sampleTitles),
        viewers,
      });
    }

    // show busiest pages first
    rows.sort((a, b) => b.count - a.count);

    return { at: Date.now(), rows };
  }

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
      try {
        holder.disconnect(true);
      } catch { }
      browserLocks.set(key, { socketId: socket.id, lastSeen: now });
      return true;
    }

    socket.disconnect(true);
    return false;
  }

  function releaseBrowserLock(socket) {
    const key = socket.browserId;
    if (!key) return;
    const entry = browserLocks.get(key);
    if (entry?.socketId === socket.id) browserLocks.delete(key);
  }

  function markAsGuest(s, { reason = "Logged out", silent = false } = {}) {
    try {
      if (s.userId && s.userId !== "guest") {
        s.leave(`user:${s.userId}`);
      }
      s.join("guestRoom");
      s.userId = "guest";
      s.user = null;
      s.session = null;

      removeAllPresenceForSocket(s);
      if (!silent) s.emit("forceLogout", { reason });
    } catch { }
  }

  function _forceLogoutUser(
    userId,
    { exceptBrowserId = null, reason = "Logged out from another session" } = {}
  ) {
    if (!userId) return;
    for (const [, s] of io.sockets.sockets) {
      const isSameUser =
        s.userId && s.userId !== "guest" && String(s.userId) === String(userId);
      const isExcepted = exceptBrowserId && s.browserId === exceptBrowserId;
      if (isSameUser && !isExcepted) {
        markAsGuest(s, { reason });
      }
    }
    emitSocketStatsToAdmins();
    broadcastCounts();
    broadcastPresenceCounts();
  }

  io.forceLogoutUser = _forceLogoutUser;

  io.on("connection", (socket) => {
    if (!acquireBrowserLock(socket)) return;
    markSeen(socket);

    const isAdmin =
      socket.user?.roleId === 1 ||
      socket.session?.roleId === 1 ||
      socket.session?.user?.roleId === 1 ||
      socket.session?.user?.role?.id === 1 ||
      socket.session?.user?.role_id === 1;

    if (socket.userId === "guest") {
      socket.join("guestRoom");
    } else {
      socket.join(`user:${socket.userId}`);
      if (isAdmin) {
        socket.join("adminRoom");
        socket.emit("socketStats", collectSocketStats());
      }
    }

    socket.on("joinRoom", async (roomOrObj, payload) => {
      try {
        let room;
        let meta = payload || {};

        // Support both old (string) and new (object) formats
        if (typeof roomOrObj === "string") {
          room = roomOrObj;
        } else if (roomOrObj && typeof roomOrObj === "object") {
          room = roomOrObj.room;
          meta = roomOrObj.payload || {};
        }

        if (!room) return;

        if (room.startsWith("conversation:")) {
          const convId = room.replace("conversation:", "");
          const convo = await ConversationController.getById(convId);
          if (!convo) {
            console.warn(`[Socket] Conversation ${convId} not found`);
            return;
          }

          if (socket.userId === "guest") {
            if (String(convo.contribution_id) === String(meta.contributionId)) {
              socket.guestId = meta.guestId;
              socket.join(room);
              console.log(`[Socket] Guest ${socket.guestId} joined ${room}`);
            } else {
              console.warn(`[Socket] Guest denied joining ${room}`);
            }
            return;
          }

          socket.join(room);
          return;
        }

        socket.join(room);
      } catch (err) {
        console.error("[Socket] joinRoom error:", err);
      }
    });

    socket.on("clientSystemNote", async (payload = {}) => {
      try {
        // only verified guests (you already set guestId on join)
        if (socket.userId !== "guest" || !socket.guestId) {
          console.warn("[clientSystemNote] blocked: not a verified guest");
          return;
        }

        const { room, text = "", meta = null } = payload;
        if (!room || !text.trim()) return;

        // must be the donor's own conversation room
        const conversationId = room.replace("conversation:", "");

        // persist as a SYSTEM message (no sender ids -> system)
        const saved = await ConversationController.createMessage({
          conversationId,
          senderUserId: null,
          senderGuestId: null,
          text: text.trim(),
          type: "system",
          meta: { source: "guest_form", guestId: socket.guestId, ...(meta || {}) },
        });

        // normalized emitter (as in your previous helper)
        const out = {
          id: saved.message_id,
          conversationId: saved.conversation_id,
          text: saved.message,
          sender: { userId: null, guestId: null },
          type: "system",
          status: saved.status || "sent",
          createdAt: saved.created_at,
        };

        io.to(room).emit("message", out);
      } catch (err) {
        console.error("[Socket] clientSystemNote error:", err);
      }
    });


    socket.on("leaveRoom", (room) => {
      if (socket.rooms.has(room)) {
        socket.leave(room);
      }
    });

    socket.on("registerUser", (userId) => {
      if (!userId) return;
      if (!socket.userId || socket.userId === "guest") return;
      if (String(userId) === String(socket.userId)) {
        const room = `user:${userId}`;
        if (!socket.rooms.has(room)) socket.join(room);
        if (isAdmin) socket.join("adminRoom");
      }
    });

    // socket.on("message", ({ room, message }) => {
    //   socket.to(room).emit("message", message);
    // });

    socket.on("message", async (payload) => {
      if (socket.userId === "guest" && !socket.guestId) {
        console.warn("Blocked guest message without OTP verification");
        return;
      }
      try {
        const { room } = payload;
        const conversationId = room.replace("conversation:", "");

        // 🔑 Normalize text regardless of shape
        const text =
          typeof payload.message === "object" && payload.message?.text
            ? payload.message.text
            : payload.text || "";

        if (!text.trim()) return; // ignore empty

        // persist to DB
        const saved = await ConversationController.createMessage({
          conversationId,
          senderUserId: socket.userId !== "guest" ? socket.userId : null,
          senderGuestId: socket.userId === "guest" ? socket.guestId : null,
          text,
          type: "user", // <— NEW (safe if model doesn’t have column)
        });

        io.to(room).emit("message", normalizeOut(saved, { type: "user" }));
      } catch (err) {
        console.error("[Socket] message persistence error:", err);
        socket.emit("message:error", { room: payload.room, error: "Failed to persist message" });
      }
    });

    // ✅ NEW: allow admins to push system messages over the socket
    socket.on("systemMessage", async (payload = {}) => {
      try {
        if (!isAdmin) return; // only admins
        const { room, text = "", meta = null } = payload;
        if (!room || !text.trim()) return;

        const conversationId = room.replace("conversation:", "");
        const saved = await ConversationController.createMessage({
          conversationId,
          senderUserId: null,
          senderGuestId: null,
          text: text.trim(),
          type: "system",
          meta: meta ?? null,
        });

        io.to(room).emit("message", normalizeOut(saved, { type: "system" }));
      } catch (err) {
        console.error("[Socket] systemMessage error:", err);
      }
    });

    socket.on("pingCheck", () => {
      markSeen(socket);
      socket.emit("pongCheck", Date.now());
    });

    // Presence
    socket.on("presence:update", (payload) => {
      try {
        markSeen(socket);
        const { page, title, meta, tabId, at } = payload || {};
        if (typeof page !== "string" || !page.trim()) return;
        addPresence(socket, {
          page: page.trim(),
          title: title || null,
          meta: meta || null,
          tabId,
          at: at || Date.now(),
        });
        broadcastPresenceCounts();
      } catch (e) {
        console.warn("[presence:update] error", e);
      }
    });

    socket.on("presence:leave", (payload = {}) => {
      try {
        const { page, tabId } = payload;
        removePresence(socket, { page: page || null, tabId: tabId || null });
        broadcastPresenceCounts();
      } catch (e) {
        console.warn("[presence:leave] error", e);
      }
    });

    socket.on("requestPresenceSnapshot", () => {
      if (!isAdmin) return;
      socket.emit("presenceSnapshot", presenceSnapshotForAdmins());
    });

    socket.on("requestSocketStats", () => {
      if (!isAdmin) return;
      socket.emit("socketStats", collectSocketStats());
    });

    socket.on("requestSocketCounts", () => {
      socket.emit("socketCounts", collectSocketCounts());
    });

    socket.on("disconnect", () => {
      removeAllPresenceForSocket(socket);
      releaseBrowserLock(socket);
      emitSocketStatsToAdmins();
      broadcastCounts();
      broadcastPresenceCounts();
    });

    // initial push
    emitSocketStatsToAdmins();
    broadcastCounts();
    broadcastPresenceCounts();
  });
  io.sendSystemMessage = async (conversationId, text, { meta = null, persist = true } = {}) => {
    try {
      const room = `conversation:${conversationId}`;
      let out;

      if (persist) {
        const saved = await ConversationController.createMessage({
          conversationId,
          senderUserId: null,
          senderGuestId: null,
          text: String(text || "").trim(),
          type: "system",
          meta,
        });
        out = normalizeOut(saved, { type: "system" });
      } else {
        // ephemeral system notice (not persisted)
        out = {
          id: `sys-${Date.now()}`,
          conversationId,
          text: String(text || "").trim(),
          sender: { userId: null, guestId: null },
          type: "system",
          status: "sent",
          createdAt: new Date().toISOString(),
        };
      }

      if (!out.text) return;
      io.to(room).emit("message", out);
      return out;
    } catch (e) {
      console.error("[io.sendSystemMessage] error", e);
      return null;
    }
  };


  setInterval(() => {
    emitSocketStatsToAdmins();
    broadcastCounts();
    broadcastPresenceCounts();
  }, 15000);

  return io;
}

export function getIO() {
  if (!io) throw new Error("Socket.io not initialized!");
  return io;
}

export function forceLogoutUser(userId, opts) {
  if (!io?.forceLogoutUser) return;
  io.forceLogoutUser(userId, opts);
}

export async function sendSystemMessage(conversationId, text, opts) {
  if (!io?.sendSystemMessage) throw new Error("Socket.io not initialized!");
  return io.sendSystemMessage(conversationId, text, opts);
}
