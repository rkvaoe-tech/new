import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateIntegrationsSchema = z.object({
  binomApiKey: z.string().nullable().optional(),
  googleSheetsId: z.string().nullable().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId } = await params
    const body = await request.json()
    const validatedData = updateIntegrationsSchema.parse(body)

    // Check if user exists
    const user = await prisma.appUser.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Update user integrations
    const updatedUser = await prisma.appUser.update({
      where: { id: userId },
      data: {
        binomApiKey: validatedData.binomApiKey,
        googleSheetsId: validatedData.googleSheetsId,
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        binomApiKey: true,
        googleSheetsId: true,
      }
    })

    console.log(`Admin ${session.user.email} updated integrations for user ${user.email}`)

    return NextResponse.json({
      success: true,
      user: updatedUser
    })

  } catch (error) {
    console.error('Update user integrations error:', error)
    
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
