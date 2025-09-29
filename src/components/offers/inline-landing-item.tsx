'use client'

import { Badge } from '@/components/ui/badge'
import type { Landing } from '@prisma/client'

interface InlineLandingItemProps {
  landing: Landing
  editMode: boolean
  onEdit: (landing: Landing) => void
  onDelete: (landingId: string) => void
}

export function InlineLandingItem({ landing, editMode, onEdit, onDelete }: InlineLandingItemProps) {

  return (
    <div className="p-2 hover:bg-gray-50 rounded">
      <div className="flex items-start gap-2">
        {/* Левая часть: ID */}
        {landing.extId && (
          <div className="text-xs text-gray-500 flex-shrink-0 mt-0.5">
            {landing.extId}
          </div>
        )}
        
        {/* Центральная часть: Название (занимает больше места) */}
        <div className="flex-1 min-w-0">
          <button
            className="text-sm font-medium text-left hover:text-blue-600 hover:underline cursor-pointer block w-full"
            onClick={() => window.open(landing.url, '_blank')}
            title={`Перейти на ${landing.label}`}
          >
            {landing.label}
          </button>
        </div>
        
        {/* Правая часть: Сеть и Язык */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {landing.networkCode && landing.type === 'LANDING' && (
            <Badge className="text-xs bg-yellow-100 text-yellow-800">
              {landing.networkCode}
            </Badge>
          )}
          <Badge variant="outline" className="text-xs">
            {landing.locale}
          </Badge>
        </div>
      </div>
    </div>
  )
}
