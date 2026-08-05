"use client";

import { useSession } from "next-auth/react";
import { AdminHeader } from "@/src/components/admin/admin-header";
import { StatsOverview } from "@/src/components/admin/stats-overview";
import { ActionAlert } from "@/src/components/admin/action-alert";
import { UserTable } from "@/src/components/admin/user-table";
import { useAdminUsers } from "@/src/components/admin/use-admin-users";

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-300">
      <div className="flex items-center gap-3">
        <svg className="animate-spin h-6 w-6 text-indigo-500" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <span>Loading Admin Console...</span>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { data: session, status } = useSession();
  const {
    users,
    search,
    setSearch,
    isLoading,
    actionMessage,
    dismissMessage,
    toggleRole,
    toggleVerified,
    deleteUser,
    refetch,
  } = useAdminUsers();

  if (status === "loading") {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
      <AdminHeader displayName={session?.user?.username || session?.user?.email} />

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        <ActionAlert message={actionMessage} onDismiss={dismissMessage} />

        <StatsOverview users={users} />

        <UserTable
          users={users}
          currentUserId={session?.user?.id}
          search={search}
          onSearchChange={setSearch}
          onRefetch={refetch}
          isLoading={isLoading}
          onToggleRole={toggleRole}
          onToggleVerified={toggleVerified}
          onDelete={deleteUser}
        />
      </main>
    </div>
  );
}