import { memo } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { RoleBadge } from "./role-badge";
import { VerificationToggle } from "./verification-toggle";
import { DeleteUserDialog } from "./delete-user-dialog";
import type { ManagedUser } from "../../types/User";

interface UserRowProps {
    user: ManagedUser;
    isSelf: boolean;
    onToggleRole: (userId: string, currentRole: ManagedUser["role"]) => void;
    onToggleVerified: (userId: string, currentStatus: boolean) => void;
    onDelete: (userId: string, username: string) => void;
}

function UserRowImpl({ user, isSelf, onToggleRole, onToggleVerified, onDelete }: UserRowProps) {
    return (
        <TableRow className="hover:bg-slate-800/40 transition-colors">
            <TableCell className="px-4 py-3.5">
                <div className="font-semibold text-slate-100">{user.fullname || user.username}</div>
                <div className="text-xs text-slate-400">
                    @{user.username} • {user.email}
                </div>
            </TableCell>

            <TableCell className="px-4 py-3.5">
                <RoleBadge role={user.role} />
            </TableCell>

            <TableCell className="px-4 py-3.5">
                <VerificationToggle
                    isVerified={user.isVerified}
                    onToggle={() => onToggleVerified(user._id, user.isVerified)}
                />
            </TableCell>

            <TableCell className="px-4 py-3.5 text-xs text-slate-400">{user.phone || "—"}</TableCell>

            <TableCell className="px-4 py-3.5 text-right space-x-2">
                <Button
                    variant="secondary"
                    size="sm"
                    disabled={isSelf}
                    onClick={() => onToggleRole(user._id, user.role)}
                    className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg text-xs font-medium disabled:opacity-40"
                >
                    Make {user.role === "admin" ? "Customer" : "Admin"}
                </Button>

                <DeleteUserDialog
                    username={user.username}
                    disabled={isSelf}
                    onConfirm={() => onDelete(user._id, user.username)}
                />
            </TableCell>
        </TableRow>
    );
}

export const UserRow = memo(UserRowImpl, (prev, next) => {
    return (
        prev.user === next.user &&
        prev.isSelf === next.isSelf &&
        prev.onToggleRole === next.onToggleRole &&
        prev.onToggleVerified === next.onToggleVerified &&
        prev.onDelete === next.onDelete
    );
});