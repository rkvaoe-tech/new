import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { offerUpdateSchema } from '@/lib/validations'
import { createAuditLog } from '@/lib/audit'
import { z } from 'zod'

interface RouteParams {
  params: {
    id: string
  }
}

// PATCH /api/offers/[id] - обновить оффер
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }
    
    const { id } = await params
    const body = await request.json()
    const data = offerUpdateSchema.parse(body)
    
    // Получаем текущий оффер для аудита
    const currentOffer = await prisma.offer.findUnique({
      where: { id },
      include: { landings: true }
    })
    
    if (!currentOffer) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 })
    }
    
    const updatedOffer = await prisma.offer.update({
      where: { id },
      data,
      include: { landings: true }
    })
    
    // Логируем изменение
    await createAuditLog({
      actorId: session.user.id,
      action: 'update',
      entity: 'offer',
      entityId: id,
      before: currentOffer,
      after: updatedOffer,
    })
    
    return NextResponse.json(updatedOffer)
  } catch (error) {
    const { id } = await params
    console.error(`PATCH /api/offers/${id} error:`, error)
    
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

// DELETE /api/offers/[id] - удалить оффер
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }
    
    const { id } = await params
    
    // Получаем оффер для аудита
    const offer = await prisma.offer.findUnique({
      where: { id },
      include: { landings: true }
    })
    
    if (!offer) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 })
    }
    
    await prisma.offer.delete({
      where: { id }
    })
    
    // Логируем удаление
    await createAuditLog({
      actorId: session.user.id,
      action: 'delete',
      entity: 'offer',
      entityId: id,
      before: offer,
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    const { id } = await params
    console.error(`DELETE /api/offers/${id} error:`, error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
