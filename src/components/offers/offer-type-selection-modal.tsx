'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { useReferences } from '@/hooks/useReferences'

interface OfferTypeSelectionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedType: string | null
  onSelectionChange: (type: string | null) => void
  position?: { x: number; y: number }
}

export function OfferTypeSelectionModal({
  open,
  onOpenChange,
  selectedType,
  onSelectionChange,
  position
}: OfferTypeSelectionModalProps) {
  const { data: references, isLoading } = useReferences()
  const [tempSelected, setTempSelected] = useState<string | null>(selectedType)

  // Получаем список типов офферов из базы данных
  const offerTypes = references?.OFFER_TYPE_OPTIONS || []
  const OFFER_TYPES = offerTypes

  // Синхронизируем с внешним состоянием при открытии
  useEffect(() => {
    if (open) {
      setTempSelected(selectedType)
    }
  }, [open, selectedType])

  // Обработка изменения выбора типа
  const handleTypeSelect = (type: string) => {
    setTempSelected(type)
  }

  // Автосохранение при клике вне модального окна
  const handleClose = () => {
    onSelectionChange(tempSelected)
    onOpenChange(false)
  }

  // Обработка клика вне модального окна
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  // Обработка Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        handleClose()
      }
    }
    
    if (open) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [open, tempSelected])

  if (!open) return null

  console.log('OfferTypeModal открыто:', { open, selectedType, tempSelected, position })

  // Позиционирование модального окна
  const modalStyle: React.CSSProperties = position 
    ? {
        position: 'absolute',
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -50%)'
      }
    : {
        position: 'fixed',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)'
      }

  return (
    <div 
      className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center"
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-white rounded-lg shadow-lg p-4 max-w-xs w-full mx-4"
        style={modalStyle}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3">
          <h3 className="text-sm font-medium text-gray-900">
            Offer Type
          </h3>
        </div>
        
        {/* Offer Types */}
        <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="col-span-2 text-center py-4 text-gray-500">
              Loading...
            </div>
          ) : (
            OFFER_TYPES.map((type) => {
            const isSelected = tempSelected === type
            return (
              <Badge
                key={type}
                variant={isSelected ? "default" : "outline"}
                className={`text-xs cursor-pointer hover:bg-gray-100 justify-center py-2 transition-colors ${
                  isSelected 
                    ? 'bg-blue-500 text-white hover:bg-blue-600' 
                    : 'hover:bg-gray-100'
                }`}
                onClick={() => handleTypeSelect(type)}
              >
                {type}
              </Badge>
            )
          })
          )}
        </div>
        
        <div className="mt-3 text-xs text-gray-500 text-center">
          Click outside to save
        </div>
      </div>
    </div>
  )
}
