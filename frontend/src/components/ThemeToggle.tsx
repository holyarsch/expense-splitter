import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="brutal-border bg-gv-bg0 p-2 shadow-brutal-sm hover:shadow-brutal-hover hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all"
      title={theme === "light" ? "Switch to dark (Gruvbox Hard)" : "Switch to light"}
    >
      {theme === "light" ? <Moon size={18} className="text-gv-fg1" /> : <Sun size={18} className="text-gv-yellow" />}
    </button>
  );
}
