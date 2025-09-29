import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateBinomSchema = z.object({
  binomApiKey: z.string().nullable(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updateBinomSchema.parse(body)

    // Проверяем, что пользователь существует
    const user = await prisma.appUser.findUnique({
      where: { id: params.userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Обновляем Binom настройки пользователя
    const updatedUser = await prisma.appUser.update({
      where: { id: params.userId },
      data: {
        binomApiKey: validatedData.binomApiKey,
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        binomApiKey: true,
      }
    })

    console.log(`Admin ${session.user.email} updated Binom settings for user ${user.email}`)

    return NextResponse.json({
      success: true,
      user: updatedUser
    })

  } catch (error) {
    console.error('Update user Binom settings error:', error)
    
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
