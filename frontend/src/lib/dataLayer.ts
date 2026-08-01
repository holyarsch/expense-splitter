import { api } from "@/lib/api";
import { guestStorage } from "@/lib/guestStorage";
import { Bill, GroupDetail, GroupSummary, Member, Person, Role } from "@/types";

// Every function takes `guest` as its first argument so pages don't need
// try/catch branching everywhere — guest mode never touches the network.

export const data = {
  async listGroups(guest: boolean, q?: string): Promise<GroupSummary[]> {
    if (guest) return guestStorage.listGroups(q);
    const qs = q ? `?q=${encodeURIComponent(q)}` : "";
    return api.get<GroupSummary[]>(`/groups${qs}`);
  },

  async createGroup(guest: boolean, name: string, description: string): Promise<GroupSummary> {
    if (guest) return guestStorage.createGroup(name, description);
    return api.post<GroupSummary>("/groups", { name, description });
  },

  async updateGroup(guest: boolean, id: string, patch: { name?: string; description?: string }): Promise<void> {
    if (guest) return guestStorage.updateGroup(id, patch);
    await api.patch(`/groups/${id}`, patch);
  },

  async deleteGroup(guest: boolean, id: string): Promise<void> {
    if (guest) return guestStorage.deleteGroup(id);
    await api.delete(`/groups/${id}`);
  },

  async getGroup(guest: boolean, id: string): Promise<GroupDetail | null> {
    if (guest) return guestStorage.getGroup(id);
    return api.get<GroupDetail>(`/groups/${id}`);
  },

  async addPerson(guest: boolean, groupId: string, name: string): Promise<Person> {
    if (guest) return guestStorage.addPerson(groupId, name);
    return api.post<Person>(`/groups/${groupId}/people`, { name });
  },

  async updatePerson(guest: boolean, groupId: string, personId: string, name: string): Promise<void> {
    if (guest) return guestStorage.updatePerson(groupId, personId, name);
    await api.patch(`/groups/${groupId}/people/${personId}`, { name });
  },

  async removePerson(guest: boolean, groupId: string, personId: string): Promise<void> {
    if (guest) return guestStorage.removePerson(groupId, personId);
    await api.delete(`/groups/${groupId}/people/${personId}`);
  },

  async addBill(guest: boolean, groupId: string, bill: Omit<Bill, "id" | "createdAt">): Promise<Bill> {
    if (guest) return guestStorage.addBill(groupId, bill);
    return api.post<Bill>(`/groups/${groupId}/bills`, bill);
  },

  async updateBill(guest: boolean, groupId: string, billId: string, bill: Omit<Bill, "id" | "createdAt">): Promise<void> {
    if (guest) return guestStorage.updateBill(groupId, billId, bill);
    await api.patch(`/groups/${groupId}/bills/${billId}`, bill);
  },

  async removeBill(guest: boolean, groupId: string, billId: string): Promise<void> {
    if (guest) return guestStorage.removeBill(groupId, billId);
    await api.delete(`/groups/${groupId}/bills/${billId}`);
  },

  // Members management is unavailable in guest mode (no accounts to invite).
  async addMember(groupId: string, identifier: string, role: Role): Promise<Member> {
    return api.post<Member>(`/groups/${groupId}/members`, { identifier, role });
  },
  async updateMemberRole(groupId: string, memberId: string, role: Role): Promise<void> {
    await api.patch(`/groups/${groupId}/members/${memberId}`, { role });
  },
  async removeMember(groupId: string, memberId: string): Promise<void> {
    await api.delete(`/groups/${groupId}/members/${memberId}`);
  },
};
