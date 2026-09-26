import { io } from "socket.io-client";

export const socket = io("http://localhost:5000", {
  withCredentials: true,
  autoConnect: false,
});

export function connectSocket(token: string) {
  socket.auth = {
    token,
  };

  socket.connect();
}