import Link from "next/link";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
    return (
        <header className="px-8 py-6 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-lg text-white shadow-md">
                    E
                </div>
                <span className="font-extrabold text-xl tracking-tight bg-linear-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                    Echo Chat
                </span>
            </div>

            <Button
                asChild
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl shadow-md active:scale-95"
            >
                <Link href="/login">Sign In</Link>
            </Button>
        </header>
    );
}