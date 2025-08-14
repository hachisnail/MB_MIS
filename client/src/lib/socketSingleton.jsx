// socketSingleton.js
import SocketClient from "@/lib/socketClient";

let socketInstance = null;

export const getSocketClient = () => {
  if (!socketInstance) {
    socketInstance = new SocketClient(import.meta.env.VITE_SERVER_URL);
  }
  return socketInstance;
};
