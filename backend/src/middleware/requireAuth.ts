import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/auth";
import { config } from "../config";

export interface AuthedRequest extends Request {
  user?: { userId: string; username: string };
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const token = req.cookies?.[config.cookieName];
  if (!token) return res.status(401).json({ error: "Not authenticated" });
  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired session" });
  }
}
