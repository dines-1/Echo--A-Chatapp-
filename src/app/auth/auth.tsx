"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AuthLayout() {
    const pathname = usePathname();
    const router = useRouter();
    const isRegister = pathname === "/register";

    // ── Login state ──
    const [loginEmail, setLoginEmail] = useState("");
    const [loginPassword, setLoginPassword] = useState("");
    const [loginError, setLoginError] = useState<string | null>(null);
    const [loginLoading, setLoginLoading] = useState(false);

    // ── Register state ──
    const [formData, setFormData] = useState({
        fullname: "",
        username: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
    });
    const [registerError, setRegisterError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
    const [registerLoading, setRegisterLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoginError(null);
        setLoginLoading(true);

        try {
            const res = await signIn("credentials", {
                email: loginEmail,
                password: loginPassword,
                redirect: false,
            });

            if (res?.error) {
                setLoginError(res.error);
                setLoginLoading(false);
                return;
            }

            const session = await getSession();
            const role = session?.user?.role;

            if (role === "admin") {
                router.push("/admin");
            } else {
                router.push("/chat");
            }
            router.refresh();
        } catch (err: unknown) {
            console.error("Login submission error:", err);
            setLoginError("An unexpected error occurred. Please try again.");
            setLoginLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setRegisterError(null);
        setFieldErrors({});

        if (formData.password !== formData.confirmPassword) {
            setRegisterError("Passwords do not match");
            return;
        }

        setRegisterLoading(true);

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) {
                if (data.error && typeof data.error === "object") {
                    setFieldErrors(data.error);
                } else {
                    setRegisterError(data.error || "Registration failed. Please try again.");
                }
                setRegisterLoading(false);
                return;
            }

            router.push(`/verify-otp?email=${encodeURIComponent(formData.email)}`);
        } catch (err: unknown) {
            console.error("Register submission error:", err);
            setRegisterError("An unexpected error occurred. Please try again.");
            setRegisterLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
        setRegisterError(null);
        setFieldErrors({});
    };

    const isUnverifiedError = loginError?.toLowerCase().includes("verify");

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans text-gray-900">
            <div className="w-full max-w-md bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                {/* Tabs */}
                <div className="flex border-b border-gray-200 bg-gray-50/80">
                    <Link
                        href="/login"
                        className={`flex-1 py-3.5 text-sm font-medium text-center relative transition-colors duration-200 ${!isRegister ? "text-gray-900" : "text-gray-400 hover:text-gray-600"
                            }`}
                    >
                        Sign in
                        {!isRegister && (
                            <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-gray-900 rounded-full transition-all duration-300" />
                        )}
                    </Link>
                    <Link
                        href="/register"
                        className={`flex-1 py-3.5 text-sm font-medium text-center relative transition-colors duration-200 ${isRegister ? "text-gray-900" : "text-gray-400 hover:text-gray-600"
                            }`}
                    >
                        Create account
                        {isRegister && (
                            <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-gray-900 rounded-full transition-all duration-300" />
                        )}
                    </Link>
                </div>

                {/* Sliding container */}
                <div className="relative overflow-hidden">
                    <div
                        className="flex transition-transform duration-500 ease-in-out"
                        style={{
                            width: "200%",
                            transform: isRegister ? "translateX(-50%)" : "translateX(0%)",
                        }}
                    >
                        {/* ── Login Panel ── */}
                        <div className="w-1/2 p-6 sm:p-8 shrink-0">
                            <div className="mb-6">
                                <h1 className="text-xl font-semibold text-gray-900">Welcome back</h1>
                                <p className="text-sm text-gray-500 mt-1">Sign in to access your account</p>
                            </div>

                            {loginError && (
                                <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                        <span>{loginError}</span>
                                    </div>
                                    {isUnverifiedError && (
                                        <Link
                                            href={`/verify-otp?email=${encodeURIComponent(loginEmail)}`}
                                            className="text-xs text-blue-600 hover:underline font-medium ml-6"
                                        >
                                            Click here to verify your email with OTP →
                                        </Link>
                                    )}
                                </div>
                            )}

                            <form onSubmit={handleLogin} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Email address</label>
                                    <input
                                        type="email"
                                        required
                                        value={loginEmail}
                                        onChange={(e) => setLoginEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Password</label>
                                    <input
                                        type="password"
                                        required
                                        value={loginPassword}
                                        onChange={(e) => setLoginPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all text-sm"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loginLoading}
                                    className="w-full py-2.5 px-4 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {loginLoading ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <span>Signing in...</span>
                                        </>
                                    ) : (
                                        <span>Sign in</span>
                                    )}
                                </button>
                            </form>

                            <div className="mt-6 text-center text-sm text-gray-500">
                                Don&apos;t have an account?{" "}
                                <Link href="/register" className="text-gray-900 hover:underline font-medium">
                                    Register now
                                </Link>
                            </div>
                        </div>

                        {/* ── Register Panel ── */}
                        <div className="w-1/2 p-6 sm:p-8 shrink-0">
                            <div className="mb-6">
                                <h1 className="text-xl font-semibold text-gray-900">Create an account</h1>
                                <p className="text-sm text-gray-500 mt-1">Join Echo Chat to start connecting</p>
                            </div>

                            {registerError && (
                                <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm flex items-center gap-2">
                                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    <span>{registerError}</span>
                                </div>
                            )}

                            <form onSubmit={handleRegister} className="space-y-3.5">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Full name</label>
                                        <input
                                            type="text"
                                            name="fullname"
                                            required
                                            value={formData.fullname}
                                            onChange={handleChange}
                                            placeholder="John Doe"
                                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all text-sm"
                                        />
                                        {fieldErrors.fullname && (
                                            <p className="text-xs text-red-500 mt-1">{fieldErrors.fullname[0]}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Username</label>
                                        <input
                                            type="text"
                                            name="username"
                                            required
                                            value={formData.username}
                                            onChange={handleChange}
                                            placeholder="johndoe"
                                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all text-sm"
                                        />
                                        {fieldErrors.username && (
                                            <p className="text-xs text-red-500 mt-1">{fieldErrors.username[0]}</p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Email address</label>
                                    <input
                                        type="email"
                                        name="email"
                                        required
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="john@example.com"
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all text-sm"
                                    />
                                    {fieldErrors.email && (
                                        <p className="text-xs text-red-500 mt-1">{fieldErrors.email[0]}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Phone number (optional)</label>
                                    <input
                                        type="text"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="+1234567890"
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all text-sm"
                                    />
                                    {fieldErrors.phone && (
                                        <p className="text-xs text-red-500 mt-1">{fieldErrors.phone[0]}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Password</label>
                                        <input
                                            type="password"
                                            name="password"
                                            required
                                            value={formData.password}
                                            onChange={handleChange}
                                            placeholder="••••••••"
                                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all text-sm"
                                        />
                                        {fieldErrors.password && (
                                            <p className="text-xs text-red-500 mt-1">{fieldErrors.password[0]}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Confirm password</label>
                                        <input
                                            type="password"
                                            name="confirmPassword"
                                            required
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            placeholder="••••••••"
                                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all text-sm"
                                        />
                                        {fieldErrors.confirmPassword && (
                                            <p className="text-xs text-red-500 mt-1">{fieldErrors.confirmPassword[0]}</p>
                                        )}
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={registerLoading}
                                    className="w-full py-2.5 px-4 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                                >
                                    {registerLoading ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <span>Creating account...</span>
                                        </>
                                    ) : (
                                        <span>Register & send OTP</span>
                                    )}
                                </button>
                            </form>

                            <div className="mt-5 text-center text-sm text-gray-500">
                                Already have an account?{" "}
                                <Link href="/login" className="text-gray-900 hover:underline font-medium">
                                    Sign in
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}