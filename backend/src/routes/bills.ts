import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { requireAuth } from "../middleware/requireAuth";
import { requireGroupRole } from "../middleware/requireGroupRole";
import { round2 } from "../utils/splitLogic";

const router = Router({ mergeParams: true });
router.use(requireAuth);

const billSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().max(500).optional().default(""),
  payerId: z.string().nullable().optional(), // null/undefined => multi-payer
  total: z.number().positive().optional(), // required only for single-payer + even-split
  individualAmounts: z.record(z.number()).optional().default({}), // personId -> amount owed
  multiPayers: z.record(z.number()).optional().default({}), // personId -> amount contributed
});

function validateAndComputeTotal(input: z.infer<typeof billSchema>): { total: number } | { error: string } {
  const isMulti = Object.keys(input.multiPayers).length > 0;
  const hasIndividual = Object.keys(input.individualAmounts).length > 0;

  const contribTotal = round2(Object.values(input.multiPayers).reduce((a, b) => a + b, 0));
  const indivSum = round2(Object.values(input.individualAmounts).reduce((a, b) => a + b, 0));

  if (isMulti && hasIndividual && contribTotal > 0 && indivSum > 0) {
    const diff = round2(Math.abs(contribTotal - indivSum));
    if (diff >= 0.01) {
      return { error: `Mismatch: contributions total (${contribTotal.toFixed(2)}) vs individual expenses total (${indivSum.toFixed(2)}). Difference: ${diff.toFixed(2)}.` };
    }
  }

  let total: number;
  if (isMulti) {
    total = hasIndividual ? indivSum : contribTotal;
  } else if (hasIndividual) {
    total = indivSum;
  } else {
    if (!input.total) return { error: "Total is required" };
    total = input.total;
  }
  if (total <= 0) return { error: "Total must be greater than zero" };
  return { total: round2(total) };
}

router.post("/", requireGroupRole("EDITOR"), async (req, res) => {
  const parsed = billSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const data = parsed.data;

  const totalOrErr = validateAndComputeTotal(data);
  if ("error" in totalOrErr) return res.status(400).json({ error: totalOrErr.error });

  const isMulti = Object.keys(data.multiPayers).length > 0;

  const bill = await prisma.bill.create({
    data: {
      groupId: req.params.groupId,
      title: data.title,
      description: data.description,
      total: totalOrErr.total,
      payerId: isMulti ? null : data.payerId ?? null,
      individualAmounts: {
        create: Object.entries(data.individualAmounts).map(([personId, amount]) => ({ personId, amount })),
      },
      multiPayers: {
        create: Object.entries(data.multiPayers).map(([personId, amount]) => ({ personId, amount })),
      },
    },
    include: { individualAmounts: true, multiPayers: true },
  });

  await prisma.group.update({ where: { id: req.params.groupId }, data: { updatedAt: new Date() } });
  res.status(201).json(bill);
});

router.patch("/:billId", requireGroupRole("EDITOR"), async (req, res) => {
  const parsed = billSchema.partial({ title: true }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const defaults = { title: "x", description: "", payerId: null, total: undefined, individualAmounts: {}, multiPayers: {} };
  const data = { ...defaults, ...parsed.data } as z.infer<typeof billSchema>;

  const existing = await prisma.bill.findUnique({ where: { id: req.params.billId } });
  if (!existing) return res.status(404).json({ error: "Bill not found" });

  const totalOrErr = validateAndComputeTotal(data);
  if ("error" in totalOrErr) return res.status(400).json({ error: totalOrErr.error });

  const isMulti = Object.keys(data.multiPayers).length > 0;

  const bill = await prisma.$transaction(async (tx) => {
    await tx.billIndividual.deleteMany({ where: { billId: req.params.billId } });
    await tx.billMultiPayer.deleteMany({ where: { billId: req.params.billId } });
    return tx.bill.update({
      where: { id: req.params.billId },
      data: {
        title: parsed.data.title ?? existing.title,
        description: data.description,
        total: totalOrErr.total,
        payerId: isMulti ? null : data.payerId ?? null,
        individualAmounts: { create: Object.entries(data.individualAmounts).map(([personId, amount]) => ({ personId, amount })) },
        multiPayers: { create: Object.entries(data.multiPayers).map(([personId, amount]) => ({ personId, amount })) },
      },
      include: { individualAmounts: true, multiPayers: true },
    });
  });

  await prisma.group.update({ where: { id: req.params.groupId }, data: { updatedAt: new Date() } });
  res.json(bill);
});

router.delete("/:billId", requireGroupRole("EDITOR"), async (req, res) => {
  await prisma.bill.delete({ where: { id: req.params.billId } });
  res.json({ ok: true });
});

export default router;

