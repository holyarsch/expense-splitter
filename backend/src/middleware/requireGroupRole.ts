import { Response, NextFunction } from "express";
import { prisma } from "../prisma";
import { AuthedRequest } from "./requireAuth";

const RANK = { VIEWER: 0, EDITOR: 1, OWNER: 2 } as const;
export type RoleName = keyof typeof RANK;

/**
 * Ensures req.user is at least `minRole` within :groupId.
 * Attaches req.groupRole for downstream handlers.
 */
export function requireGroupRole(minRole: RoleName) {
  return async (req: AuthedRequest & { groupRole?: RoleName }, res: Response, next: NextFunction) => {
    const groupId = req.params.groupId || req.params.id;
    if (!req.user || !groupId) return res.status(401).json({ error: "Not authenticated" });

    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group) return res.status(404).json({ error: "Group not found" });

    let role: RoleName | null = null;
    if (group.ownerId === req.user.userId) {
      role = "OWNER";
    } else {
      const membership = await prisma.groupMember.findUnique({
        where: { groupId_userId: { groupId, userId: req.user.userId } },
      });
      if (membership) role = membership.role as RoleName;
    }

    if (!role) return res.status(403).json({ error: "Not a member of this group" });
    if (RANK[role] < RANK[minRole]) return res.status(403).json({ error: `Requires ${minRole} access` });

    req.groupRole = role;
    next();
  };
}
