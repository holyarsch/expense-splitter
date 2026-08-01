import { ReactNode } from "react";

export default function Badge({ children, color = "var(--gv-fg1)" }: { children: ReactNode; color?: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider brutal-border"
      style={{ color, borderColor: color }}
    >
      {children}
    </span>
  );
}
