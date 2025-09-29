import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { landingSchema } from '@/lib/validations'
import { createAuditLog } from '@/lib/audit'
import { z } from 'zod'

interface RouteParams {
  params: {
    id: string
  }
}

// POST /api/offers/[id]/landings - создать лендинг для оффера
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
    const body = await request.json()
    const data = landingSchema.parse(body)
    
    // Проверяем, что оффер существует
    const offer = await prisma.offer.findUnique({
      where: { id }
    })
    
    if (!offer) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 })
    }
    
    // Проверяем уникальность extId внутри оффера и типа
    if (data.extId) {
      const existingLanding = await prisma.landing.findFirst({
        where: {
          offerId: id,
          type: data.type,
          extId: data.extId,
        }
      })
      
      if (existingLanding) {
        return NextResponse.json(
          { error: 'Landing with this extId already exists for this type' },
          { status: 400 }
        )
      }
    }
    
    // Получаем максимальный order для данного типа лендинга
    const maxOrder = await prisma.landing.findFirst({
      where: {
        offerId: id,
        type: data.type,
      },
      select: { order: true },
      orderBy: { order: 'desc' }
    })
    
    const landing = await prisma.landing.create({
      data: {
        ...data,
        offerId: id,
        order: (maxOrder?.order || 0) + 10,
      },
      include: {
        offer: true
      }
    })
    
    // Логируем создание
    await createAuditLog({
      actorId: session.user.id,
      action: 'create',
      entity: 'landing',
      entityId: landing.id,
      after: landing,
    })
    
    return NextResponse.json(landing, { status: 201 })
  } catch (error) {
    const { id } = await params
    console.error(`POST /api/offers/${id}/landings error:`, error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
