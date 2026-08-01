import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { requireAuth, AuthedRequest } from "../middleware/requireAuth";
import { requireGroupRole } from "../middleware/requireGroupRole";
import { computeBalances, settleMinimal, getTotalExpenses } from "../utils/splitLogic";

const router = Router();
router.use(requireAuth);

const groupSchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(300).optional().default(""),
});

// ---- List groups (owned + member-of), with optional search ----
router.get("/", async (req: AuthedRequest, res) => {
  const q = (req.query.q as string | undefined)?.trim();
  const userId = req.user!.userId;

  const groups = await prisma.group.findMany({
    where: {
      AND: [
        { OR: [{ ownerId: userId }, { members: { some: { userId } } }] },
        q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }] } : {},
      ],
    },
    include: {
      owner: { select: { id: true, username: true } },
      members: { include: { user: { select: { id: true, username: true, email: true } } } },
      _count: { select: { people: true, bills: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const result = groups.map((g) => ({
    id: g.id,
    name: g.name,
    description: g.description,
    ownerId: g.ownerId,
    ownerUsername: g.owner.username,
    role: g.ownerId === userId ? "OWNER" : g.members.find((m) => m.userId === userId)?.role ?? "VIEWER",
    memberCount: g.members.length,
    peopleCount: g._count.people,
    billCount: g._count.bills,
    createdAt: g.createdAt,
    updatedAt: g.updatedAt,
  }));

  res.json(result);
});

// ---- Create group ----
router.post("/", async (req: AuthedRequest, res) => {
  const parsed = groupSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

  const group = await prisma.group.create({
    data: { name: parsed.data.name, description: parsed.data.description, ownerId: req.user!.userId },
  });
  res.status(201).json(group);
});

// ---- Get single group with full detail (people, bills, computed balances) ----
router.get("/:id", requireGroupRole("VIEWER"), async (req, res) => {
  const groupId = req.params.id;
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      owner: { select: { id: true, username: true } },
      members: { include: { user: { select: { id: true, username: true, email: true } } } },
      people: { orderBy: { createdAt: "asc" } },
      bills: {
        orderBy: { createdAt: "asc" },
        include: { individualAmounts: true, multiPayers: true },
      },
    },
  });
  if (!group) return res.status(404).json({ error: "Group not found" });

  const people = group.people.map((p) => ({ id: p.id, name: p.name }));
  const bills = group.bills.map((b) => ({
    id: b.id,
    total: b.total,
    payerId: b.payerId,
    individualAmounts: Object.fromEntries(b.individualAmounts.map((i) => [i.personId, i.amount])),
    multiPayers: Object.fromEntries(b.multiPayers.map((m) => [m.personId, m.amount])),
  }));

  const balances = computeBalances(people, bills);
  const settlements = settleMinimal(people, bills);
  const totalExpenses = getTotalExpenses(bills);

  res.json({
    id: group.id,
    name: group.name,
    description: group.description,
    ownerId: group.ownerId,
    ownerUsername: group.owner.username,
    members: group.members.map((m) => ({ id: m.id, userId: m.userId, username: m.user.username, email: m.user.email, role: m.role })),
    people: group.people.map((p) => ({ id: p.id, name: p.name, createdAt: p.createdAt })),
    bills: group.bills.map((b) => ({
      id: b.id,
      title: b.title,
      description: b.description,
      total: b.total,
      payerId: b.payerId,
      individualAmounts: Object.fromEntries(b.individualAmounts.map((i) => [i.personId, i.amount])),
      multiPayers: Object.fromEntries(b.multiPayers.map((m) => [m.personId, m.amount])),
      createdAt: b.createdAt,
    })),
    balances,
    settlements,
    totalExpenses,
  });
});

// ---- Update group (name/description) — editor+ ----
router.patch("/:id", requireGroupRole("EDITOR"), async (req, res) => {
  const parsed = groupSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const group = await prisma.group.update({ where: { id: req.params.id }, data: parsed.data });
  res.json(group);
});

// ---- Delete group — owner only ----
router.delete("/:id", requireGroupRole("OWNER"), async (req, res) => {
  await prisma.group.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

// ---- Members: invite / change role / remove — owner only ----
const memberSchema = z.object({
  identifier: z.string().min(1), // username or email
  role: z.enum(["EDITOR", "VIEWER"]),
});

router.post("/:id/members", requireGroupRole("OWNER"), async (req, res) => {
  const parsed = memberSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const { identifier, role } = parsed.data;

  const user = await prisma.user.findFirst({ where: { OR: [{ username: identifier }, { email: identifier }] } });
  if (!user) return res.status(404).json({ error: "No user found with that username or email" });

  const group = await prisma.group.findUnique({ where: { id: req.params.id } });
  if (group?.ownerId === user.id) return res.status(400).json({ error: "User already owns this group" });

  const member = await prisma.groupMember.upsert({
    where: { groupId_userId: { groupId: req.params.id, userId: user.id } },
    update: { role },
    create: { groupId: req.params.id, userId: user.id, role },
    include: { user: { select: { id: true, username: true, email: true } } },
  });
  res.status(201).json({ id: member.id, userId: member.userId, username: member.user.username, email: member.user.email, role: member.role });
});

router.patch("/:id/members/:memberId", requireGroupRole("OWNER"), async (req, res) => {
  const roleSchema = z.object({ role: z.enum(["EDITOR", "VIEWER"]) });
  const parsed = roleSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const member = await prisma.groupMember.update({ where: { id: req.params.memberId }, data: { role: parsed.data.role } });
  res.json(member);
});

router.delete("/:id/members/:memberId", requireGroupRole("OWNER"), async (req, res) => {
  await prisma.groupMember.delete({ where: { id: req.params.memberId } });
  res.json({ ok: true });
});

export default router;
