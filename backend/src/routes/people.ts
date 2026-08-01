import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { requireAuth } from "../middleware/requireAuth";
import { requireGroupRole } from "../middleware/requireGroupRole";

const router = Router({ mergeParams: true });
router.use(requireAuth);

const nameSchema = z.object({ name: z.string().min(1).max(60) });

router.post("/", requireGroupRole("EDITOR"), async (req, res) => {
  const parsed = nameSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const person = await prisma.person.create({ data: { groupId: req.params.groupId, name: parsed.data.name } });
  res.status(201).json(person);
});

router.patch("/:personId", requireGroupRole("EDITOR"), async (req, res) => {
  const parsed = nameSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const person = await prisma.person.update({ where: { id: req.params.personId }, data: { name: parsed.data.name } });
  res.json(person);
});

router.delete("/:personId", requireGroupRole("EDITOR"), async (req, res) => {
  await prisma.person.delete({ where: { id: req.params.personId } });
  res.json({ ok: true });
});

export default router;
