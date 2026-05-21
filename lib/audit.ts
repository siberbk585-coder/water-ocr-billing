import { prisma } from "./db";

export async function logAudit(params: {
  actorId?: string;
  action: string;
  entity: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await prisma.auditLog.create({
    data: {
      actorId: params.actorId,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      metadata: JSON.stringify(params.metadata ?? {}),
    },
  });
}
