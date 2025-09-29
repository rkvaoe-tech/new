'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { useReferences } from '@/hooks/useReferences'

interface VerticalSelectionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedVertical: string | null
  onSelectionChange: (vertical: string | null) => void
  position?: { x: number; y: number }
}

export function VerticalSelectionModal({
  open,
  onOpenChange,
  selectedVertical,
  onSelectionChange,
  position
}: VerticalSelectionModalProps) {
  const { data: references, isLoading } = useReferences()
  const [tempSelected, setTempSelected] = useState<string | null>(selectedVertical)

  // Получаем список вертикалей из базы данных
  const verticals = references?.VERTICAL_OPTIONS || []
  const VERTICALS = verticals

  // Синхронизируем с внешним состоянием при открытии
  useEffect(() => {
    if (open) {
      setTempSelected(selectedVertical)
    }
  }, [open, selectedVertical])

  // Обработка изменения выбора вертикали
  const handleVerticalSelect = (vertical: string) => {
    setTempSelected(vertical)
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

  console.log('VerticalModal открыто:', { open, selectedVertical, tempSelected, position })

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
        className="bg-white rounded-lg shadow-lg p-4 max-w-md w-full mx-4"
        style={modalStyle}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3">
          <h3 className="text-sm font-medium text-gray-900">
            Offer Vertical
          </h3>
        </div>
        
        {/* Verticals */}
        <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="col-span-2 text-center py-4 text-gray-500">
              Loading...
            </div>
          ) : (
            VERTICALS.map((vertical) => {
            const isSelected = tempSelected === vertical
            return (
              <Badge
                key={vertical}
                variant={isSelected ? "default" : "outline"}
                className={`text-xs cursor-pointer hover:bg-gray-100 justify-center py-2 transition-colors ${
                  isSelected 
                    ? 'bg-blue-500 text-white hover:bg-blue-600' 
                    : 'hover:bg-gray-100'
                }`}
                onClick={() => handleVerticalSelect(vertical)}
              >
                {vertical}
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
