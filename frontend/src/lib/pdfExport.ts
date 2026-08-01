import { jsPDF } from "jspdf";
import { Bill, GroupDetail, Person } from "@/types";
import { computeBalances, settleMinimal, getTotalExpenses } from "@/lib/splitLogic";

type PdfTheme = "light" | "dark";

const PALETTES: Record<PdfTheme, Record<string, string>> = {
  dark: {
    bg: "#282828",
    bg1: "#3c3836",
    bg2: "#504945",
    fg: "#ebdbb2",
    fg2: "#d5c4a1",
    yellow: "#fabd2f",
    green: "#b8bb26",
    red: "#fb4934",
    blue: "#83a598",
    orange: "#fe8019",
    aqua: "#8ec07c",
    purple: "#d3869b",
  },
  light: {
    bg: "#fbf1c7",
    bg1: "#ebdbb2",
    bg2: "#d5c4a1",
    fg: "#3c3836",
    fg2: "#504945",
    yellow: "#b57614",
    green: "#79740e",
    red: "#9d0006",
    blue: "#076678",
    orange: "#af3a03",
    aqua: "#427b58",
    purple: "#8f3f71",
  },
};

const PW = 595.28,
  PH = 841.89; // A4 pt
const ML = 40,
  MR = 40,
  MT = 50,
  MB = 50;

