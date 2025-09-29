import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

const verticalSchema = z.object({
  name: z.string().min(1, 'Название обязательно')
})

// Получение всех вертикалей (включая неактивные для админа)
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    console.log('GET /api/admin/verticals - Session:', session ? 'exists' : 'null')
    console.log('User role:', session?.user?.role)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      console.log('Access denied - no session or not admin')
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const verticals = await prisma.vertical.findMany({
      orderBy: [{ order: 'asc' }, { name: 'asc' }]
    })

    return NextResponse.json(verticals)
  } catch (error) {
    console.error('Error fetching verticals:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Создание новой вертикали
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = verticalSchema.parse(body)

    // Проверяем уникальность названия
    const existing = await prisma.vertical.findUnique({
      where: { name: validatedData.name }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Vertical with this name already exists' },
        { status: 400 }
      )
    }

    const vertical = await prisma.vertical.create({
      data: {
        name: validatedData.name,
        description: null,
        isActive: true,
        order: 0
      }
    })

    return NextResponse.json(vertical, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating vertical:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
