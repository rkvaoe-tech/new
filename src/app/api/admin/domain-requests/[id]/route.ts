import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateRequestSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  comment: z.string().optional(),
  domainId: z.string().optional()
})

// PATCH /api/admin/domain-requests/[id] - Update domain request status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = updateRequestSchema.parse(body)

    // Check if request exists
    const domainRequest = await prisma.domainRequest.findUnique({
      where: { id: params.id },
      include: {
        user: true,
        domain: true
      }
    })

    if (!domainRequest) {
      return NextResponse.json(
        { error: 'Domain request not found' },
        { status: 404 }
      )
    }

    if (domainRequest.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Request has already been processed' },
        { status: 400 }
      )
    }

    let updatedRequest

    if (validatedData.status === 'APPROVED' && validatedData.domainId) {
      // Check if domain exists and is available
      const domain = await prisma.domain.findUnique({
        where: { id: validatedData.domainId }
      })

      if (!domain) {
        return NextResponse.json(
          { error: 'Domain not found' },
          { status: 404 }
        )
      }

      if (domain.isAssigned) {
        return NextResponse.json(
          { error: 'Domain is already assigned' },
          { status: 400 }
        )
      }

      // Use transaction to assign domain and update request
      const result = await prisma.$transaction(async (tx) => {
        // Assign domain
        await tx.domain.update({
          where: { id: validatedData.domainId },
          data: {
            isAssigned: true,
            assignedTo: domainRequest.userId,
            assignedAt: new Date()
          }
        })

        // Update request
        return await tx.domainRequest.update({
          where: { id: params.id },
          data: {
            status: validatedData.status,
            comment: validatedData.comment,
            domainId: validatedData.domainId
          },
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                email: true
              }
            },
            domain: true
          }
        })
      })

      updatedRequest = result
    } else {
      // Just update the request status
      updatedRequest = await prisma.domainRequest.update({
        where: { id: params.id },
        data: {
          status: validatedData.status,
          comment: validatedData.comment
        },
        include: {
          user: {
            select: {
              id: true,
              displayName: true,
              email: true
            }
          },
          domain: true
        }
      })
    }

    return NextResponse.json(updatedRequest)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating domain request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
