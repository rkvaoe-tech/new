import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createAuditLog } from '@/lib/audit'

interface RouteParams {
  params: {
    id: string
  }
}

// POST /api/offers/[id]/duplicate - дублировать оффер с лендингами и прелендингами
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }
    
    const { id } = await params
    
    // Получаем исходный оффер с лендингами
    const originalOffer = await prisma.offer.findUnique({
      where: { id },
      include: {
        landings: {
          orderBy: { order: 'asc' }
        }
      }
    })
    
    if (!originalOffer) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 })
    }
    
    // Получаем минимальный order для нового оффера (чтобы он был в начале)
    const minOrder = await prisma.offer.findFirst({
      select: { order: true },
      orderBy: { order: 'asc' }
    })
    
    // Используем транзакцию для атомарности операции
    const result = await prisma.$transaction(async (tx) => {
      // Создаем дубликат оффера
      const duplicatedOffer = await tx.offer.create({
        data: {
          vertical: originalOffer.vertical,
          title: `${originalOffer.title} (копия)`,
          priceUsd: originalOffer.priceUsd,
          geo: originalOffer.geo,
          tags: originalOffer.tags,
          status: 'ACTIVE', // Новый оффер создается в активном статусе
          imageUrl: originalOffer.imageUrl,
          order: (minOrder?.order || 10) - 10,
        },
      })
      
      // Дублируем все лендинги и прелендинги
      const duplicatedLandings = []
      for (const landing of originalOffer.landings) {
        const duplicatedLanding = await tx.landing.create({
          data: {
            offerId: duplicatedOffer.id,
            extId: landing.extId, // Сохраняем extId, но уникальность проверяется в рамках оффера
            label: landing.label,
            type: landing.type,
            locale: landing.locale,
            networkCode: landing.networkCode,
            url: landing.url,
            notes: landing.notes,
            order: landing.order, // Сохраняем исходный порядок
          },
        })
        duplicatedLandings.push(duplicatedLanding)
      }
      
      // Возвращаем полный объект с лендингами
      return {
        ...duplicatedOffer,
        landings: duplicatedLandings
      }
    })
    
    // Логируем создание оффера
    await createAuditLog({
      actorId: session.user.id,
      action: 'duplicate',
      entity: 'offer',
      entityId: result.id,
      after: result,
      metadata: {
        originalOfferId: originalOffer.id,
        duplicatedLandingsCount: result.landings.length
      }
    })
    
    // Логируем создание каждого лендинга
    for (const landing of result.landings) {
      await createAuditLog({
        actorId: session.user.id,
        action: 'create',
        entity: 'landing',
        entityId: landing.id,
        after: landing,
        metadata: {
          createdViaDuplication: true,
          originalOfferId: originalOffer.id
        }
      })
    }
    
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    const { id } = await params
    console.error(`Error duplicating offer ${id}:`, error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
