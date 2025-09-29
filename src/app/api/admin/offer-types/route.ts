import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

const offerTypeSchema = z.object({
  name: z.string().min(1, 'Название обязательно')
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    console.log('GET /api/admin/offer-types - Session:', session ? 'exists' : 'null')
    console.log('User role:', session?.user?.role)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      console.log('Access denied - no session or not admin')
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const offerTypes = await prisma.offerType.findMany({
      orderBy: [{ order: 'asc' }, { name: 'asc' }]
    })

    return NextResponse.json(offerTypes)
  } catch (error) {
    console.error('Error fetching offer types:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = offerTypeSchema.parse(body)

    const existing = await prisma.offerType.findUnique({
      where: { name: validatedData.name }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Offer type with this name already exists' },
        { status: 400 }
      )
    }

    const offerType = await prisma.offerType.create({
      data: {
        name: validatedData.name,
        description: null,
        isActive: true,
        order: 0
      }
    })

    return NextResponse.json(offerType, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating offer type:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
