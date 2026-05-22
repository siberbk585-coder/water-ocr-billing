import { prisma } from "./db";

async function resolveActorId(actorId?: string): Promise<string | undefined> {
  if (!actorId) return undefined;
  const user = await prisma.user.findUnique({
    where: { id: actorId },
    select: { id: true },
  });
  return user?.id;
}

export async function logAudit(params: {
  actorId?: string;
  action: string;
  entity: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const actorId = await resolveActorId(params.actorId);
  await prisma.auditLog.create({
    data: {
      actorId,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      metadata: JSON.stringify({
        ...(params.metadata ?? {}),
        ...(params.actorId && !actorId ? { staleActorId: params.actorId } : {}),
      }),
    },
  });
}
