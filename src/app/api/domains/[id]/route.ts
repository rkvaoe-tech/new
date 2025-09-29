import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createBinomService } from '@/lib/binom'

// DELETE /api/domains/[id] - Delete domain (only for user's own archived domains)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('🗑️ Delete API called for domain:', id)
    
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Check if domain belongs to user and is archived, get Binom info
    const domain = await prisma.domain.findFirst({
      where: {
        id: id,
        assignedTo: session.user.id,
        isArchived: true // Only allow deletion of archived domains
      },
      include: {
        user: {
          select: {
            binomApiKey: true
          }
        }
      }
    })

    if (!domain) {
      return NextResponse.json({ 
        error: 'Domain not found or cannot be deleted. Only archived domains can be deleted.' 
      }, { status: 404 })
    }

    let binomStatus = 'skipped'
    
    // Skip Binom deletion for archived domains - they were already deleted from Binom during archiving
    console.log('📝 Skipping Binom deletion - domain was already removed from Binom during archiving')

    // Delete the domain from database
    await prisma.domain.delete({
      where: { id: id }
    })

    console.log('✅ Domain deleted successfully from database:', id)
    return NextResponse.json({ 
      success: true, 
      binomIntegration: binomStatus 
    })
  } catch (error) {
    console.error('Error deleting domain:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
