import { Bill, GroupDetail, GroupSummary, Member, Person, Role } from "@/types";
import { computeBalances, settleMinimal, getTotalExpenses } from "@/lib/splitLogic";

const GROUPS_KEY = "guest:groups";
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);

interface GuestGroup {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  people: Person[];
  bills: Bill[];
}

function readAll(): GuestGroup[] {
  try {
    const raw = localStorage.getItem(GROUPS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeAll(groups: GuestGroup[]) {
  localStorage.setItem(GROUPS_KEY, JSON.stringify(groups));
}

const GUEST_MEMBER: Member = { id: "guest-owner", userId: "guest", username: "Guest", email: "", role: "OWNER" };

export const guestStorage = {
  listGroups(query?: string): GroupSummary[] {
    const groups = readAll();
    const filtered = query ? groups.filter((g) => g.name.toLowerCase().includes(query.toLowerCase()) || g.description.toLowerCase().includes(query.toLowerCase())) : groups;
    return filtered
      .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
      .map((g) => ({
        id: g.id,
        name: g.name,
        description: g.description,
        ownerId: "guest",
        ownerUsername: "Guest",
        role: "OWNER" as Role,
        memberCount: 1,
        peopleCount: g.people.length,
        billCount: g.bills.length,
        createdAt: g.createdAt,
        updatedAt: g.updatedAt,
      }));
  },

  createGroup(name: string, description: string): GroupSummary {
    const groups = readAll();
    const now = new Date().toISOString();
    const g: GuestGroup = { id: uid(), name, description, createdAt: now, updatedAt: now, people: [], bills: [] };
    groups.push(g);
    writeAll(groups);
    return { id: g.id, name, description, ownerId: "guest", ownerUsername: "Guest", role: "OWNER", memberCount: 1, peopleCount: 0, billCount: 0, createdAt: now, updatedAt: now };
  },

  deleteGroup(id: string) {
    writeAll(readAll().filter((g) => g.id !== id));
  },

  updateGroup(id: string, data: { name?: string; description?: string }) {
    const groups = readAll();
    const g = groups.find((x) => x.id === id);
    if (!g) return;
    if (data.name !== undefined) g.name = data.name;
    if (data.description !== undefined) g.description = data.description;
    g.updatedAt = new Date().toISOString();
    writeAll(groups);
  },

  getGroup(id: string): GroupDetail | null {
    const g = readAll().find((x) => x.id === id);
    if (!g) return null;
    const balances = computeBalances(g.people, g.bills);
    const settlements = settleMinimal(g.people, g.bills);
    return {
      id: g.id,
      name: g.name,
      description: g.description,
      ownerId: "guest",
      ownerUsername: "Guest",
      members: [GUEST_MEMBER],
      people: g.people,
      bills: g.bills,
      balances,
      settlements,
      totalExpenses: getTotalExpenses(g.bills),
    };
  },

  addPerson(groupId: string, name: string): Person {
    const groups = readAll();
    const g = groups.find((x) => x.id === groupId)!;
    const p: Person = { id: uid(), name, createdAt: new Date().toISOString() };
    g.people.push(p);
    g.updatedAt = new Date().toISOString();
    writeAll(groups);
    return p;
  },

  updatePerson(groupId: string, personId: string, name: string) {
    const groups = readAll();
    const g = groups.find((x) => x.id === groupId)!;
    const p = g.people.find((x) => x.id === personId);
    if (p) p.name = name;
    g.updatedAt = new Date().toISOString();
    writeAll(groups);
  },

  removePerson(groupId: string, personId: string) {
    const groups = readAll();
    const g = groups.find((x) => x.id === groupId)!;
    g.people = g.people.filter((p) => p.id !== personId);
    g.bills.forEach((b) => {
      delete b.individualAmounts[personId];
      delete b.multiPayers[personId];
      if (b.payerId === personId) b.payerId = null;
    });
    g.updatedAt = new Date().toISOString();
    writeAll(groups);
  },

  addBill(groupId: string, bill: Omit<Bill, "id" | "createdAt">): Bill {
    const groups = readAll();
    const g = groups.find((x) => x.id === groupId)!;
    const b: Bill = { ...bill, id: uid(), createdAt: new Date().toISOString() };
    g.bills.push(b);
    g.updatedAt = new Date().toISOString();
    writeAll(groups);
    return b;
  },

  updateBill(groupId: string, billId: string, bill: Omit<Bill, "id" | "createdAt">) {
    const groups = readAll();
    const g = groups.find((x) => x.id === groupId)!;
    const idx = g.bills.findIndex((b) => b.id === billId);
    if (idx >= 0) g.bills[idx] = { ...g.bills[idx], ...bill };
    g.updatedAt = new Date().toISOString();
    writeAll(groups);
  },

  removeBill(groupId: string, billId: string) {
    const groups = readAll();
    const g = groups.find((x) => x.id === groupId)!;
    g.bills = g.bills.filter((b) => b.id !== billId);
    g.updatedAt = new Date().toISOString();
    writeAll(groups);
  },
};
