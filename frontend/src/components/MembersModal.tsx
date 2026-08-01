import { useState, FormEvent } from "react";
import Modal from "./Modal";
import { Input } from "./Input";
import Button from "./Button";
import Badge from "./Badge";
import { Member, Role } from "@/types";
import { UserPlus, Trash2, Crown, PenLine, Eye, AlertTriangle } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  members: Member[];
  ownerUsername: string;
  onInvite: (identifier: string, role: Role) => Promise<void>;
  onChangeRole: (memberId: string, role: Role) => Promise<void>;
  onRemove: (memberId: string) => Promise<void>;
}

const ROLE_COLOR: Record<string, string> = { OWNER: "var(--gv-yellow)", EDITOR: "var(--gv-aqua)", VIEWER: "var(--gv-blue)" };
const ROLE_ICON: Record<string, JSX.Element> = { OWNER: <Crown size={11} />, EDITOR: <PenLine size={11} />, VIEWER: <Eye size={11} /> };

export default function MembersModal({ open, onClose, members, ownerUsername, onInvite, onChangeRole, onRemove }: Props) {
  const [identifier, setIdentifier] = useState("");
  const [role, setRole] = useState<Role>("VIEWER");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleInvite(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await onInvite(identifier.trim(), role);
      setIdentifier("");
    } catch (err: any) {
      setError(err?.message || "Failed to add member");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Members & access">
      <div className="mb-5">
        <div className="flex items-center justify-between px-3 py-2 brutal-border bg-gv-bg1 mb-2">
          <span className="font-sans text-sm text-gv-fg1">{ownerUsername}</span>
          <Badge color={ROLE_COLOR.OWNER}>{ROLE_ICON.OWNER} Owner</Badge>
        </div>
        {members.map((m) => (
          <div key={m.id} className="flex items-center justify-between px-3 py-2 brutal-border bg-gv-bg0 mb-2">
            <div>
              <p className="font-sans text-sm text-gv-fg1">{m.username}</p>
              <p className="font-mono text-[11px] text-gv-fg3">{m.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <select value={m.role} onChange={(e) => onChangeRole(m.id, e.target.value as Role)} className="brutal-input text-xs py-1 px-2">
                <option value="EDITOR">Editor</option>
                <option value="VIEWER">Viewer</option>
              </select>
              <button onClick={() => onRemove(m.id)} className="text-gv-red hover:opacity-70" aria-label="Remove member">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
        {members.length === 0 && <p className="font-mono text-xs text-gv-fg3">No additional members yet.</p>}
      </div>

      <form onSubmit={handleInvite} className="space-y-3 pt-3 border-t-3 border-gv-fg1">
        <p className="font-accent font-bold text-xs uppercase tracking-wider text-gv-fg2">Add someone</p>
        <div className="flex gap-2">
          <Input value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="username or email" required className="flex-1" />
          <select value={role} onChange={(e) => setRole(e.target.value as Role)} className="brutal-input">
            <option value="VIEWER">Viewer</option>
            <option value="EDITOR">Editor</option>
          </select>
        </div>
        {error && (
          <div className="brutal-border border-gv-red bg-gv-bg1 px-3 py-2 flex items-center gap-2 text-gv-red text-xs font-mono">
            <AlertTriangle size={14} /> {error}
          </div>
        )}
        <Button type="submit" fullWidth disabled={saving || !identifier.trim()} icon={<UserPlus size={16} />}>
          Add member
        </Button>
      </form>
    </Modal>
  );
}