export function exportExpenseReportPdf(group: GroupDetail, theme: PdfTheme = "dark") {
  const c = PALETTES[theme];
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  let curY = MT;
  let pageNum = 1;

  const people: Person[] = group.people;
  const bills: Bill[] = group.bills;
  const balances = computeBalances(people, bills);
  const settlements = settleMinimal(people, bills);
  const totalExpenses = getTotalExpenses(bills);
  const numPeople = people.length;

  function personName(id: string | null) {
    return people.find((p) => p.id === id)?.name ?? "Unknown";
  }

  function pageBg() {
    doc.setFillColor(c.bg);
    doc.rect(0, 0, PW, PH, "F");
    doc.setFillColor(c.bg1);
    doc.rect(0, 0, PW, 36, "F");
    doc.setTextColor(c.yellow);
    doc.setFont("courier", "bold");
    doc.setFontSize(13);
    doc.text(`Expense Splitter  —  ${group.name}`, ML, 24);
    doc.setTextColor(c.fg2);
    doc.setFont("courier", "normal");
    doc.setFontSize(10);
    const dateStr = new Date().toLocaleString();
    doc.text(dateStr, PW - MR, 24, { align: "right" });
  }

  function footer() {
    doc.setTextColor(c.fg2);
    doc.setFont("courier", "normal");
    doc.setFontSize(9);
    doc.text(`Page ${pageNum}`, PW / 2, PH - 18, { align: "center" });
    doc.setFillColor(c.bg2);
    doc.rect(ML, PH - MB + 10, PW - ML - MR, 1, "F");
  }

  function newPage() {
    footer();
    doc.addPage();
    pageNum++;
    pageBg();
    curY = MT + 36;
  }

  function ensure(need: number) {
    if (curY + need > PH - MB) newPage();
  }

  function sectionHeader(text: string, color: string) {
    ensure(36);
    curY += 10;
    doc.setFillColor(color);
    doc.rect(ML, curY, PW - ML - MR, 26, "F");
    doc.setTextColor(c.bg);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(text, ML + 8, curY + 18);
    curY += 30;
  }

  function subHeader(text: string, color: string) {
    ensure(24);
    doc.setTextColor(color);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(text, ML + 4, curY + 14);
    curY += 18;
    doc.setFillColor(color);
    doc.rect(ML + 4, curY, PW - ML - MR - 4, 1, "F");
    curY += 5;
  }

  function row(left: string, right: string, color: string, indent = 4, bold = false) {
    ensure(18);
    doc.setTextColor(color);
    doc.setFont("courier", bold ? "bold" : "normal");
    doc.setFontSize(10);
    doc.text(left, ML + indent, curY + 12);
    if (right) doc.text(right, PW - MR, curY + 12, { align: "right" });
    curY += bold ? 18 : 16;
  }

  function divider(color: string) {
    ensure(6);
    doc.setFillColor(color);
    doc.rect(ML, curY + 2, PW - ML - MR, 1, "F");
    curY += 7;
  }

  function spacing(h: number) {
    curY += h;
  }

  // ---- Page 1 setup ----
  pageBg();
  curY = MT + 36;

  doc.setTextColor(c.yellow);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("Expense Report", ML, curY + 26);
  curY += 32;
  doc.setTextColor(c.fg2);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);
  doc.text(group.name, ML, curY + 16);
  curY += 22;
  doc.setFillColor(c.yellow);
  doc.rect(ML, curY, PW - ML - MR, 2, "F");
  curY += 12;

  // Summary box
  const perPerson = numPeople > 0 ? totalExpenses / numPeople : 0;
  doc.setDrawColor(c.bg2);
  doc.setFillColor(c.bg1);
  doc.roundedRect(ML, curY, PW - ML - MR, 70, 6, 6, "FD");
  const cellX = ML + 14,
    cellY = curY + 20;
  const summaryCells: [string, string, string][] = [
    ["People", String(numPeople), c.yellow],
    ["Bills", String(bills.length), c.blue],
    ["Total Spent", totalExpenses.toFixed(2), c.yellow],
    ["Per Person", perPerson.toFixed(2), c.aqua],
  ];
  summaryCells.forEach(([label, value, color], i) => {
    const x = cellX + i * 125;
    doc.setTextColor(c.fg2);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(label, x, cellY);
    doc.setTextColor(color);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(value, x, cellY + 18);
  });
  curY += 82;

  // Section 1: People
  sectionHeader(`1.  People  (${numPeople})`, c.yellow);
  people.forEach((p, i) => {
    const v = balances[p.id] ?? 0;
    const balStr = v > 0.01 ? `+${v.toFixed(2)} (owed)` : v < -0.01 ? `${v.toFixed(2)} (owes)` : "settled";
    const color = v > 0.01 ? c.green : v < -0.01 ? c.red : c.fg2;
    if (i % 2 === 0) {
      ensure(18);
      doc.setFillColor(c.bg1);
      doc.rect(ML, curY, PW - ML - MR, 16, "F");
    }
    row(`${i + 1}.  ${p.name}`, balStr, color, 4);
  });
  spacing(6);

  // Section 2: Bills Detail
  sectionHeader("2.  Bills Detail", c.blue);
  bills.forEach((b, bi) => {
    ensure(90);
    doc.setFillColor(c.bg1);
    doc.roundedRect(ML, curY, PW - ML - MR, 28, 4, 4, "F");
    doc.setTextColor(c.yellow);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(`${bi + 1}.  ${b.title}`, ML + 8, curY + 19);
    doc.text(b.total.toFixed(2), PW - MR - 8, curY + 19, { align: "right" });
    curY += 32;

    if (b.description) row(`Description:  ${b.description}`, "", c.fg2, 8);
    const isMulti = Object.keys(b.multiPayers).length > 0;
    const hasIndividual = Object.keys(b.individualAmounts).length > 0;
    row(`Paid by:  ${isMulti ? "Multiple contributors" : personName(b.payerId)}`, "", c.fg, 8);
    row(`Split mode:  ${hasIndividual ? "Individual amounts" : `Split evenly among ${numPeople}`}`, "", c.fg2, 8);

    if (isMulti) {
      spacing(4);
      subHeader("Contributions (who paid)", c.purple);
      let contribSum = 0;
      Object.entries(b.multiPayers).forEach(([pid, amt]) => {
        contribSum += amt;
        row(personName(pid), amt.toFixed(2), c.fg, 16);
      });
      divider(c.bg2);
      row("Total contributed", contribSum.toFixed(2), c.yellow, 16, true);
    }

    if (hasIndividual) {
      spacing(4);
      subHeader("Individual Expense Breakdown", c.blue);
      let checksum = 0;
      Object.entries(b.individualAmounts).forEach(([pid, amt]) => {
        checksum += amt;
        row(`${personName(pid)} expense`, amt.toFixed(2), c.fg, 16);
      });
      divider(c.bg2);
      row("Total", checksum.toFixed(2), c.yellow, 16, true);
    } else {
      spacing(4);
      subHeader("Even Split Breakdown", c.blue);
      const share = numPeople > 0 ? b.total / numPeople : 0;
      people.forEach((p) => {
        const extra = p.id === b.payerId ? "  (payer)" : "";
        row(`${p.name}${extra}`, share.toFixed(2), c.fg, 16);
      });
      divider(c.bg2);
      row("Total", b.total.toFixed(2), c.yellow, 16, true);
    }
    spacing(10);
  });

  // Section 3: Per-Person Summary
  sectionHeader("3.  Per-Person Expense Summary", c.orange);
  row("Person", "Paid       Owes       Balance", c.fg2, 4);
  divider(c.orange);
  people.forEach((p) => {
    let paid = 0,
      owes = 0;
    for (const b of bills) {
      const isMulti = Object.keys(b.multiPayers).length > 0;
      if (!isMulti && b.payerId === p.id) paid += b.total;
      if (isMulti && b.multiPayers[p.id]) paid += b.multiPayers[p.id];
      if (Object.keys(b.individualAmounts).length > 0) {
        if (b.individualAmounts[p.id]) owes += b.individualAmounts[p.id];
      } else {
        owes += b.total / numPeople;
      }
    }
    const balance = balances[p.id] ?? 0;
    const bc = balance > 0.01 ? c.green : balance < -0.01 ? c.red : c.fg2;
    row(p.name, `${paid.toFixed(2)}    ${owes.toFixed(2)}    ${balance >= 0 ? "+" : ""}${balance.toFixed(2)}`, bc, 4);
  });
  spacing(6);

  // Section 4: Balances
  sectionHeader("4.  Balances", c.orange);
  people.forEach((p) => {
    const v = balances[p.id] ?? 0;
    const right = v > 0.01 ? `+${v.toFixed(2)}  (is owed by others)` : v < -0.01 ? `${v.toFixed(2)}  (owes others)` : "settled";
    const color = v > 0.01 ? c.green : v < -0.01 ? c.red : c.fg2;
    row(p.name, right, color, 4);
  });
  spacing(6);

  // Section 5: Settlement Plan
  sectionHeader("5.  Settlement Plan", c.aqua);
  if (settlements.length === 0) {
    row("Nothing to settle — all balances are even.", "", c.green, 4);
  } else {
    settlements.forEach((tx, i) => {
      ensure(18);
      if (i % 2 === 0) {
        doc.setFillColor(c.bg1);
        doc.rect(ML, curY, PW - ML - MR, 16, "F");
      }
      row(`${i + 1}.  ${tx.fromName} pays ${tx.toName}  ${tx.amount.toFixed(2)}`, "", c.yellow, 4);
    });
  }

  footer();
  doc.save(`${group.name.replace(/[^a-z0-9]+/gi, "_")}_expense_report_${theme}.pdf`);
}
