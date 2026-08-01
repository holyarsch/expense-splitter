import { ReactNode } from "react";
import { Wallet } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

export default function AuthLayout({ children, subtitle }: { children: ReactNode; subtitle: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="flex items-center gap-3 mb-8">
        <span className="brutal-border bg-gv-yellow p-2.5 shadow-brutal-sm">
          <Wallet size={26} strokeWidth={2.5} className="text-gv-bg0h" />
        </span>
        <div>
          <h1 className="font-display text-2xl sm:text-3xl tracking-tight text-gv-fg1 leading-none">Expense Splitter</h1>
          <p className="font-mono text-xs text-gv-fg3 mt-1">{subtitle}</p>
        </div>
      </div>
      <div className="w-full max-w-md brutal-card p-6 sm:p-8">{children}</div>
    </div>
  );
}
