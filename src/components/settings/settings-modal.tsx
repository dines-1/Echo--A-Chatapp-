"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Settings,
  X,
  User,
  Lock,
  Bell,
  Camera,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Volume2,
  Eye,
  BellRing,
  Sun,
  Moon,
} from "lucide-react";

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
    theme: "light" | "dark";
  };
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated?: (updatedUser: Partial<UserProfileData>) => void;
}

const DEFAULT_PREFERENCES = {
  soundEnabled: true,
  onlineStatusVisible: true,
  notificationsEnabled: true,
  theme: "dark" as const,
};

export default function SettingsModal({
  isOpen,
  onClose,
  onProfileUpdated,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<"profile" | "security" | "preferences">("profile");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile Form State
  const [profile, setProfile] = useState<UserProfileData>({
    fullname: "",
    username: "",
    email: "",
    phone: "",
    avatar: "",
    bio: "",
    preferences: DEFAULT_PREFERENCES,
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
            preferences: { ...DEFAULT_PREFERENCES, ...data.user.preferences },
          });
        }
      })
      .catch((err) => console.error("Error fetching profile:", err))
      .finally(() => setFetching(false));
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle Avatar Upload
  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage({ text: "Please select a valid image file", type: "error" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ text: "Image must be smaller than 5MB", type: "error" });
      return;
    }

    setUploadingAvatar(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const res = await fetch("/api/user/avatar", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ text: data.error || "Failed to upload avatar", type: "error" });
        return;
      }

      setProfile((p) => ({ ...p, avatar: data.avatarUrl }));
      setMessage({ text: "Avatar uploaded successfully!", type: "success" });
    } catch (err) {
      console.error("Avatar upload error:", err);
      setMessage({ text: "An error occurred while uploading your avatar.", type: "error" });
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

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

  const tabs = [
    { id: "profile" as const, label: "Edit Profile", icon: User },
    { id: "security" as const, label: "Security & Password", icon: Lock },
    { id: "preferences" as const, label: "App Preferences", icon: Bell },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Settings size={18} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Settings & Profile</h2>
              <p className="text-xs text-slate-400">Manage your profile, security, and app preferences</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close settings"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 px-6 gap-2 pt-2">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => { setActiveTab(id); setMessage(null); }}
              className={`flex items-center gap-1.5 py-3 px-4 text-xs font-semibold rounded-t-xl transition-all border-b-2 ${activeTab === id
                ? "border-blue-500 text-blue-400 bg-slate-900"
                : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* Feedback Alert */}
        {message && (
          <div
            className={`mx-6 mt-4 p-3.5 rounded-xl text-xs flex items-center gap-2 border ${message.type === "success"
              ? "bg-emerald-950/60 border-emerald-800 text-emerald-200"
              : "bg-red-950/60 border-red-800 text-red-200"
              }`}
          >
            {message.type === "success" ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {fetching ? (
            <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <Loader2 size={18} className="animate-spin text-blue-500" />
              <span>Loading profile settings...</span>
            </div>
          ) : activeTab === "profile" ? (
            /* ── TAB 1: PROFILE ── */
            <form onSubmit={handleProfileSubmit} className="space-y-5">
              {/* Avatar Upload */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Profile Avatar
                </label>
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 shrink-0">
                    <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-blue-500 overflow-hidden flex items-center justify-center font-bold text-lg text-blue-300">
                      {profile.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        profile.username.slice(0, 2).toUpperCase() || <User size={22} />
                      )}
                    </div>
                    {uploadingAvatar && (
                      <div className="absolute inset-0 rounded-full bg-slate-950/70 flex items-center justify-center">
                        <Loader2 size={16} className="animate-spin text-white" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <p className="text-xs text-slate-400 mb-2">Upload a photo from your device (PNG, JPG, up to 5MB).</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarSelect}
                      className="hidden"
                      id="avatar-upload"
                    />
                    <label
                      htmlFor="avatar-upload"
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800/90 hover:bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 cursor-pointer transition-all"
                    >
                      <Camera size={14} />
                      {profile.avatar ? "Change photo" : "Upload photo"}
                    </label>
                  </div>
                </div>
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
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400">
                      <Volume2 size={15} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-200">Sound Notifications</h4>
                      <p className="text-[11px] text-slate-400">Play a chime when new messages arrive</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profile.preferences.soundEnabled}
                      onChange={(e) =>
                        setProfile((p) => ({
                          ...p,
                          preferences: { ...p.preferences, soundEnabled: e.target.checked },
                        }))
                      }
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-800/40 border border-slate-800 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400">
                      <Eye size={15} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-200">Online Status Privacy</h4>
                      <p className="text-[11px] text-slate-400">Allow other users to see when you're online</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profile.preferences.onlineStatusVisible}
                      onChange={(e) =>
                        setProfile((p) => ({
                          ...p,
                          preferences: { ...p.preferences, onlineStatusVisible: e.target.checked },
                        }))
                      }
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-800/40 border border-slate-800 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400">
                      <BellRing size={15} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-200">Desktop & Push Notifications</h4>
                      <p className="text-[11px] text-slate-400">Receive in-app popups for important alerts</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profile.preferences.notificationsEnabled}
                      onChange={(e) =>
                        setProfile((p) => ({
                          ...p,
                          preferences: { ...p.preferences, notificationsEnabled: e.target.checked },
                        }))
                      }
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* Theme Toggle */}
                <div className="flex items-center justify-between p-4 bg-slate-800/40 border border-slate-800 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400">
                      {profile.preferences.theme === "dark" ? <Moon size={15} /> : <Sun size={15} />}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-200">Appearance</h4>
                      <p className="text-[11px] text-slate-400">Switch between light and dark theme</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-950/60 border border-slate-800 rounded-full p-1">
                    <button
                      type="button"
                      onClick={() => setProfile((p) => ({ ...p, preferences: { ...p.preferences, theme: "light" } }))}
                      className={`px-3 py-1.5 rounded-full text-[11px] font-semibold flex items-center gap-1 transition-all ${profile.preferences.theme === "light"
                        ? "bg-blue-600 text-white"
                        : "text-slate-400 hover:text-slate-200"
                        }`}
                    >
                      <Sun size={12} />
                      Light
                    </button>
                    <button
                      type="button"
                      onClick={() => setProfile((p) => ({ ...p, preferences: { ...p.preferences, theme: "dark" } }))}
                      className={`px-3 py-1.5 rounded-full text-[11px] font-semibold flex items-center gap-1 transition-all ${profile.preferences.theme === "dark"
                        ? "bg-blue-600 text-white"
                        : "text-slate-400 hover:text-slate-200"
                        }`}
                    >
                      <Moon size={12} />
                      Dark
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50"
              >
                {loading ? "Saving Preferences..." : "Save"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}