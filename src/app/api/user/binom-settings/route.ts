import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createBinomService } from '@/lib/binom'
import { z } from 'zod'

const binomSettingsSchema = z.object({
  binomUrl: z.string().url('Please enter a valid URL'),
  binomApiKey: z.string().min(1, 'API key is required'),
  binomUserId: z.number().optional().nullable()
})

// GET /api/user/binom-settings - Get user's Binom settings
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const user = await prisma.appUser.findUnique({
      where: { id: session.user.id },
      select: {
        binomUrl: true,
        binomApiKey: true,
        binomUserId: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      binomUrl: user.binomUrl,
      binomApiKey: user.binomApiKey ? '***hidden***' : null, // Скрываем API ключ
      binomUserId: user.binomUserId,
      isConfigured: !!(user.binomUrl && user.binomApiKey)
    })
  } catch (error) {
    console.error('Error fetching Binom settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/user/binom-settings - Update user's Binom settings
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = binomSettingsSchema.parse(body)

    // Test connection before saving
    const binomService = createBinomService({
      binomUrl: validatedData.binomUrl,
      binomApiKey: validatedData.binomApiKey,
      binomUserId: validatedData.binomUserId
    })

    if (!binomService) {
      return NextResponse.json(
        { error: 'Invalid Binom configuration' },
        { status: 400 }
      )
    }

    console.log(`Testing Binom connection for user ${session.user.email}`)
    const connectionTest = await binomService.testConnection()

    if (!connectionTest.success) {
      return NextResponse.json(
        { 
          error: 'Failed to connect to Binom API',
          details: connectionTest.error
        },
        { status: 400 }
      )
    }

    // Save settings if connection test passed
    const updatedUser = await prisma.appUser.update({
      where: { id: session.user.id },
      data: {
        binomUrl: validatedData.binomUrl,
        binomApiKey: validatedData.binomApiKey,
        binomUserId: validatedData.binomUserId
      },
      select: {
        binomUrl: true,
        binomUserId: true
      }
    })

    console.log(`✅ Binom settings saved for user ${session.user.email}`)

    return NextResponse.json({
      success: true,
      message: 'Binom settings saved successfully',
      settings: {
        binomUrl: updatedUser.binomUrl,
        binomApiKey: '***hidden***',
        binomUserId: updatedUser.binomUserId,
        isConfigured: true
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error saving Binom settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/user/binom-settings - Remove user's Binom settings
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    await prisma.appUser.update({
      where: { id: session.user.id },
      data: {
        binomUrl: null,
        binomApiKey: null,
        binomUserId: null
      }
    })

    console.log(`🗑️ Binom settings removed for user ${session.user.email}`)

    return NextResponse.json({
      success: true,
      message: 'Binom settings removed successfully'
    })
  } catch (error) {
    console.error('Error removing Binom settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
