import { useState, FormEvent, useEffect } from "react";
import Modal from "./Modal";
import { Input, TextArea } from "./Input";
import Button from "./Button";
import { GroupSummary } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (name: string, description: string) => Promise<void>;
  existing?: GroupSummary | null;
}

export default function GroupFormModal({ open, onClose, onSubmit, existing }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(existing?.name ?? "");
      setDescription(existing?.description ?? "");
    }
  }, [open, existing]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit(name.trim(), description.trim());
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={existing ? "Edit group" : "New group"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Group name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Goa Trip 2026" required autoFocus />
        <TextArea label="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="A short note about this group" rows={3} />
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving || !name.trim()}>
            {existing ? "Save changes" : "Create group"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
