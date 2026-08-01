import { Bill, Person, Settlement } from "@/types";

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function computeBalances(people: Person[], bills: Bill[]): Record<string, number> {
  const bal: Record<string, number> = {};
  for (const p of people) bal[p.id] = 0;

  for (const b of bills) {
    const n = people.length;
    if (n === 0) continue;

    const isMultiPayer = Object.keys(b.multiPayers).length > 0;
    const hasIndividual = Object.keys(b.individualAmounts).length > 0;

    if (isMultiPayer) {
      for (const [pid, amt] of Object.entries(b.multiPayers)) if (pid in bal) bal[pid] += amt;
    } else if (b.payerId && b.payerId in bal) {
      bal[b.payerId] += b.total;
    }

    if (hasIndividual) {
      for (const [pid, amt] of Object.entries(b.individualAmounts)) if (pid in bal) bal[pid] -= amt;
    } else {
      const total = b.total;
      const baseShare = Math.floor((total / n) * 100) / 100;
      const remainder = round2(total - baseShare * n);
      const remCents = Math.round(remainder * 100);
      people.forEach((p, i) => {
        const share = baseShare + (i < remCents ? 0.01 : 0.0);
        bal[p.id] = (bal[p.id] ?? 0) - share;
      });
    }
  }

  const rounded: Record<string, number> = {};
  for (const [id, v] of Object.entries(bal)) rounded[id] = round2(v);
  return rounded;
}

export function settleMinimal(people: Person[], bills: Bill[]): Settlement[] {
  const bal = computeBalances(people, bills);
  const idToPerson = new Map(people.map((p) => [p.id, p]));

  type Entry = { id: string; amount: number };
  const creditors: Entry[] = [];
  const debtors: Entry[] = [];
  for (const [id, v] of Object.entries(bal)) {
    if (!idToPerson.has(id)) continue;
    if (v > 0.009) creditors.push({ id, amount: v });
    else if (v < -0.009) debtors.push({ id, amount: -v });
  }
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const tx: Settlement[] = [];
  let i = 0,
    j = 0;
  const safetyLimit = (debtors.length + creditors.length) * 10 + 10;
  let iterations = 0;

  while (i < debtors.length && j < creditors.length) {
    if (++iterations > safetyLimit) break;
    const owe = debtors[i].amount;
    const claim = creditors[j].amount;
    const pay = round2(Math.min(owe, claim));

    if (pay >= 0.01) {
      const debtor = idToPerson.get(debtors[i].id)!;
      const creditor = idToPerson.get(creditors[j].id)!;
      tx.push({ from: debtor.id, to: creditor.id, fromName: debtor.name, toName: creditor.name, amount: pay });
      debtors[i].amount = round2(owe - pay);
      creditors[j].amount = round2(claim - pay);
    }
    if (debtors[i].amount < 0.01) i++;
    else if (creditors[j].amount < 0.01) j++;
    else {
      i++;
      j++;
    }
  }
  return tx;
}

export function getTotalExpenses(bills: Bill[]): number {
  return round2(bills.reduce((sum, b) => sum + b.total, 0));
}

/** Arithmetic expression evaluator for amount fields, e.g. "50+30-10", "100*0.18/4" */
export function evalExpr(input: string): number {
  const expr = input.trim();
  let pos = 0;
  const skip = () => {
    while (pos < expr.length && expr[pos] === " ") pos++;
  };
  function factor(): number {
    skip();
    if (expr[pos] === "(") {
      pos++;
      const v = parseExpr();
      if (expr[pos] === ")") pos++;
      return v;
    }
    const start = pos;
    if (expr[pos] === "-") pos++;
    while (pos < expr.length && /[0-9.]/.test(expr[pos])) pos++;
    const v = parseFloat(expr.slice(start, pos));
    if (Number.isNaN(v)) throw new Error("Invalid number");
    return v;
  }
  function term(): number {
    let r = factor();
    while (pos < expr.length && (expr[pos] === "*" || expr[pos] === "/")) {
      const op = expr[pos++];
      const f = factor();
      r = op === "*" ? r * f : r / f;
    }
    return r;
  }
  function parseExpr(): number {
    let r = term();
    while (pos < expr.length && (expr[pos] === "+" || expr[pos] === "-")) {
      const op = expr[pos++];
      const t = term();
      r = op === "+" ? r + t : r - t;
    }
    return r;
  }
  const result = parseExpr();
  if (Number.isNaN(result)) throw new Error("Invalid expression");
  return result;
}

export function validateBillMismatch(individualAmounts: Record<string, number>, multiPayers: Record<string, number>): string | null {
  const contribTotal = round2(Object.values(multiPayers).reduce((a, b) => a + b, 0));
  const indivSum = round2(Object.values(individualAmounts).reduce((a, b) => a + b, 0));
  if (Object.keys(multiPayers).length && Object.keys(individualAmounts).length && contribTotal > 0 && indivSum > 0) {
    const diff = round2(Math.abs(contribTotal - indivSum));
    if (diff >= 0.01) {
      return `Mismatch: contributions total (${contribTotal.toFixed(2)}) vs individual total (${indivSum.toFixed(2)}). Difference: ${diff.toFixed(2)}.`;
    }
  }
  return null;
}
