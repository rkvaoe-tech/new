import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(100),
  email: z.string().email(),
  currentPassword: z.string().optional(),
  newPassword: z.string().optional(),
  confirmPassword: z.string().optional(),
}).refine((data) => {
  // If changing password, all password fields are required and must match
  if (data.currentPassword || data.newPassword || data.confirmPassword) {
    return data.currentPassword && data.newPassword && data.confirmPassword && 
           data.newPassword === data.confirmPassword &&
           data.newPassword.length >= 6
  }
  return true
}, {
  message: "Password fields are required when changing password, passwords must match, and new password must be at least 6 characters",
})

// PATCH /api/user/profile - Update user profile
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updateProfileSchema.parse(body)

    // Get current user data
    const currentUser = await prisma.appUser.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        displayName: true,
        passwordHash: true,
      }
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if email is being changed and if it's already taken
    if (validatedData.email !== currentUser.email) {
      const existingUser = await prisma.appUser.findUnique({
        where: { email: validatedData.email }
      })

      if (existingUser) {
        return NextResponse.json(
          { error: 'Email address is already in use' },
          { status: 400 }
        )
      }
    }

    // Prepare update data
    const updateData: any = {
      displayName: validatedData.displayName,
      email: validatedData.email,
      updatedAt: new Date(),
    }

    // Handle password change
    if (validatedData.currentPassword && validatedData.newPassword) {
      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(
        validatedData.currentPassword,
        currentUser.passwordHash
      )

      if (!isCurrentPasswordValid) {
        return NextResponse.json(
          { error: 'Current password is incorrect' },
          { status: 400 }
        )
      }

      // Hash new password
      const saltRounds = 12
      updateData.passwordHash = await bcrypt.hash(validatedData.newPassword, saltRounds)
    }

    // Update user
    const updatedUser = await prisma.appUser.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        updatedAt: true,
      }
    })

    console.log(`User ${session.user.email} updated their profile`)

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: 'Profile updated successfully'
    })

  } catch (error) {
    console.error('Update profile error:', error)
    
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

// GET /api/user/profile - Get user profile
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const user = await prisma.appUser.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
