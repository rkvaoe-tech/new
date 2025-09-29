'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { SortableOffersGrid } from './sortable-offers-grid'
import { OffersToolbar } from './offers-toolbar'
import type { OffersFilter } from '@/types'

interface OffersPageContentProps {
  editMode: boolean
}

export function OffersPageContent({ editMode }: OffersPageContentProps) {
  const [filters, setFilters] = useState<OffersFilter>({})

  const { data: offersData, isLoading } = useQuery({
    queryKey: ['offers', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      
      if (filters.geo) params.append('geo', filters.geo)
      if (filters.locale) params.append('locale', filters.locale)
      if (filters.partner) params.append('partner', filters.partner)
      if (filters.offerType) params.append('offerType', filters.offerType)
      if (filters.vertical) params.append('vertical', filters.vertical)
      if (filters.status) params.append('status', filters.status)

      const response = await fetch(`/api/offers?${params.toString()}`, {
        credentials: 'include',
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch offers')
      }
      
      return response.json()
    },
  })

  const offers = offersData?.offers || []

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p>Loading offers...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <OffersToolbar
        filters={filters}
        onFiltersChange={setFilters}
        showFilters={true}
      />

      {/* Offers Grid */}
      {offers.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-lg font-medium mb-2">No offers found</h3>
            <p>Try adjusting your filters or create a new offer.</p>
          </div>
        </div>
      ) : (
        <SortableOffersGrid
          offers={offers}
          editMode={editMode}
          onOfferUpdate={() => {
            // Refetch offers after update
          }}
        />
      )}
    </div>
  )
}
