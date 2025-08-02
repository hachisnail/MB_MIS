import { Server as SocketIOServer } from "socket.io";
import cookie from "cookie";
import signature from "cookie-signature";
import sessionStore from "./sessionStore.js";

let io;

export function initializeSocket(server, corsOrigin) {
  io = new SocketIOServer(server, {
    cors: {
      origin: corsOrigin,
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const rawCookie = socket.handshake.headers.cookie;
      if (!rawCookie) {
        // No cookie, treat as guest connection
        socket.userId = "guest";
        socket.session = null;
        return next();
      }

      const cookies = cookie.parse(rawCookie);
      let sessionId = cookies["connect.sid"];
      if (!sessionId) {
        // No session ID cookie, treat as guest connection
        socket.userId = "guest";
        socket.session = null;
        return next();
      }

      if (sessionId.startsWith("s:")) {
        sessionId = signature.unsign(
          sessionId.slice(2),
          process.env.SESSION_SECRET
        );
      }

      if (!sessionId) {
        // Invalid session, treat as guest
        socket.userId = "guest";
        socket.session = null;
        return next();
      }

      sessionStore.get(sessionId, (err, session) => {
        if (err || !session?.userId) {
          // Invalid or missing session, treat as guest
          socket.userId = "guest";
          socket.session = null;
          return next();
        }

        socket.session = session;
        socket.userId = session.userId;
        next();
      });
    } catch (err) {
      console.error("[Socket Auth Error]:", err);
      return next(new Error("Internal error"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id} | userId=${socket.userId}`);

    if (socket.userId === "guest") {
      socket.join("guestRoom");
      console.log(`Guest socket ${socket.id} joined guestRoom`);
    } else {
      socket.join(`user:${socket.userId}`);
    }

    // Allow user to join other rooms dynamically (e.g., DMs, alerts, group chat)
    socket.on("joinRoom", (room) => {
      socket.join(room);
      console.log(`Socket ${socket.id} joined room ${room}`);
    });

    socket.on("leaveRoom", (room) => {
      socket.leave(room);
      console.log(`Socket ${socket.id} left room ${room}`);
    });

    socket.on("registerUser", (userId) => {
      if (!socket.userId || socket.userId === "guest") {
        console.warn(
          `[registerUser] Guest or unauthenticated socket ${socket.id} cannot register userId`
        );
        return;
      }

      if (userId === socket.userId) {
        socket.join(`user:${userId}`);
        console.log(
          `registerUser confirmed: ${socket.id} joined user:${userId}`
        );
      } else {
        console.warn(
          `registerUser mismatch: tried ${userId}, actual ${socket.userId}`
        );
      }
    });

    // Messaging between users or rooms
    socket.on("message", ({ room, message }) => {
      console.log(`Message to [${room}]:`, message);
      socket.to(room).emit("message", message);
    });

    // Ping-pong check
    socket.on("pingCheck", () => {
      socket.emit("pongCheck", Date.now());
    });

    // Disconnect
    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });

    // Make sure socket.user is populated properly
    socket.on("requestSocketStats", () => {
      // Check if the user is an admin (roleId === 1)
      const user = socket.user;
      if (!user || user.roleId !== 1) {
        console.warn(
          `[SocketStats] Unauthorized request by socket: ${socket.id}`
        );
        return; // Only allow admins
      }

      // Array to hold socket stats
      const socketStats = [];

      // Iterate over all connected sockets
      for (const [id, s] of io.sockets.sockets) {
        const isGuest = !s.user; // Determine if the socket is a guest
        socketStats.push({
          socketId: id,
          userId: isGuest ? null : s.user?.id, // If guest, userId is null
          rooms: [...s.rooms], // Get all the rooms the socket is in
          isGuest: isGuest, // Indicate if this socket is a guest
        });
      }

      // Emit socket stats back to the requesting admin
      // Optionally, you could emit to an "admin" room instead
      socket.emit("socketStats", socketStats);

      console.log(`[SocketStats] Admin requested stats: ${socket.id}`);
    });

    // Optionally, if you want to send socket stats to all admins
    // You could emit to an "adminRoom" if you've set that up
    io.on("connection", (socket) => {
      if (socket.user?.roleId === 1) {
        socket.join("adminRoom");
      }
    });
  });

  return io;
}

export function getIO() {
  if (!io) throw new Error("Socket.io not initialized!");
  return io;
}
