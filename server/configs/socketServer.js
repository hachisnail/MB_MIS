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
    console.log("A client connected", socket.id);

    socket.on("disconnect", () => {
      console.log("Client disconnected", socket.id);
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
