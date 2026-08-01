import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Users, Receipt, Crown, PenLine, Eye, Trash2, FolderKanban } from "lucide-react";
import Navbar from "@/components/Navbar";
import Card from "@/components/Card";
import Button from "@/components/Button";
import Badge from "@/components/Badge";
import GroupFormModal from "@/components/GroupFormModal";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useAuth } from "@/context/AuthContext";
import { data } from "@/lib/dataLayer";
import { GroupSummary } from "@/types";

const ROLE_COLOR: Record<string, string> = {
  OWNER: "var(--gv-yellow)",
  EDITOR: "var(--gv-aqua)",
  VIEWER: "var(--gv-blue)",
};
const ROLE_ICON: Record<string, JSX.Element> = {
  OWNER: <Crown size={11} />,
  EDITOR: <PenLine size={11} />,
  VIEWER: <Eye size={11} />,
};

export default function Groups() {
  const { isGuest } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<GroupSummary | null>(null);
  const [deleting, setDeleting] = useState<GroupSummary | null>(null);

  const load = useCallback(
    async (q?: string) => {
      setLoading(true);
      try {
        const res = await data.listGroups(isGuest, q);
        setGroups(res);
      } finally {
        setLoading(false);
      }
    },
    [isGuest]
  );

  useEffect(() => {
    load(query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGuest]);

  function runSearch() {
    setQuery(searchInput);
    load(searchInput);
  }

  async function handleCreateOrEdit(name: string, description: string) {
    if (editing) await data.updateGroup(isGuest, editing.id, { name, description });
    else await data.createGroup(isGuest, name, description);
    setEditing(null);
    await load(query);
  }

  async function handleDelete() {
    if (!deleting) return;
    await data.deleteGroup(isGuest, deleting.id);
    setDeleting(null);
    await load(query);
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl text-gv-fg1 tracking-tight">Your Groups</h1>
            <p className="font-mono text-xs text-gv-fg3 mt-1">
              {isGuest ? "Local guest data — nothing leaves this device." : "Create a group, add people, and start splitting."}
            </p>
          </div>
          <Button
            icon={<Plus size={18} />}
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
          >
            New group
          </Button>
        </div>

        <div className="flex gap-2 mb-6">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={16} strokeWidth={2.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-gv-fg3 pointer-events-none" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runSearch()}
              placeholder="Search groups by name or description…"
              className="brutal-input w-full pl-9"
              aria-label="Search groups"
            />
          </div>
          <Button variant="secondary" icon={<Search size={16} />} onClick={runSearch}>
            Search Group
          </Button>
        </div>

        {loading ? (
          <p className="font-mono text-sm text-gv-fg3">Loading groups…</p>
        ) : groups.length === 0 ? (
          <Card className="p-10 text-center">
            <FolderKanban size={40} className="mx-auto text-gv-fg3 mb-3" />
            <p className="font-accent font-bold text-gv-fg2">No groups yet</p>
            <p className="font-mono text-xs text-gv-fg3 mt-1">Create your first group to start tracking shared expenses.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {groups.map((g) => (
              <Card key={g.id} accent={ROLE_COLOR[g.role]} className="p-5 cursor-pointer group" onClick={() => navigate(`/groups/${g.id}`)}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-accent font-bold text-lg text-gv-fg1 leading-tight">{g.name}</h3>
                  <Badge color={ROLE_COLOR[g.role]}>
                    {ROLE_ICON[g.role]} {g.role}
                  </Badge>
                </div>
                {g.description && <p className="text-sm text-gv-fg3 mb-4 line-clamp-2 font-sans">{g.description}</p>}
                <div className="flex items-center gap-4 font-mono text-xs text-gv-fg2 mb-4">
                  <span className="flex items-center gap-1">
                    <Users size={13} /> {g.peopleCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <Receipt size={13} /> {g.billCount}
                  </span>
                  {!isGuest && <span className="text-gv-fg3">by {g.ownerUsername}</span>}
                </div>
                {g.role === "OWNER" && (
                  <div className="flex gap-2 pt-3 border-t-2 border-gv-bg2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditing(g);
                        setModalOpen(true);
                      }}
                      className="text-xs font-mono text-gv-blue hover:underline flex items-center gap-1"
                    >
                      <PenLine size={12} /> Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleting(g);
                      }}
                      className="text-xs font-mono text-gv-red hover:underline flex items-center gap-1"
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </main>

      <GroupFormModal
        open={modalOpen}
        existing={editing}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSubmit={handleCreateOrEdit}
      />
      <ConfirmDialog
        open={!!deleting}
        title="Delete group"
        message={`Delete "${deleting?.name}" and all its people, bills, and history? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
