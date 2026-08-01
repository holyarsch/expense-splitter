import { ReactNode, useEffect } from "react";
import { X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: string;
}

export default function Modal({ open, onClose, title, children, maxWidth = "max-w-lg" }: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center overflow-y-auto bg-gv-bg0h/70 backdrop-blur-[2px] p-4 py-8" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`w-full ${maxWidth} brutal-border bg-gv-bg0 shadow-brutal-lg`}>
        <div className="flex items-center justify-between px-5 py-4 border-b-3 border-gv-fg1 bg-gv-yellow">
          <h2 className="font-display text-lg text-gv-bg0h uppercase tracking-tight">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="brutal-border bg-gv-bg0 p-1 hover:shadow-brutal-hover hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all">
            <X size={18} strokeWidth={2.5} className="text-gv-fg1" />
          </button>
        </div>
        <div className="p-5 max-h-[75vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
