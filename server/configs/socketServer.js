// configs/socketServer.js
import { Server as SocketIOServer } from "socket.io";

let io;

export function initializeSocket(server, corsOrigin) {
  io = new SocketIOServer(server, {
    cors: {
      origin: corsOrigin,
      credentials: true,
    }
  });

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("registerUser", (userId) => {
    socket.join(`user:${userId}`);
    console.log(`Socket ${socket.id} joined room user:${userId}`);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});


  return io;
}

export function getIO() {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
}
