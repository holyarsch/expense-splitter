import { useState, FormEvent, useEffect } from "react";
import Modal from "./Modal";
import { Input } from "./Input";
import Button from "./Button";
import { Person } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (name: string) => Promise<void>;
  existing?: Person | null;
}

export default function PersonFormModal({ open, onClose, onSubmit, existing }: Props) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setName(existing?.name ?? "");
  }, [open, existing]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit(name.trim());
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={existing ? "Edit person" : "Add person"} maxWidth="max-w-sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Priya" required autoFocus />
        <div className="flex justify-end gap-3 pt-1">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving || !name.trim()}>
            {existing ? "Save" : "Add"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
