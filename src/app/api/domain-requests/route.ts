import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createBinomService } from '@/lib/binom'
import { createGoogleSheetsService } from '@/lib/google-sheets'
import { z } from 'zod'

const createRequestSchema = z.object({
  // Комментарий больше не требуется, но оставляем для совместимости
  comment: z.string().optional().default('')
})

// GET /api/domain-requests - Get user's domain requests
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const requests = await prisma.domainRequest.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        domain: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(requests)
  } catch (error) {
    console.error('Error fetching user domain requests:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/domain-requests - Create new domain request
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createRequestSchema.parse(body)

    // Check if user already has a pending request
    const existingRequest = await prisma.domainRequest.findFirst({
      where: {
        userId: session.user.id,
        status: 'PENDING'
      }
    })

    if (existingRequest) {
      return NextResponse.json(
        { error: 'You already have a pending domain request' },
        { status: 400 }
      )
    }

    // Check user's active domain limit (maximum 10 active domains)
    const activeDomainCount = await prisma.domain.count({
      where: {
        assignedTo: session.user.id,
        isArchived: false
      }
    })

    console.log(`📊 User ${session.user.email} has ${activeDomainCount} active domains`)

    if (activeDomainCount >= 10) {
      return NextResponse.json(
        { 
          error: 'You have reached the maximum limit of 10 active domains. Please archive some domains before requesting new ones.',
          currentCount: activeDomainCount,
          maxLimit: 10
        },
        { status: 400 }
      )
    }

    // Find first available domain
    const availableDomain = await prisma.domain.findFirst({
      where: {
        isAssigned: false
      },
      orderBy: {
        createdAt: 'asc' // FIFO - первый добавленный, первый назначенный
      }
    })

    if (!availableDomain) {
      return NextResponse.json(
        { error: 'No available domains at the moment. Please try again later.' },
        { status: 400 }
      )
    }

    // Get user data for integrations
    const userData = await prisma.appUser.findUnique({
      where: { id: session.user.id },
      select: {
        binomApiKey: true,
        googleSheetsId: true,
      }
    })

    // Use transaction to assign domain and create request record
    const result = await prisma.$transaction(async (tx) => {
      // Assign domain to user
      const assignedDomain = await tx.domain.update({
        where: { id: availableDomain.id },
        data: {
          isAssigned: true,
          assignedTo: session.user.id,
          assignedAt: new Date()
        }
      })

      // Create request record with APPROVED status
      const domainRequest = await tx.domainRequest.create({
        data: {
          userId: session.user.id,
          domainId: availableDomain.id,
          comment: validatedData.comment || 'Auto-assigned domain',
          status: 'APPROVED'
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

      return { domainRequest, assignedDomain }
    })

    // Try to add domain to Binom after successful database transaction
    console.log('🔍 Checking Binom integration...')
    console.log('userData:', userData)
    console.log('assignedDomain:', result.assignedDomain?.domain)
    
    let binomStatus = 'disabled'
    let sheetsStatus = 'disabled'
    
    if (userData && result.assignedDomain) {
      console.log(`📋 User data: binomApiKey exists = ${!!userData.binomApiKey}`)
      
      const binomService = createBinomService(userData)
      
      if (binomService) {
        console.log(`🚀 Attempting to add domain ${result.assignedDomain.domain} to Binom for user ${session.user.email}`)
        console.log(`🌐 BINOM_BASE_URL: ${process.env.BINOM_BASE_URL}`)
        
        try {
          const binomResult = await binomService.addDomain(result.assignedDomain.domain)
          
          console.log(`📡 Binom API response:`, binomResult)
          
          if (binomResult.success && binomResult.data) {
            console.log(`✅ Successfully added domain ${result.assignedDomain.domain} to Binom with ID ${binomResult.data.id}`)
            
            // Сохраняем Binom domain ID в базе данных
            await prisma.domain.update({
              where: { id: result.assignedDomain.id },
              data: { binomDomainId: binomResult.data.id }
            })
            
            console.log(`💾 Saved Binom domain ID ${binomResult.data.id} for domain ${result.assignedDomain.domain}`)
            binomStatus = 'success'
          } else {
            console.error(`❌ Failed to add domain ${result.assignedDomain.domain} to Binom: ${binomResult.error}`)
            binomStatus = 'error'
          }
        } catch (binomError) {
          console.error('🚨 Binom integration error:', binomError)
          binomStatus = 'error'
        }
      } else {
        console.log(`⚠️ User ${session.user.email} doesn't have Binom configuration - binomService is null`)
        binomStatus = 'not_configured'
      }
    } else {
      console.log(`⚠️ Binom integration skipped: userData=${!!userData}, assignedDomain=${!!result.assignedDomain}`)
      binomStatus = 'skipped'
    }

    // Try to log to Google Sheets after successful domain assignment
    const googleSheetsService = createGoogleSheetsService(userData?.googleSheetsId || undefined)
    
    if (googleSheetsService && result.assignedDomain && userData?.googleSheetsId) {
      console.log('📊 Attempting to update monthly stats in Google Sheets...')
      
      try {
        const sheetsResult = await googleSheetsService.updateMonthlyStats({
          domain: result.assignedDomain.domain,
          cost: result.assignedDomain.cost ? Number(result.assignedDomain.cost) : null,
          userEmail: session.user.email,
          userName: session.user.displayName || session.user.email,
          assignedAt: result.assignedDomain.assignedAt || new Date()
        })
        
        if (sheetsResult.success) {
          console.log('✅ Successfully updated monthly stats in Google Sheets')
          sheetsStatus = 'success'
        } else {
          console.error('❌ Failed to update monthly stats:', sheetsResult.error)
          sheetsStatus = 'error'
        }
      } catch (sheetsError) {
        console.error('🚨 Google Sheets integration error:', sheetsError)
      }
    } else {
      console.log('⚠️ Google Sheets not configured or no assigned domain')
    }

    return NextResponse.json({
      ...result.domainRequest,
      binomIntegration: binomStatus,
      sheetsIntegration: sheetsStatus
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating domain request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
