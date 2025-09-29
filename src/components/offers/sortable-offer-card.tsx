'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { InlineOfferCard } from './inline-offer-card'
import { Button } from '@/components/ui/button'
import { GripVertical, Copy, Trash2, PlusSquare } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { OfferStatus } from '@prisma/client'
import type { OfferWithLandings } from '@/types'

interface SortableOfferCardProps {
  offer: OfferWithLandings
  editMode: boolean
  onUpdate: () => void
  disabled?: boolean
}

export function SortableOfferCard({ offer, editMode, onUpdate, disabled }: SortableOfferCardProps) {
  // В edit mode все карточки сразу редактируемые
  const isEditing = editMode
  const queryClient = useQueryClient()
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: offer.id,
    disabled: !editMode || disabled,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }


  const handleDuplicate = async () => {
    try {
      const response = await fetch(`/api/offers/${offer.id}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Ошибка дублирования:', errorData)
        throw new Error('Failed to duplicate offer')
      }

      const result = await response.json()
      const landingsCount = result.landings?.length || 0
      
      toast.success(`Оффер дублирован с ${landingsCount} лендингами`)
      queryClient.invalidateQueries({ queryKey: ['offers'] })
      onUpdate()
    } catch (error) {
      console.error('Ошибка при дублировании:', error)
      toast.error('Ошибка при дублировании')
    }
  }

  const handleDelete = async () => {
    if (!confirm('Вы уверены, что хотите удалить этот оффер?')) {
      return
    }

    try {
      const response = await fetch(`/api/offers/${offer.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete offer')
      }

      toast.success('Оффер удален')
      queryClient.invalidateQueries({ queryKey: ['offers'] })
      onUpdate()
    } catch (error) {
      console.error('Error deleting offer:', error)
      toast.error('Ошибка при удалении')
    }
  }


  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative ${isDragging ? 'z-50' : ''}`}
    >
      {/* Кнопки управления - за пределами карточки слева сверху */}
      {editMode && (
        <div className="absolute -left-8 top-0 flex flex-col gap-1 z-20">
          {/* Drag handle */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 bg-white shadow-sm hover:bg-gray-50 cursor-grab active:cursor-grabbing"
            {...attributes}
            {...listeners}
            title="Перетащите для изменения порядка"
          >
            <GripVertical className="h-4 w-4 text-gray-600" />
          </Button>
          
          {/* Кнопка добавления лендингов */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 bg-white shadow-sm hover:bg-blue-50"
            onClick={() => {
              // Отправляем событие для открытия диалога лендингов
              const event = new CustomEvent('openBulkLandingDialog', { 
                detail: { offerId: offer.id } 
              });
              document.dispatchEvent(event);
            }}
            title="Добавить лендинги"
          >
            <PlusSquare className="h-4 w-4 text-blue-600" />
          </Button>

          {/* Кнопка дублирования */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 bg-white shadow-sm hover:bg-gray-50"
            onClick={handleDuplicate}
            title="Дублировать оффер"
          >
            <Copy className="h-4 w-4 text-gray-600" />
          </Button>

          {/* Кнопка удаления */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 bg-white shadow-sm hover:bg-red-50"
            onClick={handleDelete}
            title="Удалить оффер"
          >
            <Trash2 className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      )}
      
      <InlineOfferCard
        offer={offer}
        editMode={editMode}
        onUpdate={onUpdate}
        isEditing={isEditing}
      />
    </div>
  )
}
