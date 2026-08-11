"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { getSocket } from "@/src/lib/socket";

export interface NotificationItem {
  _id: string;
  sender: {
    _id: string;
    fullname: string;
    username: string;
    avatar?: string;
  } | null;
  type: "new_message" | "group_invite" | "role_change" | "system";
  title: string;
  body: string;
  reference?: string;
  referenceModel?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

/**
 * Manages notification state: unread count, notification list,
 * real-time updates via Socket.IO, and mark-as-read actions.
 */
export function useNotifications() {
  const { data: session, status } = useSession();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // ── Fetch initial unread count ─────────────────────────────────────
  useEffect(() => {
    if (status !== "authenticated") return;

    fetch("/api/notifications/unread-count")
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.count === "number") {
          setUnreadCount(data.count);
        }
      })
      .catch(console.error);
  }, [status]);

  // ── Fetch notifications ────────────────────────────────────────────
  const fetchNotifications = useCallback(
    async (unreadOnly = false) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (unreadOnly) params.set("unreadOnly", "true");

        const res = await fetch(`/api/notifications?${params.toString()}`);
        const data = await res.json();

        if (data.notifications) {
          setNotifications(data.notifications);
        }
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // ── Listen for real-time notifications ─────────────────────────────
  useEffect(() => {
    if (status !== "authenticated") return;

    const socket = getSocket();

    const handleNewNotification = (notification: NotificationItem) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    };

    socket.on("notification:new", handleNewNotification);

    return () => {
      socket.off("notification:new", handleNewNotification);
    };
  }, [status]);

  // ── Mark single notification as read ───────────────────────────────
  const markAsRead = useCallback(
    async (notificationId: string) => {
      try {
        await fetch("/api/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notificationIds: [notificationId] }),
        });

        setNotifications((prev) =>
          prev.map((n) =>
            n._id === notificationId
              ? { ...n, isRead: true, readAt: new Date().toISOString() }
              : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));

        // Also notify via socket for instant UI sync across tabs
        const socket = getSocket();
        socket.emit("notification:read", {
          notificationId,
          userId: session?.user?.id,
        });
      } catch (error) {
        console.error("Failed to mark notification as read:", error);
      }
    },
    [session?.user?.id]
  );

  // ── Mark all as read ───────────────────────────────────────────────
  const markAllRead = useCallback(async () => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });

      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          isRead: true,
          readAt: new Date().toISOString(),
        }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllRead,
  };
}
