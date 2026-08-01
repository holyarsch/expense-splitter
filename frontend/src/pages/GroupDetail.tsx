import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Users,
  Receipt,
  LayoutDashboard,
  Shield,
  PenLine,
  Trash2,
  FileDown,
  CheckCircle2,
  ArrowRight,
  Lock,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Card from "@/components/Card";
import Button from "@/components/Button";
import Badge from "@/components/Badge";
import ConfirmDialog from "@/components/ConfirmDialog";
import PersonFormModal from "@/components/PersonFormModal";
import BillFormModal from "@/components/BillFormModal";
import MembersModal from "@/components/MembersModal";
import PdfExportModal from "@/components/PdfExportModal";
import { useAuth } from "@/context/AuthContext";
import { data } from "@/lib/dataLayer";
import { GroupDetail as GroupDetailType, Bill, Person, Role } from "@/types";
import { exportExpenseReportPdf } from "@/lib/pdfExport";

type Tab = "people" | "bills" | "dashboard" | "members";

export default function GroupDetail() {
  const { groupId } = useParams<{ groupId: string }>();
  const { isGuest, user } = useAuth();
  const navigate = useNavigate();

  const [group, setGroup] = useState<GroupDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("people");

  const [personModal, setPersonModal] = useState<{ open: boolean; existing?: Person | null }>({ open: false });
  const [billModal, setBillModal] = useState<{ open: boolean; existing?: Bill | null }>({ open: false });
  const [membersOpen, setMembersOpen] = useState(false);
  const [pdfOpen, setPdfOpen] = useState(false);
  const [deletePerson, setDeletePerson] = useState<Person | null>(null);
  const [deleteBill, setDeleteBill] = useState<Bill | null>(null);

  const load = useCallback(async () => {
    if (!groupId) return;
    setLoading(true);
    try {
      const g = await data.getGroup(isGuest, groupId);
      setGroup(g);
    } finally {
      setLoading(false);
    }
  }, [groupId, isGuest]);

  useEffect(() => {
    load();
  }, [load]);

  const role: Role = useMemo(() => {
    if (isGuest) return "OWNER";
    if (!group || !user) return "VIEWER";
    if (group.ownerId === user.id) return "OWNER";
    return group.members.find((m) => m.userId === user.id)?.role ?? "VIEWER";
  }, [group, user, isGuest]);

  const canEdit = role === "OWNER" || role === "EDITOR";
  const isOwner = role === "OWNER";

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <p className="text-center font-mono text-sm text-gv-fg3 mt-10">Loading group…</p>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <p className="text-center font-mono text-sm text-gv-fg3 mt-10">Group not found.</p>
      </div>
    );
  }

  async function handleAddOrEditPerson(name: string) {
    if (personModal.existing) await data.updatePerson(isGuest, group!.id, personModal.existing.id, name);
    else await data.addPerson(isGuest, group!.id, name);
    await load();
  }

  async function handleAddOrEditBill(bill: Omit<Bill, "id" | "createdAt">) {
    if (billModal.existing) await data.updateBill(isGuest, group!.id, billModal.existing.id, bill);
    else await data.addBill(isGuest, group!.id, bill);
    await load();
  }

  function personName(id: string | null) {
    return group!.people.find((p) => p.id === id)?.name ?? "Unknown";
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <button onClick={() => navigate("/groups")} className="flex items-center gap-1.5 text-sm font-mono text-gv-fg3 hover:text-gv-fg1 mb-4">
          <ArrowLeft size={15} /> All groups
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl text-gv-fg1 tracking-tight">{group.name}</h1>
            {group.description && <p className="text-sm text-gv-fg3 mt-1 font-sans">{group.description}</p>}
          </div>
          <div className="flex items-center gap-2">
            {!isGuest && isOwner && (
              <Button variant="secondary" icon={<Shield size={16} />} onClick={() => setMembersOpen(true)}>
                Members
              </Button>
            )}
            <Button variant="secondary" icon={<FileDown size={16} />} onClick={() => setPdfOpen(true)}>
              Export PDF
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {(
            [
              ["people", "People", <Users size={15} key="i" />],
              ["bills", "Bills", <Receipt size={15} key="i" />],
              ["dashboard", "Dashboard", <LayoutDashboard size={15} key="i" />],
            ] as [Tab, string, JSX.Element][]
          ).map(([key, label, icon]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`brutal-btn px-4 py-2 text-xs flex items-center gap-1.5 ${tab === key ? "bg-gv-yellow text-gv-bg0h" : "bg-gv-bg0 text-gv-fg1"}`}
            >
              {icon} {label}
            </button>
          ))}
        </div>

        {!canEdit && (
          <div className="brutal-border border-gv-blue bg-gv-bg1 px-3 py-2 flex items-center gap-2 text-gv-blue text-xs font-mono mb-5">
            <Lock size={14} /> You have viewer access — changes are disabled.
          </div>
        )}

        {tab === "people" && (
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-accent font-bold text-gv-fg2 text-sm uppercase tracking-wide">People ({group.people.length})</h2>
              {canEdit && (
                <Button icon={<Plus size={16} />} onClick={() => setPersonModal({ open: true, existing: null })}>
                  Add person
                </Button>
              )}
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {group.people.map((p) => {
                const bal = group.balances[p.id] ?? 0;
                const color = bal > 0.01 ? "var(--gv-green)" : bal < -0.01 ? "var(--gv-red)" : "var(--gv-fg3)";
                return (
                  <Card key={p.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-sans font-semibold text-gv-fg1">{p.name}</p>
                      <p className="font-mono text-xs mt-0.5" style={{ color }}>
                        {bal > 0.01 ? `+${bal.toFixed(2)} owed` : bal < -0.01 ? `${bal.toFixed(2)} owes` : "settled"}
                      </p>
                    </div>
                    {canEdit && (
                      <div className="flex gap-2">
                        <button onClick={() => setPersonModal({ open: true, existing: p })} className="text-gv-blue" aria-label="Edit person">
                          <PenLine size={16} />
                        </button>
                        <button onClick={() => setDeletePerson(p)} className="text-gv-red" aria-label="Remove person">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </Card>
                );
              })}
              {group.people.length === 0 && <p className="font-mono text-xs text-gv-fg3">No people yet — add the first one.</p>}
            </div>
          </section>
        )}

        {tab === "bills" && (
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-accent font-bold text-gv-fg2 text-sm uppercase tracking-wide">Bills ({group.bills.length})</h2>
              {canEdit && (
                <Button icon={<Plus size={16} />} onClick={() => setBillModal({ open: true, existing: null })} disabled={group.people.length === 0}>
                  Add bill
                </Button>
              )}
            </div>
            <div className="space-y-3">
              {group.bills.map((b) => {
                const isMulti = Object.keys(b.multiPayers).length > 0;
                const hasIndividual = Object.keys(b.individualAmounts).length > 0;
                return (
                  <Card key={b.id} className="p-4">
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <p className="font-accent font-bold text-gv-fg1">{b.title}</p>
                        {b.description && <p className="text-xs text-gv-fg3 mt-0.5 font-sans">{b.description}</p>}
                        <p className="font-mono text-xs text-gv-fg2 mt-1.5">
                          Paid by {isMulti ? "multiple contributors" : personName(b.payerId)} · {hasIndividual ? "individual split" : "even split"}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-mono font-bold text-gv-yellow text-lg">{b.total.toFixed(2)}</p>
                        {canEdit && (
                          <div className="flex gap-2 mt-1 justify-end">
                            <button onClick={() => setBillModal({ open: true, existing: b })} className="text-gv-blue" aria-label="Edit bill">
                              <PenLine size={15} />
                            </button>
                            <button onClick={() => setDeleteBill(b)} className="text-gv-red" aria-label="Delete bill">
                              <Trash2 size={15} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
              {group.bills.length === 0 && <p className="font-mono text-xs text-gv-fg3">No bills yet.</p>}
            </div>
          </section>
        )}

        {tab === "dashboard" && (
          <section className="space-y-8">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                ["People", group.people.length, "var(--gv-yellow)"],
                ["Bills", group.bills.length, "var(--gv-blue)"],
                ["Total spent", group.totalExpenses.toFixed(2), "var(--gv-orange)"],
                ["Per person", group.people.length ? (group.totalExpenses / group.people.length).toFixed(2) : "0.00", "var(--gv-aqua)"],
              ].map(([label, value, color]) => (
                <Card key={label as string} className="p-4 text-center">
                  <p className="font-mono text-[10px] uppercase text-gv-fg3">{label}</p>
                  <p className="font-display text-xl mt-1" style={{ color: color as string }}>
                    {value}
                  </p>
                </Card>
              ))}
            </div>

            <div>
              <h3 className="font-accent font-bold text-gv-orange text-sm uppercase tracking-wide mb-3">Balances</h3>
              <div className="space-y-2">
                {group.people.map((p) => {
                  const v = group.balances[p.id] ?? 0;
                  const color = v > 0.01 ? "var(--gv-green)" : v < -0.01 ? "var(--gv-red)" : "var(--gv-fg3)";
                  return (
                    <div key={p.id} className="flex justify-between items-center px-3 py-2 brutal-border bg-gv-bg0">
                      <span className="font-sans text-sm text-gv-fg1">{p.name}</span>
                      <span className="font-mono text-sm font-bold" style={{ color }}>
                        {v > 0.01 ? `+${v.toFixed(2)}` : v < -0.01 ? v.toFixed(2) : "settled"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="font-accent font-bold text-gv-aqua text-sm uppercase tracking-wide mb-3">Settlement plan</h3>
              {group.settlements.length === 0 ? (
                <p className="font-mono text-xs text-gv-green flex items-center gap-1.5">
                  <CheckCircle2 size={14} /> Nothing to settle — all balances are even.
                </p>
              ) : (
                <div className="space-y-2">
                  {group.settlements.map((s, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-2 brutal-border bg-gv-bg0 font-mono text-sm">
                      <span className="text-gv-fg1">{s.fromName}</span>
                      <ArrowRight size={14} className="text-gv-fg3" />
                      <span className="text-gv-fg1">{s.toName}</span>
                      <span className="ml-auto font-bold text-gv-yellow">{s.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      <PersonFormModal
        open={personModal.open}
        existing={personModal.existing}
        onClose={() => setPersonModal({ open: false })}
        onSubmit={handleAddOrEditPerson}
      />
      <BillFormModal
        open={billModal.open}
        existing={billModal.existing}
        people={group.people}
        onClose={() => setBillModal({ open: false })}
        onSubmit={handleAddOrEditBill}
      />
      {!isGuest && (
        <MembersModal
          open={membersOpen}
          onClose={() => setMembersOpen(false)}
          members={group.members}
          ownerUsername={group.ownerUsername}
          onInvite={async (identifier, r) => {
            await data.addMember(group.id, identifier, r);
            await load();
          }}
          onChangeRole={async (memberId, r) => {
            await data.updateMemberRole(group.id, memberId, r);
            await load();
          }}
          onRemove={async (memberId) => {
            await data.removeMember(group.id, memberId);
            await load();
          }}
        />
      )}
      <PdfExportModal
        open={pdfOpen}
        onClose={() => setPdfOpen(false)}
        onExport={(theme) => {
          exportExpenseReportPdf(group, theme);
          setPdfOpen(false);
        }}
      />
      <ConfirmDialog
        open={!!deletePerson}
        title="Remove person"
        message={`Remove ${deletePerson?.name}? Their shares in existing bills will be cleared.`}
        onConfirm={async () => {
          if (deletePerson) await data.removePerson(isGuest, group.id, deletePerson.id);
          setDeletePerson(null);
          await load();
        }}
        onCancel={() => setDeletePerson(null)}
      />
      <ConfirmDialog
        open={!!deleteBill}
        title="Delete bill"
        message={`Delete "${deleteBill?.title}"? This cannot be undone.`}
        onConfirm={async () => {
          if (deleteBill) await data.removeBill(isGuest, group.id, deleteBill.id);
          setDeleteBill(null);
          await load();
        }}
        onCancel={() => setDeleteBill(null)}
      />
    </div>
  );
}
