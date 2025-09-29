import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateCostSchema = z.object({
  cost: z.number().min(0).max(999999.99).nullable(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updateCostSchema.parse(body)

    // Check if domain exists
    const domain = await prisma.domain.findUnique({
      where: { id: params.id }
    })

    if (!domain) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 })
    }

    // Update domain cost
    const updatedDomain = await prisma.domain.update({
      where: { id: params.id },
      data: {
        cost: validatedData.cost
      }
    })

    console.log(`Admin ${session.user.email} updated cost for domain ${domain.domain}: ${validatedData.cost}`)

    return NextResponse.json({
      success: true,
      domain: updatedDomain
    })

  } catch (error) {
    console.error('Update domain cost error:', error)
    
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
