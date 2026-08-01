import Modal from "./Modal";
import Button from "./Button";
import { FileDown } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onExport: (theme: "light" | "dark") => void;
}

export default function PdfExportModal({ open, onClose, onExport }: Props) {
  return (
    <Modal open={open} onClose={onClose} title="Export report" maxWidth="max-w-sm">
      <p className="text-sm text-gv-fg2 mb-5 font-sans">Choose a theme for the PDF expense report.</p>
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => onExport("light")}
          className="brutal-btn flex flex-col items-center gap-2 py-5 bg-[#fbf1c7] text-[#3c3836] border-[#3c3836]"
        >
          <FileDown size={22} />
          <span className="text-xs">Light</span>
        </button>
        <button
          onClick={() => onExport("dark")}
          className="brutal-btn flex flex-col items-center gap-2 py-5 bg-[#282828] text-[#ebdbb2] border-[#ebdbb2]"
        >
          <FileDown size={22} />
          <span className="text-xs">Dark (Hard)</span>
        </button>
      </div>
    </Modal>
  );
}
