import { useCallback, useEffect, useOptimistic, useRef, useState, useTransition } from "react";
import type { ActionMessage, ManagedUser, UserPatch, UserRole } from "../../types/User";
import { useDebouncedValue } from "./use-debounced-value";

interface UseAdminUsersResult {
    users: ManagedUser[];
    search: string;
    setSearch: (value: string) => void;
    isLoading: boolean;
    isRefetching: boolean;
    actionMessage: ActionMessage | null;
    dismissMessage: () => void;
    toggleRole: (userId: string, currentRole: UserRole) => Promise<void>;
    toggleVerified: (userId: string, currentStatus: boolean) => Promise<void>;
    deleteUser: (userId: string, username: string) => Promise<void>;
    refetch: () => Promise<void>;
}

async function patchUser(userId: string, patch: UserPatch) {
    const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ...patch }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Request failed");
    return data;
}

export function useAdminUsers(): UseAdminUsersResult {
    const [users, setUsers] = useState<ManagedUser[]>([]);
    const [search, setSearch] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isPending, startTransition] = useTransition();
    const [actionMessage, setActionMessage] = useState<ActionMessage | null>(null);

    const debouncedSearch = useDebouncedValue(search);
    const isFirstLoad = useRef(true);

    const [optimisticUsers, applyOptimisticPatch] = useOptimistic(
        users,
        (state, { userId, patch }: { userId: string; patch: UserPatch }) =>
            state.map((u) => (u._id === userId ? { ...u, ...patch } : u))
    );

    const fetchUsers = useCallback(async (query: string) => {
        const res = await fetch(`/api/admin/users?search=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (res.ok && data.users) {
            setUsers(data.users);
        }
        return data;
    }, []);

    const refetch = useCallback(async () => {
        await fetchUsers(debouncedSearch);
    }, [fetchUsers, debouncedSearch]);

    useEffect(() => {
        const load = async () => {
            if (isFirstLoad.current) setIsLoading(true);
            try {
                await fetchUsers(debouncedSearch);
            } catch (err) {
                console.error("Failed to load users:", err);
            } finally {
                setIsLoading(false);
                isFirstLoad.current = false;
            }
        };
        startTransition(() => {
            load();
        });
    }, [debouncedSearch, fetchUsers]);

    const dismissMessage = useCallback(() => setActionMessage(null), []);

    const toggleRole = useCallback(
        async (userId: string, currentRole: UserRole) => {
            const newRole: UserRole = currentRole === "admin" ? "customer" : "admin";
            applyOptimisticPatch({ userId, patch: { role: newRole } });
            try {
                await patchUser(userId, { role: newRole });
                setActionMessage({ text: `User role updated to ${newRole}`, type: "success" });
                await refetch();
            } catch (err) {
                setActionMessage({
                    text: err instanceof Error ? err.message : "Failed to update user role",
                    type: "error",
                });
            }
        },
        [applyOptimisticPatch, refetch]
    );

    const toggleVerified = useCallback(
        async (userId: string, currentStatus: boolean) => {
            const nextStatus = !currentStatus;
            applyOptimisticPatch({ userId, patch: { isVerified: nextStatus } });
            try {
                await patchUser(userId, { isVerified: nextStatus });
                setActionMessage({ text: `User verification set to ${nextStatus}`, type: "success" });
                await refetch();
            } catch (err) {
                setActionMessage({
                    text: err instanceof Error ? err.message : "Failed to update verification status",
                    type: "error",
                });
            }
        },
        [applyOptimisticPatch, refetch]
    );

    const deleteUser = useCallback(
        async (userId: string, username: string) => {
            try {
                const res = await fetch(`/api/admin/users?userId=${encodeURIComponent(userId)}`, {
                    method: "DELETE",
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "Failed to delete user");

                setActionMessage({ text: `User @${username} deleted successfully`, type: "success" });
                await refetch();
            } catch (err) {
                setActionMessage({
                    text: err instanceof Error ? err.message : "Error deleting user account",
                    type: "error",
                });
            }
        },
        [refetch]
    );

    return {
        users: optimisticUsers,
        search,
        setSearch,
        isLoading,
        isRefetching: isPending && !isLoading,
        actionMessage,
        dismissMessage,
        toggleRole,
        toggleVerified,
        deleteUser,
        refetch,
    };
}