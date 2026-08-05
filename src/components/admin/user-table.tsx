import {
    Table,
    TableBody,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { UserSearchBar } from "./user-search-bar";
import { UserRow } from "./user-row";
import type { ManagedUser, UserRole } from "../../types/User";

interface UserTableProps {
    users: ManagedUser[];
    currentUserId?: string;
    search: string;
    onSearchChange: (value: string) => void;
    onRefetch: () => void;
    isLoading: boolean;
    onToggleRole: (userId: string, currentRole: UserRole) => void;
    onToggleVerified: (userId: string, currentStatus: boolean) => void;
    onDelete: (userId: string, username: string) => void;
}

function LoadingRows() {
    return (
        <>
            {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                    <td colSpan={5} className="px-4 py-3.5">
                        <Skeleton className="h-8 w-full bg-slate-800/60" />
                    </td>
                </TableRow>
            ))}
        </>
    );
}

export function UserTable({
    users,
    currentUserId,
    search,
    onSearchChange,
    onRefetch,
    isLoading,
    onToggleRole,
    onToggleVerified,
    onDelete,
}: UserTableProps) {
    return (
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-lg font-bold text-slate-100">User Management Table</h2>
                    <p className="text-xs text-slate-400">
                        View, update roles, toggle verification, or delete user accounts
                    </p>
                </div>

                <div className="flex gap-2">
                    <UserSearchBar value={search} onChange={onSearchChange} />
                    <Button
                        onClick={onRefetch}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold"
                    >
                        Search
                    </Button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <Table className="w-full text-left text-sm text-slate-300">
                    <TableHeader className="bg-slate-800/80 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-700">
                        <TableRow>
                            <TableHead className="px-4 py-3 rounded-l-lg text-slate-400">User Info</TableHead>
                            <TableHead className="px-4 py-3 text-slate-400">Role</TableHead>
                            <TableHead className="px-4 py-3 text-slate-400">Verification</TableHead>
                            <TableHead className="px-4 py-3 text-slate-400">Phone</TableHead>
                            <TableHead className="px-4 py-3 rounded-r-lg text-right text-slate-400">
                                Actions
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-slate-800/60">
                        {isLoading ? (
                            <LoadingRows />
                        ) : users.length === 0 ? (
                            <TableRow>
                                <td colSpan={5} className="py-8 text-center text-slate-500 text-xs">
                                    No users found.
                                </td>
                            </TableRow>
                        ) : (
                            users.map((user) => (
                                <UserRow
                                    key={user._id}
                                    user={user}
                                    isSelf={user._id === currentUserId}
                                    onToggleRole={onToggleRole}
                                    onToggleVerified={onToggleVerified}
                                    onDelete={onDelete}
                                />
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}