import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { reorderSchema } from '@/lib/validations'
import { z } from 'zod'

// POST /api/landings/reorder - изменить порядок лендингов
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
    const { items } = reorderSchema.parse(body)
    
    // Обновляем порядок всех лендингов в транзакции
    await prisma.$transaction(
      items.map(item =>
        prisma.landing.update({
          where: { id: item.id },
          data: { order: item.order }
        })
      )
    )
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('POST /api/landings/reorder error:', error)
    
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
