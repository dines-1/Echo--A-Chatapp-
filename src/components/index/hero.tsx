import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function HeroSection() {
    return (
        <main className="flex-1 flex flex-col items-center justify-center text-center p-6 max-w-4xl mx-auto">
            <Badge
                variant="outline"
                className="px-4 py-1.5 bg-blue-950/80 border-blue-800/80 rounded-full text-blue-300 text-xs font-semibold uppercase tracking-wider mb-6"
            >
                Real-time communication
            </Badge>

            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight bg-linear-to-r from-slate-100 via-slate-200 to-slate-400 bg-clip-text text-transparent leading-tight mb-6">
                Seamless Communication for Customers & Admins
            </h1>

            <p className="text-lg text-slate-400 max-w-2xl mb-10 leading-relaxed">
                Log in with your credentials to access your dedicated portal. Customers are seamlessly
                routed to <code className="text-blue-400 font-mono">/chat</code> and administrators are
                routed to <code className="text-indigo-400 font-mono">/admin</code>.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-sm">
                <Button
                    asChild
                    className="w-full py-3.5 px-6 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg"
                >
                    <Link href="/login">Get Started</Link>
                </Button>
            </div>
        </main>
    );
}