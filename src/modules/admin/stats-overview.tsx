import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ManagedUser } from "../../types/User";

interface StatCardProps {
    label: string;
    value: number;
    hint: string;
    accentClassName?: string;
}

function StatCard({ label, value, hint, accentClassName }: StatCardProps) {
    return (
        <Card className="bg-slate-900/70 border-slate-800 rounded-2xl">
            <CardContent className="p-5">
                <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                    {label}
                </div>
                <div className={cn("text-3xl font-extrabold mt-2 text-white", accentClassName)}>
                    {value}
                </div>
                <div className={cn("text-xs mt-1 text-slate-400", accentClassName && `${accentClassName}/80`)}>
                    {hint}
                </div>
            </CardContent>
        </Card>
    );
}

/**
 * Derives all four summary stats from the user list in a single memoized
 * pass, so the numbers only recompute when the underlying list changes —
 * not on every unrelated re-render (e.g. typing in the search box).
 */
export function StatsOverview({ users }: { users: ManagedUser[] }) {
    const stats = useMemo(() => {
        const totalCustomers = users.filter((u) => u.role === "customer").length;
        const totalAdmins = users.filter((u) => u.role === "admin").length;
        const verifiedUsers = users.filter((u) => u.isVerified).length;
        return { total: users.length, totalCustomers, totalAdmins, verifiedUsers };
    }, [users]);

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Accounts" value={stats.total} hint="All registered accounts" />
            <StatCard
                label="Customer Accounts"
                value={stats.totalCustomers}
                hint="Active customer users"
                accentClassName="text-blue-400"
            />
            <StatCard
                label="Admin Accounts"
                value={stats.totalAdmins}
                hint="System administrators"
                accentClassName="text-indigo-400"
            />
            <StatCard
                label="Verified Accounts"
                value={stats.verifiedUsers}
                hint="Email verified"
                accentClassName="text-emerald-400"
            />
        </div>
    );
}