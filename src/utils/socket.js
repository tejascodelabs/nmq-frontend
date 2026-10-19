import { io } from "socket.io-client";

const apiUrl = import.meta.env.VITE_API_URL || "";
const socketUrl =
  import.meta.env.VITE_SOCKET_URL ||
  apiUrl.replace(/\/api\/?$/, "") ||
  window.location.origin;

export const socket = io(socketUrl, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  transports: ["websocket", "polling"],
});
