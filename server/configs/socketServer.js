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
      if (!rawCookie) return next(new Error("Missing cookie"));

      const cookies = cookie.parse(rawCookie);
      let sessionId = cookies["connect.sid"];
      if (!sessionId) return next(new Error("Missing session ID"));

      if (sessionId.startsWith("s:")) {
        sessionId = signature.unsign(sessionId.slice(2), process.env.SESSION_SECRET);
      }

      if (!sessionId) return next(new Error("Invalid session signature"));

      sessionStore.get(sessionId, (err, session) => {
        if (err || !session?.userId) {
          return next(new Error("Unauthorized or expired session"));
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

    // Automatically join default user room
    socket.join(`user:${socket.userId}`);

    // Allow user to join other rooms dynamically (e.g., DMs, alerts, group chat)
    socket.on("joinRoom", (room) => {
      socket.join(room);
      console.log(`Socket ${socket.id} joined room ${room}`);
    });

    socket.on("leaveRoom", (room) => {
      socket.leave(room);
      console.log(`Socket ${socket.id} left room ${room}`);
    });

    // [Optional] validate again if needed
    socket.on("registerUser", (userId) => {
      if (userId === socket.userId) {
        socket.join(`user:${userId}`);
        console.log(` registerUser confirmed: ${socket.id} joined user:${userId}`);
      } else {
        console.warn(`registerUser mismatch: tried ${userId}, actual ${socket.userId}`);
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
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getIO() {
  if (!io) throw new Error("Socket.io not initialized!");
  return io;
}
