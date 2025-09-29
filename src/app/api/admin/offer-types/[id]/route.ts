import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

const offerTypeUpdateSchema = z.object({
  name: z.string().min(1, 'Название обязательно').optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  order: z.number().optional()
})

// Обновление типа оффера
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = offerTypeUpdateSchema.parse(body)

    // Проверяем существование типа оффера
    const existing = await prisma.offerType.findUnique({
      where: { id: params.id }
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Offer type not found' },
        { status: 404 }
      )
    }

    // Если меняется название, проверяем уникальность
    if (validatedData.name && validatedData.name !== existing.name) {
      const nameExists = await prisma.offerType.findUnique({
        where: { name: validatedData.name }
      })

      if (nameExists) {
        return NextResponse.json(
          { error: 'Offer type with this name already exists' },
          { status: 400 }
        )
      }
    }

    const offerType = await prisma.offerType.update({
      where: { id: params.id },
      data: validatedData
    })

    return NextResponse.json(offerType)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating offer type:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Полное удаление типа оффера
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Проверяем существование типа оффера
    const existing = await prisma.offerType.findUnique({
      where: { id: params.id }
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Offer type not found' },
        { status: 404 }
      )
    }

    // Полное удаление из базы данных
    await prisma.offerType.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Offer type deleted' })
  } catch (error) {
    console.error('Error deleting offer type:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
