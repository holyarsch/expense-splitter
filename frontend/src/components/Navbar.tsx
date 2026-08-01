import { Link, useNavigate } from "react-router-dom";
import { Wallet, LogOut, UserRound } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import Badge from "./Badge";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const { user, isGuest, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <header className="border-b-3 border-gv-fg1 bg-gv-bg0 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        <Link to="/groups" className="flex items-center gap-2.5">
          <span className="brutal-border bg-gv-yellow p-1.5">
            <Wallet size={20} strokeWidth={2.5} className="text-gv-bg0h" />
          </span>
          <span className="font-display text-lg sm:text-xl tracking-tight text-gv-fg1 hidden xs:inline">Expense Splitter</span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          {isGuest ? (
            <Badge color="var(--gv-orange)">
              <UserRound size={12} /> Guest
            </Badge>
          ) : (
            user && (
              <span className="hidden sm:flex items-center gap-1.5 font-mono text-xs text-gv-fg2">
                <UserRound size={14} /> {user.username}
              </span>
            )
          )}
          <ThemeToggle />
          <button
            onClick={handleLogout}
            className="brutal-border bg-gv-bg0 p-2 shadow-brutal-sm hover:shadow-brutal-hover hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut size={18} className="text-gv-red" />
          </button>
        </div>
      </div>
    </header>
  );
}
