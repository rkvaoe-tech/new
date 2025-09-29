import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

const geoUpdateSchema = z.object({
  code: z.string().min(1, 'Код обязателен').max(3, 'Код не более 3 символов').transform(s => s.toUpperCase()).optional(),
  name: z.string().min(1, 'Название обязательно').optional(),
  isActive: z.boolean().optional(),
  order: z.number().optional()
})

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
    const validatedData = geoUpdateSchema.parse(body)

    const existing = await prisma.geo.findUnique({
      where: { id: params.id }
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Geo not found' },
        { status: 404 }
      )
    }

    // Если меняется код, проверяем уникальность
    if (validatedData.code && validatedData.code !== existing.code) {
      const codeExists = await prisma.geo.findUnique({
        where: { code: validatedData.code }
      })

      if (codeExists) {
        return NextResponse.json(
          { error: 'Geo with this code already exists' },
          { status: 400 }
        )
      }
    }

    const geo = await prisma.geo.update({
      where: { id: params.id },
      data: validatedData
    })

    return NextResponse.json(geo)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating geo:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const existing = await prisma.geo.findUnique({
      where: { id: params.id }
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Geo not found' },
        { status: 404 }
      )
    }

    // Полное удаление из базы данных
    await prisma.geo.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Geo deleted' })
  } catch (error) {
    console.error('Error deleting geo:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
