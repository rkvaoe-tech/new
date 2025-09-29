'use client'

import { useState } from 'react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { BulkLandingDialog } from './bulk-landing-dialog'
import { InlineLandingItem } from './inline-landing-item'
import { 
  PlusSquare
} from 'lucide-react'
import type { Landing } from '@prisma/client'

interface LandingItemProps {
  landing: Landing
  editMode: boolean
}

function LandingItem({ landing, editMode }: LandingItemProps) {
  return (
    <div className="hover:bg-gray-50 rounded">
      <InlineLandingItem
        landing={landing}
        editMode={editMode}
        onEdit={() => {}} // Не используется
        onDelete={() => {}} // Не используется
      />
    </div>
  )
}

interface LandingsListProps {
  landings: Landing[]
  prelandings: Landing[]
  offerId: string
  editMode: boolean
  onUpdate: () => void
}

export function SortableLandingsList({ 
  landings, 
  prelandings, 
  offerId, 
  editMode, 
  onUpdate 
}: LandingsListProps) {
  const [showBulkCreateDialog, setShowBulkCreateDialog] = useState(false)

  const renderSection = (items: Landing[], type: 'LANDING' | 'PRELANDING', title: string) => (
    <AccordionItem value={type.toLowerCase()}>
      <AccordionTrigger className="text-sm py-2">
        <span>{title} ({items.length})</span>
      </AccordionTrigger>
      <AccordionContent className="pt-0">
        {items.length === 0 ? (
          <div className="text-xs text-gray-500 p-2 text-center">
            Нет {type === 'LANDING' ? 'лендингов' : 'прелендингов'}
          </div>
        ) : (
          <div className="space-y-1">
            {items.map((landing) => (
              <LandingItem
                key={landing.id}
                landing={landing}
                editMode={editMode}
              />
            ))}
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  )

  return (
    <>
      {/* Кнопка массового добавления */}
      {editMode && (
        <div className="flex justify-end mb-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowBulkCreateDialog(true)}
            className="flex items-center gap-2 text-xs"
          >
            <PlusSquare className="h-3 w-3" />
            Добавить лендинги
          </Button>
        </div>
      )}

      <Accordion type="multiple" className="w-full">
        {renderSection(landings, 'LANDING', 'Лендинги')}
        {renderSection(prelandings, 'PRELANDING', 'Прелендинги')}
      </Accordion>

      {/* Диалоги */}
      {editMode && (
        <BulkLandingDialog
          offerId={offerId}
          existingLandings={landings}
          existingPrelandings={prelandings}
          open={showBulkCreateDialog}
          onOpenChange={setShowBulkCreateDialog}
          onSuccess={onUpdate}
        />
      )}
    </>
  )
}
