import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Schema for bulk domain creation
const bulkDomainsSchema = z.object({
  domains: z.array(z.string().regex(
    /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.[a-zA-Z]{2,}$/,
    'Invalid domain format'
  )).min(1, 'At least one domain is required'),
  cost: z.number().min(0).max(999999.99).nullable().optional()
})

// POST /api/admin/domains/bulk - Create multiple domains
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Bulk domains API called')
    const session = await getServerSession(authOptions)
    console.log('🔍 Session:', session ? { user: session.user.email, role: session.user.role } : 'null')

    if (!session?.user) {
      console.log('❌ No session found')
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      console.log('❌ Insufficient permissions:', session.user.role)
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    console.log('🔍 Request body:', body)
    const validatedData = bulkDomainsSchema.parse(body)
    console.log('🔍 Validated data:', validatedData)

    // Check for existing domains
    const existingDomains = await prisma.domain.findMany({
      where: {
        domain: {
          in: validatedData.domains
        }
      },
      select: {
        domain: true
      }
    })

    const existingDomainNames = existingDomains.map(d => d.domain)
    const newDomains = validatedData.domains.filter(domain => !existingDomainNames.includes(domain))
    
    if (newDomains.length === 0) {
      return NextResponse.json(
        { 
          error: 'All domains already exist',
          existing: existingDomainNames
        },
        { status: 400 }
      )
    }

    // Create new domains
    console.log('🔍 Creating domains:', newDomains)
    console.log('🔍 Domain cost:', validatedData.cost)
    const createdDomains = await prisma.$transaction(
      newDomains.map(domain => 
        prisma.domain.create({
          data: { 
            domain,
            cost: validatedData.cost || null
          },
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                email: true
              }
            }
          }
        })
      )
    )

    console.log('✅ Created domains:', createdDomains.length)
    return NextResponse.json({
      created: createdDomains,
      skipped: existingDomainNames,
      message: `Created ${createdDomains.length} domains${existingDomainNames.length > 0 ? `, skipped ${existingDomainNames.length} existing` : ''}`
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating bulk domains:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
