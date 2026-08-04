import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { UserRole } from "../../types/User";

export function RoleBadge({ role }: { role: UserRole }) {
    return (
        <Badge
            variant="outline"
            className={cn(
                "capitalize font-semibold",
                role === "admin"
                    ? "bg-indigo-950/80 border-indigo-700 text-indigo-300"
                    : "bg-blue-950/80 border-blue-700 text-blue-300"
            )}
        >
            {role}
        </Badge>
    );
}