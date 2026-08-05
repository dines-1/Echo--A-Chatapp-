import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface VerificationToggleProps {
    isVerified: boolean;
    onToggle: () => void;
    disabled?: boolean;
}

export function VerificationToggle({ isVerified, onToggle, disabled }: VerificationToggleProps) {
    return (
        <button onClick={onToggle} disabled={disabled} className="disabled:opacity-40" type="button">
            <Badge
                variant="outline"
                className={cn(
                    "font-semibold cursor-pointer transition-colors",
                    isVerified
                        ? "bg-emerald-950/80 border-emerald-700 text-emerald-300 hover:bg-emerald-900"
                        : "bg-amber-950/80 border-amber-700 text-amber-300 hover:bg-amber-900"
                )}
            >
                {isVerified ? "Verified ✓" : "Unverified ✕"}
            </Badge>
        </button>
    );
}