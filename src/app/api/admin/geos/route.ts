import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

const geoSchema = z.object({
  code: z.string().min(1, 'Код обязателен').max(3, 'Код не более 3 символов').transform(s => s.toUpperCase()),
  name: z.string().min(1, 'Название обязательно')
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    console.log('GET /api/admin/geos - Session:', session ? 'exists' : 'null')
    console.log('User role:', session?.user?.role)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      console.log('Access denied - no session or not admin')
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const geos = await prisma.geo.findMany({
      orderBy: [{ order: 'asc' }, { name: 'asc' }]
    })

    return NextResponse.json(geos)
  } catch (error) {
    console.error('Error fetching geos:', error)
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
    const validatedData = geoSchema.parse(body)

    const existing = await prisma.geo.findUnique({
      where: { code: validatedData.code }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Geo with this code already exists' },
        { status: 400 }
      )
    }

    const geo = await prisma.geo.create({
      data: {
        code: validatedData.code,
        name: validatedData.name,
        isActive: true,
        order: 0
      }
    })

    return NextResponse.json(geo, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating geo:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
