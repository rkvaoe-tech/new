import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const editUserSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(1),
  role: z.enum(['USER', 'ADMIN']),
  newPassword: z.string().optional(),
}).refine((data) => {
  // If password is provided, it must be at least 6 characters
  if (data.newPassword && data.newPassword.length > 0) {
    return data.newPassword.length >= 6
  }
  return true
}, {
  message: "Password must be at least 6 characters",
  path: ["newPassword"]
})

interface RouteParams {
  params: {
    userId: string
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = editUserSchema.parse(body)

    // Get current user data
    const currentUser = await prisma.appUser.findUnique({
      where: { id: params.userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
      }
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if email is being changed and if it's already taken by another user
    if (validatedData.email !== currentUser.email) {
      const existingUser = await prisma.appUser.findUnique({
        where: { email: validatedData.email }
      })

      if (existingUser && existingUser.id !== params.userId) {
        return NextResponse.json(
          { error: 'Email address is already in use by another user' },
          { status: 400 }
        )
      }
    }

    // Prepare update data
    const updateData: any = {
      email: validatedData.email,
      displayName: validatedData.displayName,
      role: validatedData.role,
      updatedAt: new Date(),
    }

    // Handle password change
    if (validatedData.newPassword && validatedData.newPassword.length > 0) {
      // Hash new password
      const saltRounds = 12
      updateData.passwordHash = await bcrypt.hash(validatedData.newPassword, saltRounds)
    }

    // Update user
    const updatedUser = await prisma.appUser.update({
      where: { id: params.userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        isBlocked: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        binomApiKey: true,
        googleSheetsId: true,
        _count: {
          select: {
            domainRequests: true
          }
        }
      }
    })

    console.log(`Admin ${session.user.email} updated user ${updatedUser.email}`)

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: 'User updated successfully'
    })

  } catch (error) {
    console.error('Edit user error:', error)
    
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
