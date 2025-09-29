import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Получение всех справочников (публичный API)
export async function GET() {
  try {
    const [verticals, offerTypes, geos, languages, partners] = await Promise.all([
      prisma.vertical.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' },
        select: { name: true, order: true }
      }),
      prisma.offerType.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' },
        select: { name: true, order: true }
      }),
      prisma.geo.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' },
        select: { code: true, name: true, order: true }
      }),
      prisma.language.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' },
        select: { code: true, name: true, order: true }
      }),
      prisma.partner.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' },
        select: { code: true, name: true, order: true }
      })
    ])

    // Форматируем данные для совместимости с существующими константами
    const response = {
      VERTICAL_OPTIONS: verticals.map(v => v.name),
      OFFER_TYPE_OPTIONS: offerTypes.map(t => t.name),
      GEO_OPTIONS: geos.map(g => g.code),
      LOCALE_OPTIONS: languages.map(l => l.code),
      PARTNER_OPTIONS: partners.map(p => p.code),
      
      // Дополнительные данные с полными названиями
      verticals: verticals,
      offerTypes: offerTypes,
      geos: geos,
      languages: languages,
      partners: partners
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching references:', error)
    console.error('Error details:', JSON.stringify(error, null, 2))
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
