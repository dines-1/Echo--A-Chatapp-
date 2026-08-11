"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useSocket } from "@/src/hooks/useSocket";
import { useNotifications } from "@/src/hooks/useNotifications";
import { getSocket } from "@/src/lib/socket";
import SettingsModal from "@/src/components/settings/settings-modal";

/* ────────────────────────────── Types ────────────────────────────── */

interface Participant {
  _id: string;
  fullname: string;
  username: string;
  avatar?: string;
  IsOnline?: boolean;
  lastseen?: string;
}

interface ConversationItem {
  _id: string;
  isGroup: boolean;
  groupName?: string;
  participants: Participant[];
  admin?: Participant;
  lastMessage?: {
    content: string;
    sender: { username: string };
    createdAt: string;
  };
  updatedAt: string;
}

interface MessageItem {
  _id: string;
  conversation: string;
  sender: {
    _id: string;
    fullname: string;
    username: string;
    avatar?: string;
  };
  content: string;
  seenBy: string[];
  status: "sent" | "delivered" | "seen";
  createdAt: string;
}

/* ──────────────────────────── Component ──────────────────────────── */

export default function ChatPage() {
  const { data: session, status } = useSession();
  const { sendMessage, markSeen, startTyping, stopTyping } = useSocket();
  const {
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllRead,
  } = useNotifications();

  // ── State ──────────────────────────────────────────────────────────
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [selectedConvo, setSelectedConvo] = useState<ConversationItem | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});
  const [onlineStatus, setOnlineStatus] = useState<Record<string, boolean>>({});
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [allUsers, setAllUsers] = useState<Participant[]>([]);
  const [showNewChat, setShowNewChat] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const currentUserId = session?.user?.id || "";
  const currentUsername = session?.user?.username || "You";

  // ── Fetch conversations ────────────────────────────────────────────
  useEffect(() => {
    if (status !== "authenticated") return;

    fetch("/api/conversations")
      .then((res) => res.json())
      .then((data) => {
        if (data.conversations) {
          setConversations(data.conversations);
          // Set initial online status from participants
          const statusMap: Record<string, boolean> = {};
          for (const convo of data.conversations) {
            for (const p of convo.participants) {
              if (p._id !== currentUserId) {
                statusMap[p._id] = p.IsOnline || false;
              }
            }
          }
          setOnlineStatus(statusMap);
        }
      })
      .catch(console.error)
      .finally(() => setLoadingConvos(false));
  }, [status, currentUserId]);

  // ── Fetch users for new chat ───────────────────────────────────────
  useEffect(() => {
    if (status !== "authenticated") return;

    fetch("/api/users")
      .then((res) => res.json())
      .then((data) => {
        if (data.users) setAllUsers(data.users);
      })
      .catch(console.error);
  }, [status]);

  // ── Fetch messages when conversation changes ───────────────────────
  useEffect(() => {
    if (!selectedConvo) {
      setMessages([]);
      return;
    }

    setLoadingMessages(true);
    fetch(`/api/conversations/${selectedConvo._id}/messages`)
      .then((res) => res.json())
      .then((data) => {
        if (data.messages) {
          setMessages(data.messages);
          // Mark messages as seen
          markSeen(selectedConvo._id, currentUserId);
        }
      })
      .catch(console.error)
      .finally(() => setLoadingMessages(false));
  }, [selectedConvo, currentUserId, markSeen]);

  // ── Socket.IO event listeners ──────────────────────────────────────
  useEffect(() => {
    if (status !== "authenticated") return;

    const socket = getSocket();

    // New message
    const handleNewMessage = (data: {
      conversationId: string;
      message: MessageItem;
    }) => {
      // Add to messages if viewing this conversation
      if (selectedConvo && data.conversationId === selectedConvo._id) {
        setMessages((prev) => {
          // Prevent duplicates
          if (prev.some((m) => m._id === data.message._id)) return prev;
          return [...prev, data.message];
        });
        // Auto-mark as seen if viewing
        if (data.message.sender._id !== currentUserId) {
          markSeen(data.conversationId, currentUserId);
        }
      }

      // Update conversation list with latest message
      setConversations((prev) =>
        prev
          .map((c) =>
            c._id === data.conversationId
              ? {
                ...c,
                lastMessage: {
                  content: data.message.content,
                  sender: { username: data.message.sender.username },
                  createdAt: data.message.createdAt,
                },
                updatedAt: data.message.createdAt,
              }
              : c
          )
          .sort(
            (a, b) =>
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          )
      );
    };

    // New conversation
    const handleNewConversation = (conversation: ConversationItem) => {
      setConversations((prev) => {
        if (prev.some((c) => c._id === conversation._id)) return prev;
        return [conversation, ...prev];
      });
    };

    // User online/offline status
    const handleUserStatus = (data: {
      userId: string;
      isOnline: boolean;
    }) => {
      setOnlineStatus((prev) => ({ ...prev, [data.userId]: data.isOnline }));
    };

    // Typing indicators
    const handleTypingStart = (data: {
      conversationId: string;
      userId: string;
      username: string;
    }) => {
      if (data.userId !== currentUserId) {
        setTypingUsers((prev) => ({
          ...prev,
          [data.conversationId]: data.username,
        }));
      }
    };

    const handleTypingStop = (data: {
      conversationId: string;
      userId: string;
    }) => {
      if (data.userId !== currentUserId) {
        setTypingUsers((prev) => {
          const copy = { ...prev };
          delete copy[data.conversationId];
          return copy;
        });
      }
    };

    // Message seen
    const handleMessageSeen = (data: {
      conversationId: string;
      seenBy: string;
    }) => {
      if (selectedConvo && data.conversationId === selectedConvo._id) {
        setMessages((prev) =>
          prev.map((m) => ({
            ...m,
            status: "seen" as const,
            seenBy: m.seenBy.includes(data.seenBy)
              ? m.seenBy
              : [...m.seenBy, data.seenBy],
          }))
        );
      }
    };

    socket.on("message:new", handleNewMessage);
    socket.on("conversation:created", handleNewConversation);
    socket.on("user:status", handleUserStatus);
    socket.on("typing:start", handleTypingStart);
    socket.on("typing:stop", handleTypingStop);
    socket.on("message:seen", handleMessageSeen);

    return () => {
      socket.off("message:new", handleNewMessage);
      socket.off("conversation:created", handleNewConversation);
      socket.off("user:status", handleUserStatus);
      socket.off("typing:start", handleTypingStart);
      socket.off("typing:stop", handleTypingStop);
      socket.off("message:seen", handleMessageSeen);
    };
  }, [status, selectedConvo, currentUserId, markSeen]);

  // ── Auto-scroll ────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Send message ───────────────────────────────────────────────────
  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedConvo) return;

    sendMessage({
      conversationId: selectedConvo._id,
      senderId: currentUserId,
      senderName: currentUsername,
      content: input.trim(),
    });

    // Clear typing
    stopTyping(selectedConvo._id, currentUserId);
    setInput("");
  };

  // ── Typing handler ─────────────────────────────────────────────────
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);

    if (!selectedConvo) return;

    startTyping(selectedConvo._id, currentUserId, currentUsername);

    // Clear previous timeout
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(selectedConvo._id, currentUserId);
    }, 2000);
  };

  // ── Start new conversation ─────────────────────────────────────────
  const startNewChat = async (userId: string) => {
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId: userId }),
      });
      const data = await res.json();
      if (data.conversation) {
        if (data.isNew) {
          setConversations((prev) => [data.conversation, ...prev]);
        }
        setSelectedConvo(data.conversation);
        setShowNewChat(false);
      }
    } catch (error) {
      console.error("Failed to create conversation:", error);
    }
  };

  // ── Helpers ────────────────────────────────────────────────────────
  const getPartner = useCallback(
    (convo: ConversationItem): Participant | null => {
      if (convo.isGroup) return null;
      return convo.participants.find((p) => p._id !== currentUserId) || null;
    },
    [currentUserId]
  );

  const getConvoName = useCallback(
    (convo: ConversationItem): string => {
      if (convo.isGroup) return convo.groupName || "Group";
      const partner = getPartner(convo);
      return partner?.fullname || partner?.username || "Unknown";
    },
    [getPartner]
  );

  const getConvoInitials = useCallback(
    (convo: ConversationItem): string => {
      if (convo.isGroup) return (convo.groupName || "G").slice(0, 2).toUpperCase();
      const partner = getPartner(convo);
      return (partner?.username || "?").slice(0, 2).toUpperCase();
    },
    [getPartner]
  );

  const isPartnerOnline = useCallback(
    (convo: ConversationItem): boolean => {
      if (convo.isGroup) return false;
      const partner = getPartner(convo);
      return partner ? onlineStatus[partner._id] ?? false : false;
    },
    [getPartner, onlineStatus]
  );

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredConversations = conversations.filter((c) => {
    const name = getConvoName(c).toLowerCase();
    return name.includes(search.toLowerCase());
  });

  // ── Loading state ──────────────────────────────────────────────────
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-300">
        <div className="flex items-center gap-3">
          <svg
            className="animate-spin h-6 w-6 text-blue-500"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Loading Echo Chat...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans text-slate-100">
      {/* ── Top Bar ─────────────────────────────────────────────────── */}
      <header className="bg-slate-900/90 border-b border-slate-800 px-6 py-4 flex items-center justify-between backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-lg text-white shadow-md">
            E
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">Echo Chat</h1>
            <p className="text-xs text-slate-400">
              Real-time messaging • {Object.values(onlineStatus).filter(Boolean).length} online
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Notification bell */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                if (!showNotifications) fetchNotifications();
              }}
              className="relative p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all"
            >
              <svg
                className="w-5 h-5 text-slate-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {/* Notification dropdown */}
            {showNotifications && (
              <div className="absolute right-0 top-12 w-80 max-h-96 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-50">
                <div className="p-3 border-b border-slate-800 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-200">
                    Notifications
                  </h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="overflow-y-auto max-h-72">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <button
                        key={n._id}
                        onClick={() => {
                          if (!n.isRead) markAsRead(n._id);
                          setShowNotifications(false);
                        }}
                        className={`w-full text-left p-3 border-b border-slate-800/50 hover:bg-slate-800/50 transition-all ${!n.isRead ? "bg-blue-950/20" : ""
                          }`}
                      >
                        <div className="flex items-start gap-2">
                          {!n.isRead && (
                            <span className="mt-1.5 w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-200 truncate">
                              {n.title}
                            </p>
                            <p className="text-[11px] text-slate-400 truncate">
                              {n.body}
                            </p>
                            <p className="text-[10px] text-slate-500 mt-1">
                              {formatTime(n.createdAt)}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Settings button */}
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all flex items-center gap-1 text-xs font-semibold"
            title="Settings & Profile"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span className="hidden md:inline">Settings</span>
          </button>

          <div className="hidden sm:flex flex-col text-right">
            <span className="text-sm font-semibold text-slate-200">
              {session?.user?.username || session?.user?.email}
            </span>
            <span className="text-xs text-blue-400 font-medium capitalize">
              {session?.user?.role || "customer"}
            </span>
          </div>

          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-sm font-medium transition-all hover:text-white"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />

      {/* ── Main Grid ───────────────────────────────────────────────── */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto p-4 md:p-6 gap-6 overflow-hidden">
        {/* ── Sidebar ─────────────────────────────────────────────── */}
        <aside className="w-full md:w-80 bg-slate-900/70 border border-slate-800 rounded-2xl p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Conversations ({conversations.length})
            </h2>
            <button
              onClick={() => setShowNewChat(!showNewChat)}
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold transition-all"
            >
              {showNewChat ? "Cancel" : "+ New"}
            </button>
          </div>

          {/* New chat user picker */}
          {showNewChat && (
            <div className="border border-slate-700 rounded-xl p-2 space-y-1 max-h-40 overflow-y-auto bg-slate-800/50">
              {allUsers
                .filter(
                  (u) =>
                    u._id !== currentUserId &&
                    (u.username
                      .toLowerCase()
                      .includes(search.toLowerCase()) ||
                      u.fullname
                        ?.toLowerCase()
                        .includes(search.toLowerCase()))
                )
                .map((user) => (
                  <button
                    key={user._id}
                    onClick={() => startNewChat(user._id)}
                    className="w-full text-left p-2 rounded-lg hover:bg-slate-700/50 flex items-center gap-2 transition-all"
                  >
                    <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-blue-300">
                      {user.username.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-200">
                        {user.fullname || user.username}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        @{user.username}
                      </p>
                    </div>
                  </button>
                ))}
            </div>
          )}

          {/* Search */}
          <input
            type="text"
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {loadingConvos ? (
              <div className="p-4 text-center text-xs text-slate-500">
                Loading conversations...
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500">
                {conversations.length === 0
                  ? "No conversations yet. Start one!"
                  : "No conversations match your search."}
              </div>
            ) : (
              filteredConversations.map((convo) => {
                const isSelected = selectedConvo?._id === convo._id;
                const online = isPartnerOnline(convo);
                const typing = typingUsers[convo._id];

                return (
                  <button
                    key={convo._id}
                    onClick={() => setSelectedConvo(convo)}
                    className={`w-full text-left p-3 rounded-xl transition-all flex items-center gap-3 border ${isSelected
                        ? "bg-blue-600/20 border-blue-500/40 text-slate-100"
                        : "bg-slate-800/40 border-slate-800 text-slate-300 hover:bg-slate-800/80"
                      }`}
                  >
                    <div className="relative">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${convo.isGroup
                            ? "bg-indigo-900/50 text-indigo-300"
                            : "bg-slate-700 text-blue-300"
                          }`}
                      >
                        {getConvoInitials(convo)}
                      </div>
                      {!convo.isGroup && (
                        <span
                          className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-slate-900 ${online ? "bg-emerald-500" : "bg-slate-600"
                            }`}
                        />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold truncate">
                        {getConvoName(convo)}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {typing ? (
                          <span className="text-blue-400 italic">
                            {typing} is typing...
                          </span>
                        ) : convo.lastMessage ? (
                          `${convo.lastMessage.sender.username}: ${convo.lastMessage.content}`
                        ) : (
                          "No messages yet"
                        )}
                      </div>
                    </div>

                    {convo.lastMessage && (
                      <span className="text-[10px] text-slate-500 shrink-0">
                        {formatTime(convo.lastMessage.createdAt)}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* ── Chat Window ─────────────────────────────────────────── */}
        <main className="flex-1 bg-slate-900/70 border border-slate-800 rounded-2xl flex flex-col overflow-hidden">
          {selectedConvo ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-slate-800 bg-slate-900/90 flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full border flex items-center justify-center font-bold text-sm ${selectedConvo.isGroup
                      ? "bg-indigo-600/20 border-indigo-500/30 text-indigo-300"
                      : "bg-blue-600/20 border-blue-500/30 text-blue-300"
                    }`}
                >
                  {getConvoInitials(selectedConvo)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">
                    {getConvoName(selectedConvo)}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {typingUsers[selectedConvo._id] ? (
                      <span className="text-blue-400">
                        {typingUsers[selectedConvo._id]} is typing...
                      </span>
                    ) : isPartnerOnline(selectedConvo) ? (
                      <span className="text-emerald-400">Online</span>
                    ) : selectedConvo.isGroup ? (
                      `${selectedConvo.participants.length} members`
                    ) : (
                      "Offline"
                    )}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                {loadingMessages ? (
                  <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                    Loading messages...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs">
                    <svg
                      className="w-10 h-10 mb-2 opacity-40"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                    <span>
                      No messages yet. Start the conversation!
                    </span>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.sender._id === currentUserId;
                    return (
                      <div
                        key={msg._id}
                        className={`flex flex-col ${isMe ? "items-end" : "items-start"
                          }`}
                      >
                        <div className="text-[11px] text-slate-400 mb-1 px-1">
                          {msg.sender.username} •{" "}
                          {formatTime(msg.createdAt)}
                        </div>
                        <div
                          className={`max-w-md px-4 py-2.5 rounded-2xl text-sm ${isMe
                              ? "bg-blue-600 text-white rounded-br-none"
                              : "bg-slate-800 text-slate-100 rounded-bl-none border border-slate-700/60"
                            }`}
                        >
                          {msg.content}
                        </div>
                        {isMe && (
                          <span className="text-[10px] text-slate-500 mt-0.5 px-1">
                            {msg.status === "seen"
                              ? "✓✓ Seen"
                              : msg.status === "delivered"
                                ? "✓✓"
                                : "✓"}
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form
                onSubmit={handleSend}
                className="p-4 border-t border-slate-800 bg-slate-900/90 flex gap-3"
              >
                <input
                  type="text"
                  value={input}
                  onChange={handleInputChange}
                  placeholder={`Message ${getConvoName(selectedConvo)}...`}
                  className="flex-1 px-4 py-3 bg-slate-800/90 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl text-sm transition-all shadow-md active:scale-95"
                >
                  Send
                </button>
              </form>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-3">
              <svg
                className="w-16 h-16 opacity-30"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <span className="text-sm">
                Select a conversation or start a new one
              </span>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
