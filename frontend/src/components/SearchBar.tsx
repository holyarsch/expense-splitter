import { Search, X } from "lucide-react";

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

export default function SearchBar({ value, onChange, placeholder = "Search groups…" }: Props) {
  return (
    <div className="relative flex-1 min-w-[180px]">
      <Search size={16} strokeWidth={2.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-gv-fg3 pointer-events-none" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="brutal-input w-full pl-9 pr-8"
        aria-label="Search groups"
      />
      {value && (
        <button onClick={() => onChange("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gv-fg3 hover:text-gv-red" aria-label="Clear search">
          <X size={15} />
        </button>
      )}
    </div>
  );
}
