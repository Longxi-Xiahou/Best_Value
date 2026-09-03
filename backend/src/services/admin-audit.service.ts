import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";

export const recordAdminAudit = (adminUserId: string, action: string, targetType: string, targetId: string, metadata?: Prisma.InputJsonValue) =>
  prisma.adminAuditLog.create({ data: { adminUserId, action, targetType, targetId, ...(metadata === undefined ? {} : { metadata }) } });

