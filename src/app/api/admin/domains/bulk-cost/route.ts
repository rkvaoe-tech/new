import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const bulkCostSchema = z.object({
  cost: z.number().min(0).max(999999.99).nullable(),
})

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = bulkCostSchema.parse(body)

    console.log(`Admin ${session.user.email} updating cost for all domains: ${validatedData.cost}`)

    // Update cost for all domains
    const result = await prisma.domain.updateMany({
      data: {
        cost: validatedData.cost
      }
    })

    console.log(`✅ Updated cost for ${result.count} domains`)

    return NextResponse.json({
      success: true,
      updatedCount: result.count,
      cost: validatedData.cost
    })

  } catch (error) {
    console.error('Bulk update domain cost error:', error)
    
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
