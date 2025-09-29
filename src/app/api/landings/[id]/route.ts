import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { landingUpdateSchema } from '@/lib/validations'
import { createAuditLog } from '@/lib/audit'
import { z } from 'zod'

interface RouteParams {
  params: {
    id: string
  }
}

// PATCH /api/landings/[id] - обновить лендинг
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }
    
    const body = await request.json()
    const data = landingUpdateSchema.parse(body)
    
    // Получаем текущий лендинг для аудита
    const currentLanding = await prisma.landing.findUnique({
      where: { id: params.id },
      include: { offer: true }
    })
    
    if (!currentLanding) {
      return NextResponse.json({ error: 'Landing not found' }, { status: 404 })
    }
    
    // Проверяем уникальность extId если он изменяется
    if (data.extId && data.extId !== currentLanding.extId) {
      const existingLanding = await prisma.landing.findFirst({
        where: {
          offerId: currentLanding.offerId,
          type: data.type || currentLanding.type,
          extId: data.extId,
          NOT: { id: params.id }
        }
      })
      
      if (existingLanding) {
        return NextResponse.json(
          { error: 'Landing with this extId already exists for this type' },
          { status: 400 }
        )
      }
    }
    
    const updatedLanding = await prisma.landing.update({
      where: { id: params.id },
      data,
      include: { offer: true }
    })
    
    // Логируем изменение
    await createAuditLog({
      actorId: session.user.id,
      action: 'update',
      entity: 'landing',
      entityId: params.id,
      before: currentLanding,
      after: updatedLanding,
    })
    
    return NextResponse.json(updatedLanding)
  } catch (error) {
    console.error(`PATCH /api/landings/${params.id} error:`, error)
    
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

// DELETE /api/landings/[id] - удалить лендинг
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }
    
    // Получаем лендинг для аудита
    const landing = await prisma.landing.findUnique({
      where: { id: params.id },
      include: { offer: true }
    })
    
    if (!landing) {
      return NextResponse.json({ error: 'Landing not found' }, { status: 404 })
    }
    
    await prisma.landing.delete({
      where: { id: params.id }
    })
    
    // Логируем удаление
    await createAuditLog({
      actorId: session.user.id,
      action: 'delete',
      entity: 'landing',
      entityId: params.id,
      before: landing,
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`DELETE /api/landings/${params.id} error:`, error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
