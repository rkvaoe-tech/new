import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { offerSchema, offersFilterSchema } from '@/lib/validations'
import { createAuditLog } from '@/lib/audit'
import { z } from 'zod'

// GET /api/offers - получить список офферов с фильтрацией
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = Object.fromEntries(searchParams.entries())
    
    // Преобразуем строковые параметры в нужные типы
    if (query.page) query.page = parseInt(query.page)
    if (query.limit) query.limit = parseInt(query.limit)
    
    const params = offersFilterSchema.parse(query)
    
    // Строим условия фильтрации
    const where: any = {}
    
    if (params.search) {
      where.OR = [
        { title: { contains: params.search, mode: 'insensitive' } },
        { vertical: { contains: params.search, mode: 'insensitive' } },
      ]
    }
    
    if (params.status) {
      where.status = params.status
    }
    
    if (params.geo) {
      where.geo = { has: params.geo }
    }
    
    if (params.vertical) {
      where.vertical = params.vertical
    }
    
    if (params.tag) {
      where.tags = { has: params.tag }
    }
    
    // Фильтры по лендингам
    if (params.locale || params.partner) {
      where.landings = {
        some: {
          ...(params.locale && { locale: params.locale }),
          ...(params.partner && { networkCode: params.partner }),
        }
      }
    }
    
    const skip = (params.page - 1) * params.limit
    
    const [offers, total] = await Promise.all([
      prisma.offer.findMany({
        where,
        include: {
          landings: {
            orderBy: { order: 'asc' }
          }
        },
        orderBy: { order: 'asc' },
        skip,
        take: params.limit,
      }),
      prisma.offer.count({ where })
    ])
    
    return NextResponse.json({
      offers,
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        pages: Math.ceil(total / params.limit),
      }
    })
  } catch (error) {
    console.error('GET /api/offers error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/offers - создать новый оффер
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }
    
    const body = await request.json()
    
    // Если тело пустое, создаем пустую карточку по умолчанию
    const data = Object.keys(body).length === 0 ? {
      title: 'Untitled',
      vertical: 'Undefined',
      priceUsd: 0,
      geo: [],
      tags: [],
      status: 'ACTIVE' as const,
      imageUrl: '',
    } : offerSchema.parse(body)
    
    // Получаем минимальный order для нового оффера (чтобы он был в начале)
    const minOrder = await prisma.offer.findFirst({
      select: { order: true },
      orderBy: { order: 'asc' }
    })
    
    const offer = await prisma.offer.create({
      data: {
        ...data,
        order: (minOrder?.order || 10) - 10,
      },
      include: {
        landings: true
      }
    })
    
    // Логируем создание
    await createAuditLog({
      actorId: session.user.id,
      action: 'create',
      entity: 'offer',
      entityId: offer.id,
      after: offer,
    })
    
    return NextResponse.json(offer, { status: 201 })
  } catch (error) {
    console.error('POST /api/offers error:', error)
    
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
