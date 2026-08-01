import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { hashPassword, comparePassword, signToken } from "../utils/auth";
import { sendWelcomeEmail } from "../utils/mailer";
import { config } from "../config";
import { requireAuth, AuthedRequest } from "../middleware/requireAuth";

const router = Router();

const signupSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers, underscore only"),
  email: z.string().email(),
  password: z.string().min(6).max(100),
});

const loginSchema = z.object({
  identifier: z.string().min(1), // username or email
  password: z.string().min(1),
});

function cookieOpts() {
  return {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: "lax" as const,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  };
}

router.post("/signup", async (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const { username, email, password } = parsed.data;

  const existing = await prisma.user.findFirst({ where: { OR: [{ username }, { email }] } });
  if (existing) return res.status(409).json({ error: "Username or email already in use" });

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({ data: { username, email, passwordHash } });

  // Fire-and-forget: send the plaintext credentials by email as requested (no verification step).
  sendWelcomeEmail(email, username, password);

  const token = signToken({ userId: user.id, username: user.username });
  res.cookie(config.cookieName, token, cookieOpts());
  res.status(201).json({ id: user.id, username: user.username, email: user.email });
});

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const { identifier, password } = parsed.data;

  const user = await prisma.user.findFirst({ where: { OR: [{ username: identifier }, { email: identifier }] } });
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const ok = await comparePassword(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  const token = signToken({ userId: user.id, username: user.username });
  res.cookie(config.cookieName, token, cookieOpts());
  res.json({ id: user.id, username: user.username, email: user.email });
});

router.post("/logout", (_req, res) => {
  res.clearCookie(config.cookieName, { path: "/" });
  res.json({ ok: true });
});

router.get("/me", requireAuth, async (req: AuthedRequest, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ id: user.id, username: user.username, email: user.email });
});

export default router;
