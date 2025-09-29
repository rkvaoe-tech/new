'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { useReferences } from '@/hooks/useReferences'

interface GeoSelectionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedGeo: string[]
  onSelectionChange: (geo: string[]) => void
  position?: { x: number; y: number }
}

export function GeoSelectionModal({
  open,
  onOpenChange,
  selectedGeo,
  onSelectionChange,
  position
}: GeoSelectionModalProps) {
  const { data: references, isLoading } = useReferences()
  const [tempSelected, setTempSelected] = useState<string[]>(selectedGeo)

  // Получаем список гео из базы данных
  const geoOptions = references?.GEO_OPTIONS || []

  // Синхронизируем с внешним состоянием при открытии
  useEffect(() => {
    if (open) {
      setTempSelected(selectedGeo)
    }
  }, [open, selectedGeo])

  // Обработка изменения выбора страны
  const handleGeoToggle = (geo: string) => {
    setTempSelected(prev => {
      if (prev.includes(geo)) {
        return prev.filter(g => g !== geo)
      } else {
        return [...prev, geo]
      }
    })
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
        className="bg-white rounded-lg shadow-lg p-4 max-w-sm w-full mx-4 max-h-80 overflow-hidden"
        style={modalStyle}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3">
          <h3 className="text-sm font-medium text-gray-900">
            Select Countries ({tempSelected.length})
          </h3>
        </div>
        
        {/* Countries Grid */}
        <div className="grid grid-cols-3 gap-1 max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="col-span-3 text-center py-4 text-gray-500">
              Loading...
            </div>
          ) : (
            geoOptions.map((geo) => (
            <Badge
              key={geo}
              variant={tempSelected.includes(geo) ? "default" : "outline"}
              className={`text-xs cursor-pointer hover:bg-gray-100 justify-center py-1 transition-colors ${
                tempSelected.includes(geo) 
                  ? 'bg-blue-500 text-white hover:bg-blue-600' 
                  : 'hover:bg-gray-100'
              }`}
              onClick={() => handleGeoToggle(geo)}
            >
              {geo}
            </Badge>
          ))
          )}
        </div>
        
        <div className="mt-3 text-xs text-gray-500 text-center">
          Click outside to save
        </div>
      </div>
    </div>
  )
}
