"use client";

import React, { useState, useEffect } from "react";

interface UserProfileData {
  fullname: string;
  username: string;
  email: string;
  phone: string;
  avatar: string;
  bio: string;
  preferences: {
    soundEnabled: boolean;
    onlineStatusVisible: boolean;
    notificationsEnabled: boolean;
  };
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated?: (updatedUser: Partial<UserProfileData>) => void;
}

const PRESET_AVATARS = [
  "https://api.dicebear.com/7.x/bottts/svg?seed=Felix",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Aneka",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Shadow",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Luna",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Orion",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Zeus",
];

export default function SettingsModal({
  isOpen,
  onClose,
  onProfileUpdated,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<"profile" | "security" | "preferences">("profile");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Profile Form State
  const [profile, setProfile] = useState<UserProfileData>({
    fullname: "",
    username: "",
    email: "",
    phone: "",
    avatar: "",
    bio: "",
    preferences: {
      soundEnabled: true,
      onlineStatusVisible: true,
      notificationsEnabled: true,
    },
  });

  // Password Form State
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  // Fetch initial profile data on mount or open
  useEffect(() => {
    if (!isOpen) return;

    setFetching(true);
    setMessage(null);

    fetch("/api/user/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setProfile({
            fullname: data.user.fullname || "",
            username: data.user.username || "",
            email: data.user.email || "",
            phone: data.user.phone || "",
            avatar: data.user.avatar || "",
            bio: data.user.bio || "",
            preferences: data.user.preferences || {
              soundEnabled: true,
              onlineStatusVisible: true,
              notificationsEnabled: true,
            },
          });
        }
      })
      .catch((err) => console.error("Error fetching profile:", err))
      .finally(() => setFetching(false));
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle Profile Update
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullname: profile.fullname,
          phone: profile.phone,
          avatar: profile.avatar,
          bio: profile.bio,
          preferences: profile.preferences,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error && typeof data.error === "object") {
          const firstErrKey = Object.keys(data.error)[0];
          setMessage({ text: data.error[firstErrKey][0], type: "error" });
        } else {
          setMessage({ text: data.error || "Failed to update profile", type: "error" });
        }
        setLoading(false);
        return;
      }

      setMessage({ text: "Profile updated successfully!", type: "success" });
      if (onProfileUpdated && data.user) {
        onProfileUpdated(data.user);
      }
    } catch (err) {
      console.error("Profile update error:", err);
      setMessage({ text: "An error occurred while updating profile.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  // Handle Password Change
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (passwords.newPassword !== passwords.confirmNewPassword) {
      setMessage({ text: "New passwords do not match", type: "error" });
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(passwords),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error && typeof data.error === "object") {
          const firstErrKey = Object.keys(data.error)[0];
          setMessage({ text: data.error[firstErrKey][0], type: "error" });
        } else {
          setMessage({ text: data.error || "Failed to change password", type: "error" });
        }
        setLoading(false);
        return;
      }

      setMessage({ text: "Password changed successfully!", type: "success" });
      setPasswords({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
    } catch (err) {
      console.error("Password change error:", err);
      setMessage({ text: "An error occurred while changing password.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold">
              ⚙️
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Settings & Profile</h2>
              <p className="text-xs text-slate-400">Manage your profile, security, and app preferences</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            ✕
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 px-6 gap-2 pt-2">
          <button
            onClick={() => { setActiveTab("profile"); setMessage(null); }}
            className={`py-3 px-4 text-xs font-semibold rounded-t-xl transition-all border-b-2 ${
              activeTab === "profile"
                ? "border-blue-500 text-blue-400 bg-slate-900"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            👤 Edit Profile
          </button>
          <button
            onClick={() => { setActiveTab("security"); setMessage(null); }}
            className={`py-3 px-4 text-xs font-semibold rounded-t-xl transition-all border-b-2 ${
              activeTab === "security"
                ? "border-blue-500 text-blue-400 bg-slate-900"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            🔒 Security & Password
          </button>
          <button
            onClick={() => { setActiveTab("preferences"); setMessage(null); }}
            className={`py-3 px-4 text-xs font-semibold rounded-t-xl transition-all border-b-2 ${
              activeTab === "preferences"
                ? "border-blue-500 text-blue-400 bg-slate-900"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            🔔 App Preferences
          </button>
        </div>

        {/* Feedback Alert */}
        {message && (
          <div
            className={`mx-6 mt-4 p-3.5 rounded-xl text-xs flex items-center gap-2 border ${
              message.type === "success"
                ? "bg-emerald-950/60 border-emerald-800 text-emerald-200"
                : "bg-red-950/60 border-red-800 text-red-200"
            }`}
          >
            <span>{message.type === "success" ? "✅" : "⚠️"}</span>
            <span>{message.text}</span>
          </div>
        )}

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {fetching ? (
            <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5 text-blue-500" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Loading profile settings...</span>
            </div>
          ) : activeTab === "profile" ? (
            /* ── TAB 1: PROFILE ── */
            <form onSubmit={handleProfileSubmit} className="space-y-5">
              {/* Avatar Selector */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Profile Avatar
                </label>
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-blue-500 overflow-hidden flex items-center justify-center font-bold text-lg text-blue-300 shrink-0">
                    {profile.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      profile.username.slice(0, 2).toUpperCase()
                    )}
                  </div>

                  <div className="flex-1">
                    <p className="text-xs text-slate-400 mb-2">Choose a preset avatar or paste an image URL:</p>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {PRESET_AVATARS.map((url, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setProfile((p) => ({ ...p, avatar: url }))}
                          className={`w-9 h-9 rounded-full border-2 overflow-hidden transition-all shrink-0 ${
                            profile.avatar === url ? "border-blue-500 ring-2 ring-blue-500/50" : "border-slate-700 opacity-70 hover:opacity-100"
                          }`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt={`Preset ${idx}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="Or custom avatar URL..."
                  value={profile.avatar}
                  onChange={(e) => setProfile((p) => ({ ...p, avatar: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Readonly Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    disabled
                    value={profile.username}
                    className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-400 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    Email Address
                  </label>
                  <input
                    type="text"
                    disabled
                    value={profile.email}
                    className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-400 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Full Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={profile.fullname}
                    onChange={(e) => setProfile((p) => ({ ...p, fullname: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={profile.phone}
                    onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="+1234567890"
                    className="w-full px-3 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Bio / About Me
                </label>
                <textarea
                  rows={3}
                  maxLength={200}
                  value={profile.bio}
                  onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
                  placeholder="Tell people a little bit about yourself..."
                  className="w-full px-3 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[10px] text-slate-500 text-right mt-1">{profile.bio.length}/200</p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50"
              >
                {loading ? "Saving Profile..." : "Save Profile Changes"}
              </button>
            </form>
          ) : activeTab === "security" ? (
            /* ── TAB 2: SECURITY ── */
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={passwords.currentPassword}
                  onChange={(e) => setPasswords((p) => ({ ...p, currentPassword: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords((p) => ({ ...p, newPassword: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[10px] text-slate-500 mt-1">Must be at least 8 characters with 1 number and 1 special character.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={passwords.confirmNewPassword}
                  onChange={(e) => setPasswords((p) => ({ ...p, confirmNewPassword: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 mt-4"
              >
                {loading ? "Updating Password..." : "Update Password"}
              </button>
            </form>
          ) : (
            /* ── TAB 3: PREFERENCES ── */
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-800/40 border border-slate-800 rounded-2xl">
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">Sound Notifications</h4>
                    <p className="text-[11px] text-slate-400">Play audio chime when new messages arrive</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profile.preferences?.soundEnabled ?? true}
                      onChange={(e) =>
                        setProfile((p) => ({
                          ...p,
                          preferences: { ...p.preferences, soundEnabled: e.target.checked },
                        }))
                      }
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-800/40 border border-slate-800 rounded-2xl">
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">Online Status Privacy</h4>
                    <p className="text-[11px] text-slate-400">Allow other users to see when you are live</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profile.preferences?.onlineStatusVisible ?? true}
                      onChange={(e) =>
                        setProfile((p) => ({
                          ...p,
                          preferences: { ...p.preferences, onlineStatusVisible: e.target.checked },
                        }))
                      }
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-800/40 border border-slate-800 rounded-2xl">
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">Desktop / Push Notifications</h4>
                    <p className="text-[11px] text-slate-400">Receive in-app popups for important alerts</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profile.preferences?.notificationsEnabled ?? true}
                      onChange={(e) =>
                        setProfile((p) => ({
                          ...p,
                          preferences: { ...p.preferences, notificationsEnabled: e.target.checked },
                        }))
                      }
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50"
              >
                {loading ? "Saving Preferences..." : "Save App Preferences"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
