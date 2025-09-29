'use client'

import { useState } from 'react'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy } from '@dnd-kit/sortable'
import { SortableOfferCard } from './sortable-offer-card'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { OfferWithLandings } from '@/types'

interface SortableOffersGridProps {
  offers: OfferWithLandings[]
  editMode: boolean
  onOfferUpdate: () => void
}

export function SortableOffersGrid({ offers, editMode, onOfferUpdate }: SortableOffersGridProps) {
  const [items, setItems] = useState(offers)
  const queryClient = useQueryClient()
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const reorderMutation = useMutation({
    mutationFn: async (reorderedItems: OfferWithLandings[]) => {
      const updates = reorderedItems.map((item, index) => ({
        id: item.id,
        order: (index + 1) * 10, // Умножаем на 10 для возможности вставки между элементами
      }))

      const response = await fetch('/api/offers/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: updates }),
      })

      if (!response.ok) {
        throw new Error('Failed to reorder offers')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offers'] })
      toast.success('Порядок офферов обновлен')
      onOfferUpdate()
    },
    onError: (error) => {
      console.error('Error reordering offers:', error)
      toast.error('Ошибка при изменении порядка')
      // Откатываем изменения
      setItems(offers)
    },
  })

  const handleDragEnd = (event: any) => {
    const { active, over } = event

    if (active.id !== over.id) {
      const oldIndex = items.findIndex(item => item.id === active.id)
      const newIndex = items.findIndex(item => item.id === over.id)
      
      const newItems = arrayMove(items, oldIndex, newIndex)
      setItems(newItems)
      
      // Отправляем обновления на сервер
      reorderMutation.mutate(newItems)
    }
  }

  // Синхронизируем локальное состояние с props
  if (offers !== items && !reorderMutation.isPending) {
    setItems(offers)
  }

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
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items.map(offer => offer.id)} strategy={rectSortingStrategy}>
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 ${editMode ? 'ml-8' : ''}`}>
          {items.map((offer) => (
            <SortableOfferCard
              key={offer.id}
              offer={offer}
              editMode={editMode}
              onUpdate={onOfferUpdate}
              disabled={reorderMutation.isPending}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
