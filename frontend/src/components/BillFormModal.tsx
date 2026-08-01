import { useState, useEffect, FormEvent } from "react";
import Modal from "./Modal";
import { Input, TextArea } from "./Input";
import Button from "./Button";
import { Bill, Person } from "@/types";
import { evalExpr, validateBillMismatch, round2 } from "@/lib/splitLogic";
import { Users, SplitSquareHorizontal, AlertTriangle } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  people: Person[];
  existing?: Bill | null;
  onSubmit: (bill: Omit<Bill, "id" | "createdAt">) => Promise<void>;
}

const MULTI_SENTINEL = "__multi__";

export default function BillFormModal({ open, onClose, people, existing, onSubmit }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [payerChoice, setPayerChoice] = useState<string>(people[0]?.id ?? "");
  const [splitMode, setSplitMode] = useState<"even" | "individual">("even");
  const [totalRaw, setTotalRaw] = useState("");
  const [multiChecked, setMultiChecked] = useState<Record<string, boolean>>({});
  const [multiAmounts, setMultiAmounts] = useState<Record<string, string>>({});
  const [indivAmounts, setIndivAmounts] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError("");
    if (existing) {
      setTitle(existing.title);
      setDescription(existing.description);
      const isMulti = Object.keys(existing.multiPayers).length > 0;
      setPayerChoice(isMulti ? MULTI_SENTINEL : existing.payerId ?? people[0]?.id ?? "");
      const hasIndividual = Object.keys(existing.individualAmounts).length > 0;
      setSplitMode(hasIndividual ? "individual" : "even");
      setTotalRaw(hasIndividual || isMulti ? "" : String(existing.total));
      const mc: Record<string, boolean> = {};
      const ma: Record<string, string> = {};
      people.forEach((p) => {
        if (existing.multiPayers[p.id] !== undefined) {
          mc[p.id] = true;
          ma[p.id] = String(existing.multiPayers[p.id]);
        }
      });
      setMultiChecked(mc);
      setMultiAmounts(ma);
      const ia: Record<string, string> = {};
      people.forEach((p) => {
        if (existing.individualAmounts[p.id] !== undefined) ia[p.id] = String(existing.individualAmounts[p.id]);
      });
      setIndivAmounts(ia);
    } else {
      setTitle("");
      setDescription("");
      setPayerChoice(people[0]?.id ?? "");
      setSplitMode("even");
      setTotalRaw("");
      setMultiChecked({});
      setMultiAmounts({});
      setIndivAmounts({});
    }
  }, [open, existing, people]);

  const isMulti = payerChoice === MULTI_SENTINEL;
  const totalDisabled = isMulti || splitMode === "individual";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    // ---- Collect multi-payer contributions ----
    const multiPayers: Record<string, number> = {};
    if (isMulti) {
      let anyChecked = false;
      for (const p of people) {
        if (multiChecked[p.id]) {
          anyChecked = true;
          const raw = (multiAmounts[p.id] || "").trim();
          let amt: number;
          try {
            amt = raw ? evalExpr(raw) : 0;
          } catch {
            setError(`Invalid amount for ${p.name}`);
            return;
          }
          if (amt <= 0) {
            setError(`Enter an amount for ${p.name}`);
            return;
          }
          multiPayers[p.id] = round2(amt);
        }
      }
      if (!anyChecked) {
        setError("Select at least one contributor");
        return;
      }
    }

    // ---- Collect individual owed amounts ----
    const individualAmounts: Record<string, number> = {};
    if (splitMode === "individual") {
      for (const p of people) {
        const raw = (indivAmounts[p.id] || "").trim();
        if (!raw) continue;
        let amt: number;
        try {
          amt = evalExpr(raw);
        } catch {
          setError(`Invalid amount for ${p.name}`);
          return;
        }
        if (amt > 0) individualAmounts[p.id] = round2(amt);
      }
    }

    const mismatch = validateBillMismatch(individualAmounts, multiPayers);
    if (mismatch) {
      setError(mismatch);
      return;
    }

    // ---- Determine total ----
    let total: number;
    const contribTotal = round2(Object.values(multiPayers).reduce((a, b) => a + b, 0));
    const indivSum = round2(Object.values(individualAmounts).reduce((a, b) => a + b, 0));
    if (isMulti) {
      total = splitMode === "individual" ? indivSum : contribTotal;
    } else if (splitMode === "individual") {
      total = indivSum;
    } else {
      try {
        total = evalExpr(totalRaw.trim());
      } catch {
        setError("Invalid total amount");
        return;
      }
    }
    if (!total || total <= 0) {
      setError("Total must be greater than zero");
      return;
    }

    setSaving(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        total: round2(total),
        payerId: isMulti ? null : payerChoice || null,
        individualAmounts,
        multiPayers,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to save bill");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={existing ? "Edit bill" : "Add bill"} maxWidth="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Dinner at cafe" required autoFocus />
          <Input
            label="Total"
            value={totalRaw}
            onChange={(e) => setTotalRaw(e.target.value)}
            placeholder="e.g. 100 or 50+30"
            disabled={totalDisabled}
            className={totalDisabled ? "opacity-50" : ""}
          />
        </div>
        <TextArea label="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Any notes about this bill" />

        {/* Payer selection */}
        <div>
          <span className="block mb-1.5 font-accent font-bold text-xs uppercase tracking-wider text-gv-fg2">Paid by</span>
          <select value={payerChoice} onChange={(e) => setPayerChoice(e.target.value)} className="brutal-input w-full">
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
            <option value={MULTI_SENTINEL}>More than 1 contributed</option>
          </select>
        </div>

        {isMulti && (
          <div className="brutal-border p-3 bg-gv-bg1">
            <div className="flex items-center gap-2 mb-2 text-gv-purple font-accent font-bold text-xs uppercase tracking-wide">
              <Users size={14} /> Contributions
            </div>
            <div className="space-y-2">
              {people.map((p) => (
                <div key={p.id} className="flex items-center gap-3">
                  <label className="flex items-center gap-2 flex-1 text-sm text-gv-fg1 font-sans">
                    <input
                      type="checkbox"
                      checked={!!multiChecked[p.id]}
                      onChange={(e) => setMultiChecked((m) => ({ ...m, [p.id]: e.target.checked }))}
                      className="accent-gv-yellow w-4 h-4"
                    />
                    {p.name}
                  </label>
                  {multiChecked[p.id] && (
                    <input
                      value={multiAmounts[p.id] || ""}
                      onChange={(e) => setMultiAmounts((m) => ({ ...m, [p.id]: e.target.value }))}
                      placeholder="amount paid"
                      className="brutal-input flex-1 max-w-[140px] text-sm py-1.5"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Split mode */}
        <div>
          <span className="block mb-1.5 font-accent font-bold text-xs uppercase tracking-wider text-gv-fg2">Split mode</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSplitMode("even")}
              className={`brutal-btn flex-1 py-2 text-xs flex items-center justify-center gap-1.5 ${splitMode === "even" ? "bg-gv-aqua text-gv-bg0h" : "bg-gv-bg0 text-gv-fg1"}`}
            >
              <SplitSquareHorizontal size={14} /> Split evenly
            </button>
            <button
              type="button"
              onClick={() => setSplitMode("individual")}
              className={`brutal-btn flex-1 py-2 text-xs flex items-center justify-center gap-1.5 ${splitMode === "individual" ? "bg-gv-aqua text-gv-bg0h" : "bg-gv-bg0 text-gv-fg1"}`}
            >
              Individual amounts
            </button>
          </div>
        </div>

        {splitMode === "individual" && (
          <div className="brutal-border p-3 bg-gv-bg1 space-y-2">
            {people.map((p) => (
              <div key={p.id} className="flex items-center gap-3">
                <span className="flex-1 text-sm text-gv-fg2 font-sans">{p.name}</span>
                <input
                  value={indivAmounts[p.id] || ""}
                  onChange={(e) => setIndivAmounts((m) => ({ ...m, [p.id]: e.target.value }))}
                  placeholder="e.g. 50+30"
                  className="brutal-input flex-1 max-w-[140px] text-sm py-1.5"
                />
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="brutal-border border-gv-red bg-gv-bg1 px-3 py-2 flex items-center gap-2 text-gv-red text-sm font-mono">
            <AlertTriangle size={16} className="shrink-0" /> {error}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-1">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving || people.length === 0}>
            {existing ? "Save changes" : "Add bill"}
          </Button>
        </div>
        {people.length === 0 && <p className="text-xs text-gv-orange font-mono">Add at least one person before creating a bill.</p>}
      </form>
    </Modal>
  );
}
