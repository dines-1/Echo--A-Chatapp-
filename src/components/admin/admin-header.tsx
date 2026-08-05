import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

interface AdminHeaderProps {
    displayName?: string | null;
}

export function AdminHeader({ displayName }: AdminHeaderProps) {
    return (
        <header className="bg-slate-900/90 border-b border-slate-800 px-6 py-4 flex items-center justify-between backdrop-blur-md">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-linear-to-r from-indigo-600 to-purple-600 flex items-center justify-center font-bold text-lg text-white shadow-md">
                    A
                </div>
                <div>
                    <h1 className="font-bold text-lg leading-tight">User Management Console</h1>
                    <p className="text-xs text-slate-400">Admin Control Panel (Management Only)</p>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="hidden sm:flex flex-col text-right">
                    <span className="text-sm font-semibold text-slate-200">{displayName}</span>
                    <span className="text-xs text-indigo-400 font-medium capitalize">Administrator</span>
                </div>

                <Button
                    variant="secondary"
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-sm font-medium hover:text-white"
                >
                    Sign Out
                </Button>
            </div>
        </header>
    );
}