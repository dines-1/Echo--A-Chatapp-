import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import type { ActionMessage } from "../../types/User";

interface ActionAlertProps {
    message: ActionMessage | null;
    onDismiss: () => void;
}

export function ActionAlert({ message, onDismiss }: ActionAlertProps) {
    if (!message) return null;

    return (
        <Alert
            className={cn(
                "rounded-xl flex items-center justify-between",
                message.type === "success"
                    ? "bg-emerald-950/60 border-emerald-800 text-emerald-200"
                    : "bg-red-950/60 border-red-800 text-red-200"
            )}
        >
            <AlertDescription className="text-sm text-inherit">{message.text}</AlertDescription>
            <button
                onClick={onDismiss}
                className="text-xs opacity-70 hover:opacity-100 font-bold"
                aria-label="Dismiss message"
                type="button"
            >
                ✕
            </button>
        </Alert>
    );
}