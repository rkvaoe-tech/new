import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createBinomService } from '@/lib/binom'

// PATCH /api/domains/[id]/archive - Toggle domain archive status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('🔍 Archive API called for domain:', id)
    const session = await getServerSession(authOptions)
    console.log('🔍 Session:', session ? { user: session.user.email, role: session.user.role } : 'null')

    if (!session?.user) {
      console.log('❌ No session found')
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    console.log('🔍 Request body:', body)
    const { isArchived } = body

    // Check if domain belongs to user and get user's Binom settings
    console.log('🔍 Looking for domain with id:', id, 'assigned to user:', session.user.id)
    const domain = await prisma.domain.findFirst({
      where: {
        id: id,
        assignedTo: session.user.id
      },
      include: {
        user: {
          select: {
            binomApiKey: true
          }
        }
      }
    })

    console.log('🔍 Found domain:', domain ? { id: domain.id, domain: domain.domain, assignedTo: domain.assignedTo, binomDomainId: domain.binomDomainId } : 'null')

    if (!domain) {
      console.log('❌ Domain not found or not owned by user')
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 })
    }

    let binomStatus = 'disabled'
    
    // If archiving domain and it has Binom ID, try to delete from Binom
    if (isArchived && domain.binomDomainId && domain.user?.binomApiKey) {
      console.log('🔍 Attempting to delete domain from Binom...')
      console.log(`📋 Binom domain ID: ${domain.binomDomainId}`)
      
      const binomService = createBinomService(domain.user)
      
      if (binomService) {
        try {
          const binomResult = await binomService.deleteDomain(domain.binomDomainId)
          
          console.log(`📡 Binom delete response:`, binomResult)
          
          if (binomResult.success) {
            console.log(`✅ Successfully deleted domain ${domain.domain} from Binom`)
            binomStatus = 'deleted'
          } else {
            console.error(`❌ Failed to delete domain ${domain.domain} from Binom: ${binomResult.error}`)
            binomStatus = 'delete_error'
          }
        } catch (binomError) {
          console.error('🚨 Binom delete error:', binomError)
          binomStatus = 'delete_error'
        }
      }
    } else if (!isArchived) {
      // If unarchiving (restoring) domain, check domain limit first
      const activeDomainCount = await prisma.domain.count({
        where: {
          assignedTo: session.user.id,
          isArchived: false,
          id: { not: domain.id } // Exclude current domain from count
        }
      })

      console.log(`📊 User ${session.user.email} has ${activeDomainCount} active domains before restore`)

      if (activeDomainCount >= 10) {
        return NextResponse.json(
          { 
            error: 'Cannot restore domain: You have reached the maximum limit of 10 active domains. Please archive some domains first.',
            currentCount: activeDomainCount,
            maxLimit: 10
          },
          { status: 400 }
        )
      }

      // Try to re-add domain to Binom when restoring
      if (domain.user?.binomApiKey) {
        console.log('🔍 Attempting to re-add domain to Binom on restore...')
        
        const binomService = createBinomService(domain.user)
        
        if (binomService) {
          try {
            const binomResult = await binomService.addDomain(domain.domain)
            
            console.log(`📡 Binom restore response:`, binomResult)
            
            if (binomResult.success && binomResult.data) {
              console.log(`✅ Successfully re-added domain ${domain.domain} to Binom with ID ${binomResult.data.id}`)
              
              // Update the Binom domain ID in database
              await prisma.domain.update({
                where: { id: domain.id },
                data: { binomDomainId: binomResult.data.id }
              })
              
              binomStatus = 'restored'
            } else {
              console.error(`❌ Failed to re-add domain ${domain.domain} to Binom: ${binomResult.error}`)
              binomStatus = 'restore_error'
            }
          } catch (binomError) {
            console.error('🚨 Binom restore error:', binomError)
            binomStatus = 'restore_error'
          }
        }
      } else {
        console.log('📝 Domain restored, but no Binom configuration')
        binomStatus = 'restored_no_binom'
      }
    }

    // Update archive status
    console.log('🔍 Updating domain archive status to:', isArchived)
    const updatedDomain = await prisma.domain.update({
      where: { id: id },
      data: {
        isArchived: isArchived,
        archivedAt: isArchived ? new Date() : null
      }
    })

    console.log('✅ Domain updated successfully:', updatedDomain.id)
    return NextResponse.json({
      ...updatedDomain,
      binomIntegration: binomStatus
    })
  } catch (error) {
    console.error('Error updating domain archive status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
