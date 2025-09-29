import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// DELETE /api/admin/domains/[id] - Delete domain (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('🗑️ Admin Delete API called for domain:', id)
    
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Check if domain exists
    const domain = await prisma.domain.findUnique({
      where: { id: id }
    })

    if (!domain) {
      return NextResponse.json({ 
        error: 'Domain not found' 
      }, { status: 404 })
    }

    // Admin can delete any domain
    await prisma.domain.delete({
      where: { id: id }
    })

    console.log('✅ Domain deleted successfully by admin:', id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting domain (admin):', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}