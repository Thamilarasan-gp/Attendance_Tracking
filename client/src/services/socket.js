import { io } from "socket.io-client";
import { API_BASE_URL } from "../constants/config";

export const socket = io(API_BASE_URL, {
  autoConnect: false,
  transports: ["websocket", "polling"]
});

export const connectSocket = () => {
  if (!socket.connected) {
    socket.connect();
  }
};

export const joinClassRoom = (classId) => {
  connectSocket();
  socket.emit("joinClass", { classId });
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};
