"use client";

import React, { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

interface CustomerUser {
  _id: string;
  fullname: string;
  username: string;
  email: string;
  isVerified: boolean;
  IsOnline?: boolean;
}

interface MessageItem {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  text: string;
  time: string;
}

export default function ChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [customers, setCustomers] = useState<CustomerUser[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerUser | null>(null);
  const [messages, setMessages] = useState<Record<string, MessageItem[]>>({});
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Fetch available customers for Customer-to-Customer chat
  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/users")
        .then((res) => res.json())
        .then((data) => {
          if (data.users && Array.isArray(data.users)) {
            setCustomers(data.users);
            if (data.users.length > 0) {
              setSelectedCustomer(data.users[0]);
            }
          }
        })
        .catch((err) => console.error("Error fetching customers:", err))
        .finally(() => setLoadingUsers(false));
    }
  }, [status]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-300">
        <div className="flex items-center gap-3">
          <svg className="animate-spin h-6 w-6 text-blue-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Loading Customer Chat Portal...</span>
        </div>
      </div>
    );
  }

  const currentUserId = session?.user?.id || "current-user";
  const currentUsername = session?.user?.username || "You";

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedCustomer) return;

    const partnerId = selectedCustomer._id;
    const newMessage: MessageItem = {
      id: Date.now().toString(),
      senderId: currentUserId,
      senderName: currentUsername,
      receiverId: partnerId,
      text: input.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => ({
      ...prev,
      [partnerId]: [...(prev[partnerId] || []), newMessage],
    }));

    setInput("");
  };

  const activeMessages = selectedCustomer ? messages[selectedCustomer._id] || [] : [];
  const filteredCustomers = customers.filter(
    (c) =>
      c.username.toLowerCase().includes(search.toLowerCase()) ||
      c.fullname?.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans text-slate-100">
      {/* Top Bar */}
      <header className="bg-slate-900/90 border-b border-slate-800 px-6 py-4 flex items-center justify-between backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-lg text-white shadow-md">
            C
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">Customer Chat Network</h1>
            <p className="text-xs text-slate-400">Customer-to-Customer Direct Messaging</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-sm font-semibold text-slate-200">
              {session?.user?.username || session?.user?.email}
            </span>
            <span className="text-xs text-blue-400 font-medium capitalize">
              Role: Customer
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

      {/* Main Grid */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto p-4 md:p-6 gap-6 overflow-hidden">
        {/* Customer Directory Sidebar */}
        <aside className="w-full md:w-80 bg-slate-900/70 border border-slate-800 rounded-2xl p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Other Customers ({customers.length})
            </h2>
            <span className="text-xs text-emerald-400 font-medium">Live</span>
          </div>

          {/* Search box */}
          <input
            type="text"
            placeholder="Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Customer list */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {loadingUsers ? (
              <div className="p-4 text-center text-xs text-slate-500">Loading customer directory...</div>
            ) : filteredCustomers.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500">
                {customers.length === 0
                  ? "No other customers registered yet."
                  : "No customers match your search."}
              </div>
            ) : (
              filteredCustomers.map((cust) => {
                const isSelected = selectedCustomer?._id === cust._id;
                return (
                  <button
                    key={cust._id}
                    onClick={() => setSelectedCustomer(cust)}
                    className={`w-full text-left p-3 rounded-xl transition-all flex items-center gap-3 border ${
                      isSelected
                        ? "bg-blue-600/20 border-blue-500/40 text-slate-100"
                        : "bg-slate-800/40 border-slate-800 text-slate-300 hover:bg-slate-800/80"
                    }`}
                  >
                    <div className="relative">
                      <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center font-bold text-xs text-blue-300">
                        {cust.username.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-900"></span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold truncate">{cust.fullname || cust.username}</div>
                      <div className="text-[11px] text-slate-400 truncate">@{cust.username}</div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-xl text-[11px] text-slate-400">
            💬 Customers chat directly with other customers.
          </div>
        </aside>

        {/* Chat Window */}
        <main className="flex-1 bg-slate-900/70 border border-slate-800 rounded-2xl flex flex-col overflow-hidden">
          {selectedCustomer ? (
            <>
              {/* Partner Header */}
              <div className="p-4 border-b border-slate-800 bg-slate-900/90 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center font-bold text-sm text-blue-300">
                  {selectedCustomer.username.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">
                    {selectedCustomer.fullname || selectedCustomer.username}
                  </h3>
                  <p className="text-xs text-slate-400">@{selectedCustomer.username} • Customer</p>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                {activeMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs">
                    <svg className="w-10 h-10 mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span>No messages yet with @{selectedCustomer.username}. Start the conversation!</span>
                  </div>
                ) : (
                  activeMessages.map((msg) => {
                    const isMe = msg.senderId === currentUserId;
                    return (
                      <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                        <div className="text-[11px] text-slate-400 mb-1 px-1">
                          {msg.senderName} • {msg.time}
                        </div>
                        <div
                          className={`max-w-md px-4 py-2.5 rounded-2xl text-sm ${
                            isMe
                              ? "bg-blue-600 text-white rounded-br-none"
                              : "bg-slate-800 text-slate-100 rounded-bl-none border border-slate-700/60"
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Input Bar */}
              <form onSubmit={handleSend} className="p-4 border-t border-slate-800 bg-slate-900/90 flex gap-3">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={`Message @${selectedCustomer.username}...`}
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
            <div className="h-full flex items-center justify-center text-slate-500 text-sm">
              Select a customer from the left sidebar to start chatting.
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
