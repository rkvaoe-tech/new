'use client'

import { OfferCard } from './offer-card'
import type { OfferWithLandings } from '@/types'

interface OffersGridProps {
  offers: OfferWithLandings[]
  editMode: boolean
  onOfferUpdate: () => void
}

export function OffersGrid({ offers, editMode, onOfferUpdate }: OffersGridProps) {
  if (offers.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg">Офферы не найдены</div>
        <div className="text-gray-400 text-sm mt-2">
          Попробуйте изменить фильтры или создать новый оффер
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {offers.map((offer) => (
        <OfferCard
          key={offer.id}
          offer={offer}
          editMode={editMode}
          onUpdate={onOfferUpdate}
        />
      ))}
    </div>
  )
}
