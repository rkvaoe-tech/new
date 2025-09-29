'use client'

import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Image from 'next/image'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { LandingsList } from './landings-list'
import { BulkLandingDialog } from './bulk-landing-dialog'
import { GeoSelectionModal } from './geo-selection-modal'
import { OfferTypeSelectionModal } from './offer-type-selection-modal'
import { VerticalSelectionModal } from './vertical-selection-modal'
import { CustomTooltip } from '@/components/ui/tooltip-custom'
import { isNewOffer } from '@/lib/utils-offer'
import { toast } from 'sonner'
import { 
  DollarSign,
  X,
  Plus,
  Minus,
  Camera
} from 'lucide-react'
import { offerUpdateSchema } from '@/lib/validations'
import type { OfferWithLandings, OfferFormData } from '@/types'
import { useReferences } from '@/hooks/useReferences'
import { OfferStatus } from '@prisma/client'

interface InlineOfferCardProps {
  offer: OfferWithLandings
  editMode: boolean
  onUpdate: () => void
  isEditing?: boolean
}

export function InlineOfferCard({ 
  offer, 
  editMode, 
  onUpdate, 
  isEditing: externalIsEditing
}: InlineOfferCardProps) {
  const [selectedGeo, setSelectedGeo] = useState<string[]>(offer.geo)
  const [selectedOfferTypes, setSelectedOfferTypes] = useState<string[]>(offer.tags)
  const [imageKey, setImageKey] = useState(0) // Для принудительного обновления изображения
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Состояния для индивидуального редактирования полей
  const [editingField, setEditingField] = useState<string | null>(null)
  const [showGeoModal, setShowGeoModal] = useState(false)
  const [showOfferTypeModal, setShowOfferTypeModal] = useState(false)
  const [showVerticalModal, setShowVerticalModal] = useState(false)
  const [modalPosition, setModalPosition] = useState<{ x: number; y: number } | undefined>()
  const [offerTypeModalPosition, setOfferTypeModalPosition] = useState<{ x: number; y: number } | undefined>()
  const [verticalModalPosition, setVerticalModalPosition] = useState<{ x: number; y: number } | undefined>()
  const [showBulkLandingDialog, setShowBulkLandingDialog] = useState(false)
  
  const queryClient = useQueryClient()

  // Используем внешнее состояние если передано, иначе editMode
  const isEditing = externalIsEditing !== undefined ? externalIsEditing : editMode

  // Обработчик события для открытия диалога лендингов
  useEffect(() => {
    const handleOpenBulkLandingDialog = (event: CustomEvent) => {
      if (event.detail?.offerId === offer.id) {
        setShowBulkLandingDialog(true);
      }
    };

    document.addEventListener('openBulkLandingDialog', handleOpenBulkLandingDialog as EventListener);
    
    return () => {
      document.removeEventListener('openBulkLandingDialog', handleOpenBulkLandingDialog as EventListener);
    };
  }, [offer.id]);

  const form = useForm<OfferFormData>({
    resolver: zodResolver(offerUpdateSchema),
    defaultValues: {
      vertical: offer.vertical,
      title: offer.title,
      priceUsd: offer.priceUsd,
      geo: offer.geo,
      tags: offer.tags,
      status: offer.status,
      imageUrl: offer.imageUrl || '',
    },
  })

  // Синхронизируем локальное состояние с данными оффера
  useEffect(() => {
    setSelectedGeo(offer.geo)
    setSelectedOfferTypes(offer.tags)
    form.reset({
      vertical: offer.vertical,
      title: offer.title,
      priceUsd: offer.priceUsd,
      geo: offer.geo,
      tags: offer.tags,
      status: offer.status,
      imageUrl: offer.imageUrl || '',
    })
  }, [offer, form])

  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('image', file)

      const response = await fetch(`/api/offers/${offer.id}/image`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to upload image')
      }

      return response.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['offers'] })
      toast.success('Image uploaded successfully')
      handleFieldChange('imageUrl', data.imageUrl)
      setImageKey(prev => prev + 1) // Принудительно обновляем изображение
    },
    onError: (error: Error) => {
      console.error('Error uploading image:', error)
      toast.error(error.message)
    },
  })

  const updateOfferMutation = useMutation({
    mutationFn: async (data: Partial<OfferFormData>) => {
      // Сохраняем только основной тип (Trial/SS)
      const mainType = selectedOfferTypes.find(type => ['Trial', 'SS'].includes(type))
      const tagsToSave = mainType ? [mainType] : []
      
      const response = await fetch(`/api/offers/${offer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          geo: selectedGeo,
          tags: tagsToSave,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update offer')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offers'] })
      toast.success('Offer updated')
      onUpdate()
      // Состояние редактирования остается активным в edit mode
    },
    onError: (error) => {
      console.error('Error updating offer:', error)
      toast.error('Error updating offer')
    },
  })

  const handleAutoSave = () => {
    const formData = form.getValues()
    updateOfferMutation.mutate(formData)
  }

  const handleImageClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const file = files[0]
      
      // Проверяем тип файла
      if (!file.type.startsWith('image/')) {
        toast.error('File must be an image')
        return
      }

      // Проверяем размер файла (максимум 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must not exceed 5MB')
        return
      }

      uploadImageMutation.mutate(file)
    }
    
    // Сбрасываем значение input чтобы можно было выбрать тот же файл снова
    e.target.value = ''
  }

  // Автосохранение при изменении полей
  const handleFieldChange = (field: keyof OfferFormData, value: any) => {
    form.setValue(field, value)
    // Для изображения сохраняем сразу, для остальных полей с задержкой
    if (field === 'imageUrl') {
      handleAutoSave()
    } else {
      setTimeout(() => {
        handleAutoSave()
        setEditingField(null) // Закрываем редактирование после сохранения
      }, 500)
    }
  }

  // Функция для завершения редактирования поля
  const handleFieldSave = (field: keyof OfferFormData, value: any) => {
    handleFieldChange(field, value)
    setEditingField(null)
  }

  // Функция для отмены редактирования поля
  const handleFieldCancel = () => {
    setEditingField(null)
    form.reset() // Сбрасываем форму к исходным значениям
  }

  // Функции действий перенесены в SortableOfferCard

  const addGeo = (geo: string) => {
    if (!selectedGeo.includes(geo)) {
      const newGeo = [...selectedGeo, geo]
      setSelectedGeo(newGeo)
      handleFieldChange('geo', newGeo)
    }
  }

  const removeGeo = (geo: string) => {
    const newGeo = selectedGeo.filter(g => g !== geo)
    setSelectedGeo(newGeo)
    handleFieldChange('geo', newGeo)
  }

  // Обработчик для модального окна выбора GEO
  const handleGeoSelectionChange = (newGeo: string[]) => {
    setSelectedGeo(newGeo)
    handleFieldChange('geo', newGeo)
    setEditingField(null)
  }

  // Обработчик для модального окна выбора типа оффера
  const handleOfferTypeSelectionChange = (newType: string | null) => {
    // Убираем все старые типы и добавляем новый выбранный (только один основной тип)
    let newTypes: string[] = []
    if (newType) {
      newTypes = [newType]
    }
    setSelectedOfferTypes(newTypes)
    handleFieldChange('tags', newTypes)
  }

  // Обработчик для модального окна выбора вертикали
  const handleVerticalSelectionChange = (newVertical: string | null) => {
    handleFieldChange('vertical', newVertical || '')
  }

  // Функции для работы с дополнительными типами удалены, так как используется только основной тип

  const getStatusColor = (status: OfferStatus) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800'
      case 'PAUSED':
        return 'bg-yellow-100 text-yellow-800'
      case 'ARCHIVED':
        return 'bg-red-400 text-white'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: OfferStatus) => {
    switch (status) {
      case 'ACTIVE':
        return 'Active'
      case 'PAUSED':
        return 'Pause'
      case 'ARCHIVED':
        return 'Stop'
      default:
        return status
    }
  }

  const landings = offer.landings.filter(l => l.type === 'LANDING')
  const prelandings = offer.landings.filter(l => l.type === 'PRELANDING')

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow relative">
      {/* Бейдж NEW - наклейка в правом верхнем углу карточки */}
      {isNewOffer(new Date(offer.createdAt)) && (
        <div className="absolute top-0 right-0 z-50">
          <div className="bg-red-400 text-white text-xs font-bold px-3 py-1 rounded-bl-lg shadow-lg animate-pulse">
            NEW
          </div>
        </div>
      )}

      {/* Кнопки сохранения/отмены убраны - автосохранение при изменении */}

      <CardContent className="space-y-4">
        {/* Название и страны - над изображением */}
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            {editMode && editingField === 'title' ? (
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Brand Name"
                  className="font-semibold text-lg h-8 flex-1"
                  defaultValue={offer.title}
                  autoFocus
                  onBlur={(e) => handleFieldSave('title', e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleFieldSave('title', e.currentTarget.value)
                    } else if (e.key === 'Escape') {
                      handleFieldCancel()
                    }
                  }}
                />
              </div>
            ) : (
              <h3 
                className={`font-semibold text-lg truncate ${editMode ? 'cursor-pointer hover:bg-gray-100 px-2 py-1 rounded' : ''}`}
                onClick={() => editMode && setEditingField('title')}
                title={editMode ? 'Click to edit' : ''}
              >
                {offer.title}
              </h3>
            )}
          </div>
          
          <div className="flex flex-wrap gap-1 ml-3">
            <CustomTooltip 
              content={editMode ? 'Click to edit countries' : selectedGeo.join(', ')}
              disabled={selectedGeo.length <= 1 && !editMode}
            >
              <div 
                className={`flex items-center gap-1 ${editMode ? 'cursor-pointer hover:bg-gray-100 px-2 py-1 rounded' : ''}`}
                onClick={(e) => {
                  if (editMode) {
                    const rect = e.currentTarget.getBoundingClientRect()
                    setModalPosition({
                      x: rect.left + rect.width / 2,
                      y: rect.top + rect.height / 2
                    })
                    setShowGeoModal(true)
                  }
                }}
              >
                {selectedGeo.length > 0 ? (
                  <>
                    <Badge variant="outline" className="text-xs">
                      {selectedGeo[0]}
                    </Badge>
                    {selectedGeo.length > 1 && (
                      <Badge variant="outline" className="text-xs">
                        +{selectedGeo.length - 1}
                      </Badge>
                    )}
                  </>
                ) : editMode ? (
                  <Badge variant="outline" className="text-xs text-gray-400">
                    Add Countries
                  </Badge>
                ) : null}
              </div>
            </CustomTooltip>
          </div>
        </div>

        {/* Изображение */}
        <div className="aspect-square relative bg-gray-100 rounded-lg overflow-hidden">
          {/* Основное изображение - всегда показываем */}
          {(form.watch('imageUrl') || offer.imageUrl) ? (
            <Image
              key={`${offer.id}-${imageKey}`}
              src={form.watch('imageUrl') || offer.imageUrl}
              alt={offer.title}
              fill
              className="object-contain"
              unoptimized={(form.watch('imageUrl') || offer.imageUrl).startsWith('https://cdn.example.com') || (form.watch('imageUrl') || offer.imageUrl).startsWith('https://example.com')}
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <div className="text-2xl mb-1">📦</div>
                <div className="text-xs">No Image</div>
              </div>
            </div>
          )}
          
          {/* Оверлеи поверх изображения */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Тип оффера - слева вверху */}
            <div className="absolute top-2 left-2">
              <Badge 
                className={`bg-blue-500/80 text-white text-xs px-2 py-1 ${editMode ? 'cursor-pointer hover:bg-blue-600/80 pointer-events-auto' : ''}`}
                onClick={(e) => {
                  if (editMode) {
                    console.log('Клик по типу оффера') // Для отладки
                    const rect = e.currentTarget.getBoundingClientRect()
                    setOfferTypeModalPosition({
                      x: rect.left + rect.width / 2,
                      y: rect.top + rect.height / 2
                    })
                    setShowOfferTypeModal(true)
                  }
                }}
                title={editMode ? 'Click to select type' : ''}
              >
                {selectedOfferTypes[0] || 'Not Set'}
              </Badge>
            </div>
            
                {/* Статус - справа вверху */}
                <div className="absolute top-2 right-2">
                  {editMode ? (
                    <button
                      type="button"
                      className={`${getStatusColor(offer.status)} text-xs px-2 py-1 rounded cursor-pointer hover:opacity-80 transition-opacity pointer-events-auto`}
                      onClick={() => {
                        const statusCycle: OfferStatus[] = ['ACTIVE', 'PAUSED', 'ARCHIVED']
                        const currentIndex = statusCycle.indexOf(offer.status)
                        const nextStatus = statusCycle[(currentIndex + 1) % statusCycle.length]
                        handleFieldChange('status', nextStatus)
                      }}
                      title="Click to change status"
                    >
                      {getStatusText(offer.status)}
                    </button>
                  ) : (
                    <Badge className={`${getStatusColor(offer.status)} text-xs px-2 py-1`}>
                      {getStatusText(offer.status)}
                    </Badge>
                  )}
                </div>
            
            {/* Вертикаль - слева внизу */}
            <div className="absolute bottom-2 left-2">
              <Badge 
                className={`bg-black/70 text-white text-xs px-2 py-1 ${editMode ? 'cursor-pointer hover:bg-black/90 pointer-events-auto' : ''}`}
                onClick={(e) => {
                  if (editMode) {
                    console.log('Клик по вертикали') // Для отладки
                    const rect = e.currentTarget.getBoundingClientRect()
                    setVerticalModalPosition({
                      x: rect.left + rect.width / 2,
                      y: rect.top + rect.height / 2
                    })
                    setShowVerticalModal(true)
                  }
                }}
                title={editMode ? 'Click to select vertical' : ''}
              >
                {offer.vertical || 'Not Set'}
              </Badge>
            </div>
            
            {/* Выплата - справа внизу */}
            <div className="absolute bottom-2 right-2">
                <div 
                  className={`bg-green-500/80 text-white rounded px-2 py-1 min-h-[20px] flex items-center ${editMode ? 'cursor-pointer hover:bg-green-600/80 pointer-events-auto' : ''}`}
                  onClick={(e) => {
                    if (editMode) {
                      setEditingField('priceUsd')
                    }
                  }}
                  title={editMode ? 'Click to edit price' : ''}
                >
                    {editMode && editingField === 'priceUsd' ? (
                      <Input
                        type="number"
                        min="0"
                        className="w-16 h-4 text-xs bg-transparent text-white border-0 p-0 pointer-events-auto [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield] font-bold"
                        defaultValue={offer.priceUsd}
                        autoFocus
                        onBlur={(e) => handleFieldSave('priceUsd', parseInt(e.target.value) || 0)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleFieldSave('priceUsd', parseInt(e.currentTarget.value) || 0)
                          } else if (e.key === 'Escape') {
                            handleFieldCancel()
                          }
                        }}
                      />
                    ) : (
                      <span className="text-xs font-bold">{offer.priceUsd}$</span>
                    )}
                </div>
            </div>
          </div>
          
          {/* Кнопка изменения фото */}
          {editMode && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <Button
                variant="secondary"
                size="sm"
                className="h-8 text-xs bg-white/90 hover:bg-white pointer-events-auto"
                onClick={handleImageClick}
                disabled={uploadImageMutation.isPending}
              >
                <Camera className="w-3 h-3 mr-1" />
                {uploadImageMutation.isPending ? 'Uploading...' : 'Change Photo'}
              </Button>
            </div>
          )}
        </div>

        {/* Информация под изображением убрана - все перенесено наверх */}

        {/* Лендинги */}
        <LandingsList
          landings={landings}
          prelandings={prelandings}
          offerId={offer.id}
          editMode={editMode}
          onUpdate={onUpdate}
          onOpenBulkDialog={() => setShowBulkLandingDialog(true)}
        />
      </CardContent>

      {/* Модальное окно для выбора стран */}
      <GeoSelectionModal
        open={showGeoModal}
        onOpenChange={setShowGeoModal}
        selectedGeo={selectedGeo}
        onSelectionChange={handleGeoSelectionChange}
        position={modalPosition}
      />

      {/* Модальное окно для выбора типа оффера */}
      <OfferTypeSelectionModal
        open={showOfferTypeModal}
        onOpenChange={setShowOfferTypeModal}
        selectedType={selectedOfferTypes[0] || null}
        onSelectionChange={handleOfferTypeSelectionChange}
        position={offerTypeModalPosition}
      />

      {/* Модальное окно для выбора вертикали */}
      <VerticalSelectionModal
        open={showVerticalModal}
        onOpenChange={setShowVerticalModal}
        selectedVertical={offer.vertical}
        onSelectionChange={handleVerticalSelectionChange}
        position={verticalModalPosition}
      />

      {/* Диалог массового добавления лендингов */}
      <BulkLandingDialog
        offerId={offer.id}
        existingLandings={landings}
        existingPrelandings={prelandings}
        open={showBulkLandingDialog}
        onOpenChange={setShowBulkLandingDialog}
        onSuccess={onUpdate}
      />

      {/* Скрытый input для выбора файлов */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </Card>
  )
}
