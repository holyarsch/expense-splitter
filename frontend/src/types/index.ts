export type Role = "OWNER" | "EDITOR" | "VIEWER";

export interface UserSummary {
  id: string;
  username: string;
  email: string;
}

export interface Person {
  id: string;
  name: string;
  createdAt?: string;
}

export interface Bill {
  id: string;
  title: string;
  description: string;
  total: number;
  payerId: string | null;
  individualAmounts: Record<string, number>;
  multiPayers: Record<string, number>;
  createdAt?: string;
}

export interface Member {
  id: string;
  userId: string;
  username: string;
  email: string;
  role: Role;
}

export interface Settlement {
  from: string;
  to: string;
  fromName: string;
  toName: string;
  amount: number;
}

export interface GroupSummary {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  ownerUsername: string;
  role: Role;
  memberCount: number;
  peopleCount: number;
  billCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface GroupDetail {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  ownerUsername: string;
  members: Member[];
  people: Person[];
  bills: Bill[];
  balances: Record<string, number>;
  settlements: Settlement[];
  totalExpenses: number;
}
