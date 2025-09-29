import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/my-domains - Get user's assigned domains
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const domains = await prisma.domain.findMany({
      where: {
        assignedTo: session.user.id
      },
      orderBy: {
        assignedAt: 'asc'
      }
    })

    return NextResponse.json(domains)
  } catch (error) {
    console.error('Error fetching user domains:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
