import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

const languageUpdateSchema = z.object({
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
    const validatedData = languageUpdateSchema.parse(body)

    const existing = await prisma.language.findUnique({
      where: { id: params.id }
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Language not found' },
        { status: 404 }
      )
    }

    // Если меняется код, проверяем уникальность
    if (validatedData.code && validatedData.code !== existing.code) {
      const codeExists = await prisma.language.findUnique({
        where: { code: validatedData.code }
      })

      if (codeExists) {
        return NextResponse.json(
          { error: 'Language with this code already exists' },
          { status: 400 }
        )
      }
    }

    const language = await prisma.language.update({
      where: { id: params.id },
      data: validatedData
    })

    return NextResponse.json(language)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating language:', error)
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

    const existing = await prisma.language.findUnique({
      where: { id: params.id }
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Language not found' },
        { status: 404 }
      )
    }

    // Полное удаление из базы данных
    await prisma.language.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Language deleted' })
  } catch (error) {
    console.error('Error deleting language:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
