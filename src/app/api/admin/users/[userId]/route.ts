import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const userActionSchema = z.object({
  action: z.enum(['block', 'unblock', 'delete', 'promote', 'demote'])
})

interface RouteParams {
  params: {
    userId: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.appUser.findUnique({
      where: { id: params.userId },
      include: {
        _count: {
          select: {
            domainRequests: true
          }
        },
        domainRequests: {
          include: {
            domain: true
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = userActionSchema.parse(body)

    // Проверяем, что пользователь существует
    const targetUser = await prisma.appUser.findUnique({
      where: { id: params.userId }
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Предотвращаем самоуправление для критических действий
    if (params.userId === session.user.id && 
        ['delete', 'block', 'demote'].includes(validatedData.action)) {
      return NextResponse.json(
        { error: 'Cannot perform this action on yourself' },
        { status: 400 }
      )
    }

    let updatedUser

    switch (validatedData.action) {
      case 'block':
        updatedUser = await prisma.appUser.update({
          where: { id: params.userId },
          data: { isBlocked: true }
        })
        break

      case 'unblock':
        updatedUser = await prisma.appUser.update({
          where: { id: params.userId },
          data: { isBlocked: false }
        })
        break

      case 'promote':
        updatedUser = await prisma.appUser.update({
          where: { id: params.userId },
          data: { role: 'ADMIN' }
        })
        break

      case 'demote':
        updatedUser = await prisma.appUser.update({
          where: { id: params.userId },
          data: { role: 'USER' }
        })
        break

      case 'delete':
        // Сначала удаляем связанные записи
        await prisma.domainRequest.deleteMany({
          where: { userId: params.userId }
        })

        // Обновляем домены, которые были назначены этому пользователю
        await prisma.domain.updateMany({
          where: { assignedTo: params.userId },
          data: { 
            assignedTo: null,
            isAssigned: false,
            assignedAt: null
          }
        })

        // Удаляем пользователя
        updatedUser = await prisma.appUser.delete({
          where: { id: params.userId }
        })
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    return NextResponse.json({ 
      success: true, 
      user: updatedUser,
      action: validatedData.action 
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
