import { prisma } from './prisma'

interface AuditLogData {
  actorId: string
  action: 'create' | 'update' | 'delete' | 'duplicate'
  entity: 'offer' | 'landing'
  entityId: string
  before?: any
  after?: any
  metadata?: any
}

export async function createAuditLog({
  actorId,
  action,
  entity,
  entityId,
  before,
  after,
  metadata,
}: AuditLogData) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId,
        action,
        entity,
        entityId,
        diff: {
          before: before || null,
          after: after || null,
          ...(metadata && { metadata }),
        },
      },
    })
  } catch (error) {
    console.error('Failed to create audit log:', error)
    // Не прерываем основную операцию, если логирование не удалось
  }
}
