import { Input } from "@/components/ui/input";

interface UserSearchBarProps {
    value: string;
    onChange: (value: string) => void;
}

export function UserSearchBar({ value, onChange }: UserSearchBarProps) {
    return (
        <Input
            type="text"
            placeholder="Search by name, username, email..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="px-4 py-2 bg-slate-800 border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus-visible:ring-indigo-500 w-64"
        />
    );
}