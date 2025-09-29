'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { LandingsList } from './landings-list'
import { EditOfferDialog } from './edit-offer-dialog'
import { 
  Edit, 
  MoreVertical, 
  Play, 
  Pause, 
  Copy, 
  Trash2, 
  DollarSign,
  Globe
} from 'lucide-react'
import type { OfferWithLandings } from '@/types'
import { OfferStatus } from '@prisma/client'

interface OfferCardProps {
  offer: OfferWithLandings
  editMode: boolean
  onUpdate: () => void
}

export function OfferCard({ offer, editMode, onUpdate }: OfferCardProps) {
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  const getStatusColor = (status: OfferStatus) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800'
      case 'PAUSED':
        return 'bg-yellow-100 text-yellow-800'
      case 'ARCHIVED':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: OfferStatus) => {
    switch (status) {
      case 'ACTIVE':
        return 'Активный'
      case 'PAUSED':
        return 'Приостановлен'
      case 'ARCHIVED':
        return 'Архивный'
      default:
        return status
    }
  }

  const handleToggleStatus = async () => {
    setIsUpdating(true)
    try {
      const newStatus = offer.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE'
      
      const response = await fetch(`/api/offers/${offer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error('Failed to update offer status')
      }

      onUpdate()
    } catch (error) {
      console.error('Error updating offer status:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDuplicate = async () => {
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/offers/${offer.id}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Ошибка API при дублировании:', errorData)
        throw new Error('Failed to duplicate offer')
      }

      const result = await response.json()
      console.log('Оффер дублирован с лендингами:', result.landings?.length || 0)

      onUpdate()
    } catch (error) {
      console.error('Ошибка при дублировании:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Вы уверены, что хотите удалить этот оффер?')) {
      return
    }

    setIsUpdating(true)
    try {
      const response = await fetch(`/api/offers/${offer.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete offer')
      }

      onUpdate()
    } catch (error) {
      console.error('Error deleting offer:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const landings = offer.landings.filter(l => l.type === 'LANDING')
  const prelandings = offer.landings.filter(l => l.type === 'PRELANDING')

  return (
    <>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div className="flex flex-wrap gap-1">
              {offer.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
            
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(offer.status)}>
                {getStatusText(offer.status)}
              </Badge>
              
              {editMode && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Редактировать
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleToggleStatus} disabled={isUpdating}>
                      {offer.status === 'ACTIVE' ? (
                        <><Pause className="mr-2 h-4 w-4" />Приостановить</>
                      ) : (
                        <><Play className="mr-2 h-4 w-4" />Активировать</>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDuplicate} disabled={isUpdating}>
                      <Copy className="mr-2 h-4 w-4" />
                      Дублировать
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={handleDelete} 
                      disabled={isUpdating}
                      className="text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Удалить
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Изображение */}
          <div className="aspect-square relative bg-gray-100 rounded-lg overflow-hidden">
            {offer.imageUrl ? (
              <Image
                src={offer.imageUrl}
                alt={offer.title}
                fill
                className="object-cover"
                unoptimized={offer.imageUrl.startsWith('https://cdn.example.com') || offer.imageUrl.startsWith('https://example.com')}
                onError={(e) => {
                  // Fallback при ошибке загрузки изображения
                  e.currentTarget.style.display = 'none'
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  <div className="text-2xl mb-1">📦</div>
                  <div className="text-xs">Нет изображения</div>
                </div>
              </div>
            )}
          </div>

          {/* Информация */}
          <div className="space-y-2">
            <div className="text-sm text-gray-600">{offer.vertical}</div>
            <h3 className="font-semibold text-lg">{offer.title}</h3>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-green-600 font-semibold">
                <DollarSign className="w-4 h-4" />
                {offer.priceUsd}
              </div>
              
              <div className="flex flex-wrap gap-1">
                {offer.geo.slice(0, 3).map((geo) => (
                  <Badge key={geo} variant="outline" className="text-xs">
                    {geo}
                  </Badge>
                ))}
                {offer.geo.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{offer.geo.length - 3}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Лендинги */}
          <LandingsList
            landings={landings}
            prelandings={prelandings}
            offerId={offer.id}
            editMode={editMode}
            onUpdate={onUpdate}
          />
        </CardContent>
      </Card>

      {editMode && (
        <EditOfferDialog
          offer={offer}
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          onUpdate={onUpdate}
        />
      )}
    </>
  )
}
