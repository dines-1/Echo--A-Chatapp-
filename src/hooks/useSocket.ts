"use client";

import { useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { getSocket, disconnectSocket } from "@/src/lib/socket";
import type { Socket } from "socket.io-client";

/**
 * Manages the Socket.IO connection lifecycle.
 *
 * - Connects when the user is authenticated
 * - Emits `user:online` with the session user ID
 * - Returns the socket instance and helpers for sending events
 * - Cleans up on unmount
 */
export function useSocket() {
  const { data: session, status } = useSession();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id) return;

    const socket = getSocket();
    socketRef.current = socket;

    if (!socket.connected) {
      socket.connect();
    }

    // Join personal room
    socket.emit("user:online", session.user.id);

    // Reconnection handling
    const handleReconnect = () => {
      socket.emit("user:online", session.user.id);
    };
    socket.on("connect", handleReconnect);

    return () => {
      socket.off("connect", handleReconnect);
    };
  }, [status, session?.user?.id]);

  // ── Helpers ────────────────────────────────────────────────────────

  const sendMessage = useCallback(
    (data: {
      conversationId: string;
      senderId: string;
      senderName: string;
      content: string;
    }) => {
      socketRef.current?.emit("message:send", data);
    },
    []
  );

  const markSeen = useCallback(
    (conversationId: string, userId: string) => {
      socketRef.current?.emit("message:seen", { conversationId, userId });
    },
    []
  );

  const startTyping = useCallback(
    (conversationId: string, userId: string, username: string) => {
      socketRef.current?.emit("typing:start", {
        conversationId,
        userId,
        username,
      });
    },
    []
  );

  const stopTyping = useCallback(
    (conversationId: string, userId: string) => {
      socketRef.current?.emit("typing:stop", { conversationId, userId });
    },
    []
  );

  const markNotificationRead = useCallback(
    (notificationId: string, userId: string) => {
      socketRef.current?.emit("notification:read", {
        notificationId,
        userId,
      });
    },
    []
  );

  const disconnect = useCallback(() => {
    disconnectSocket();
    socketRef.current = null;
  }, []);

  return {
    socket: socketRef.current,
    isConnected: socketRef.current?.connected ?? false,
    sendMessage,
    markSeen,
    startTyping,
    stopTyping,
    markNotificationRead,
    disconnect,
  };
}
