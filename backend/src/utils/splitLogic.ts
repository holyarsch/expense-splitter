// Ported directly from ExpenseManager.java (Android app) so the web app's
// numbers match the mobile app exactly, including its penny-rounding rules.

export interface PersonLike {
  id: string;
  name: string;
}

export interface BillLike {
  id: string;
  total: number;
  payerId: string | null; // null => multi-payer
  individualAmounts: Record<string, number>; // personId -> amount owed
  multiPayers: Record<string, number>; // personId -> amount contributed
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Mirrors ExpenseManager#computeBalances */
export function computeBalances(people: PersonLike[], bills: BillLike[]): Record<string, number> {
  const bal: Record<string, number> = {};
  for (const p of people) bal[p.id] = 0;

  for (const b of bills) {
    const n = people.length;
    if (n === 0) continue;

    const isMultiPayer = Object.keys(b.multiPayers).length > 0;
    const hasIndividual = Object.keys(b.individualAmounts).length > 0;

    // Credit the payer(s)
    if (isMultiPayer) {
      for (const [pid, amt] of Object.entries(b.multiPayers)) {
        if (pid in bal) bal[pid] += amt;
      }
    } else if (b.payerId && b.payerId in bal) {
      bal[b.payerId] += b.total;
    }

    // Debit everyone their share
    if (hasIndividual) {
      for (const [pid, amt] of Object.entries(b.individualAmounts)) {
        if (pid in bal) bal[pid] -= amt;
      }
    } else {
      // Even split — same base-share + remainder-cents distribution as the Java version
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

/** Mirrors ExpenseManager#settleMinimal — greedy minimal-transaction settlement */
export function settleMinimal(people: PersonLike[], bills: BillLike[]): { from: string; to: string; fromName: string; toName: string; amount: number }[] {
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

  const tx: { from: string; to: string; fromName: string; toName: string; amount: number }[] = [];
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
      const debtor = idToPerson.get(debtors[i].id);
      const creditor = idToPerson.get(creditors[j].id);
      if (!debtor || !creditor) {
        i++;
        j++;
        continue;
      }
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

export function getTotalExpenses(bills: BillLike[]): number {
  return round2(bills.reduce((sum, b) => sum + b.total, 0));
}

/**
 * Evaluates arithmetic expressions with + - * / and parentheses,
 * e.g. "25+55/3", "100*0.18/4+30". Ported from AddBillDialog's ExprParser.
 */
export function evalExpr(input: string): number {
  const expr = input.trim();
  let pos = 0;

  function skipSpaces() {
    while (pos < expr.length && expr[pos] === " ") pos++;
  }
  function parseFactor(): number {
    skipSpaces();
    if (pos < expr.length && expr[pos] === "(") {
      pos++;
      const val = parse();
      if (pos < expr.length && expr[pos] === ")") pos++;
      return val;
    }
    const start = pos;
    if (pos < expr.length && expr[pos] === "-") pos++;
    while (pos < expr.length && (/[0-9.]/.test(expr[pos]))) pos++;
    const numStr = expr.substring(start, pos);
    const val = parseFloat(numStr);
    if (Number.isNaN(val)) throw new Error("Invalid number in expression");
    return val;
  }
  function parseTerm(): number {
    let result = parseFactor();
    while (pos < expr.length) {
      const op = expr[pos];
      if (op === "*" || op === "/") {
        pos++;
        const f = parseFactor();
        result = op === "*" ? result * f : result / f;
      } else break;
    }
    return result;
  }
  function parse(): number {
    let result = parseTerm();
    while (pos < expr.length) {
      const op = expr[pos];
      if (op === "+" || op === "-") {
        pos++;
        const t = parseTerm();
        result = op === "+" ? result + t : result - t;
      } else break;
    }
    return result;
  }

  const result = parse();
  if (Number.isNaN(result)) throw new Error("Invalid expression");
  return result;
}
