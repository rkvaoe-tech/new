import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

const partnerSchema = z.object({
  code: z.string().min(1, 'Код обязателен').max(5, 'Код не более 5 символов').transform(s => s.toUpperCase()),
  name: z.string().min(1, 'Название обязательно')
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    console.log('GET /api/admin/partners - Session:', session ? 'exists' : 'null')
    console.log('User role:', session?.user?.role)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      console.log('Access denied - no session or not admin')
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const partners = await prisma.partner.findMany({
      orderBy: [{ order: 'asc' }, { name: 'asc' }]
    })

    return NextResponse.json(partners)
  } catch (error) {
    console.error('Error fetching partners:', error)
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
    const validatedData = partnerSchema.parse(body)

    const existing = await prisma.partner.findUnique({
      where: { code: validatedData.code }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Partner with this code already exists' },
        { status: 400 }
      )
    }

    const partner = await prisma.partner.create({
      data: {
        code: validatedData.code,
        name: validatedData.name,
        isActive: true,
        order: 0
      }
    })

    return NextResponse.json(partner, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating partner:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
