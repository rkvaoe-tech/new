import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

const verticalUpdateSchema = z.object({
  name: z.string().min(1, 'Название обязательно').optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  order: z.number().optional()
})

// Обновление вертикали
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
    const validatedData = verticalUpdateSchema.parse(body)

    // Проверяем существование вертикали
    const existing = await prisma.vertical.findUnique({
      where: { id: params.id }
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Vertical not found' },
        { status: 404 }
      )
    }

    // Если меняется название, проверяем уникальность
    if (validatedData.name && validatedData.name !== existing.name) {
      const nameExists = await prisma.vertical.findUnique({
        where: { name: validatedData.name }
      })

      if (nameExists) {
        return NextResponse.json(
          { error: 'Vertical with this name already exists' },
          { status: 400 }
        )
      }
    }

    const vertical = await prisma.vertical.update({
      where: { id: params.id },
      data: validatedData
    })

    return NextResponse.json(vertical)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating vertical:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Полное удаление вертикали
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Проверяем существование вертикали
    const existing = await prisma.vertical.findUnique({
      where: { id: params.id }
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Vertical not found' },
        { status: 404 }
      )
    }

    // Полное удаление из базы данных
    await prisma.vertical.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Vertical deleted' })
  } catch (error) {
    console.error('Error deleting vertical:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
