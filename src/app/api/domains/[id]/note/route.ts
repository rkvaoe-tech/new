import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateNoteSchema = z.object({
  note: z.string().max(500, 'Note must be less than 500 characters').optional().nullable()
})

// PATCH /api/domains/[id]/note - Update domain note
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('🔍 Note API called for domain:', id)
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updateNoteSchema.parse(body)
    console.log('🔍 Note data:', validatedData)

    // Check if domain belongs to user
    const domain = await prisma.domain.findFirst({
      where: {
        id: id,
        assignedTo: session.user.id
      }
    })

    if (!domain) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 })
    }

    // Update domain note
    const updatedDomain = await prisma.domain.update({
      where: { id: id },
      data: {
        note: validatedData.note || null
      }
    })

    console.log('✅ Domain note updated successfully:', updatedDomain.id)
    return NextResponse.json(updatedDomain)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating domain note:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
