"use client";

import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

/**
 * Returns a singleton Socket.IO client instance.
 * All components share the same connection.
 */
export function getSocket(): Socket {
  if (!socket) {
    const url =
      process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000";

    socket = io(url, {
      autoConnect: false,
      // Send credentials (cookies) so the server can identify the user
      withCredentials: true,
      transports: ["websocket", "polling"],
    });
  }
  return socket;
}

/**
 * Disconnect and reset the singleton.
 * Call this on sign-out to clean up.
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
