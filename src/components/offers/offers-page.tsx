'use client'

import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { SortableOffersGrid } from './sortable-offers-grid'
import { OffersToolbar } from './offers-toolbar'
import { LogOut, Plus, Settings, Globe } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import type { OffersFilter } from '@/types'
import { ReferencesModal } from '@/components/references/references-modal'
import { DomainsModal } from '@/components/domains/domains-modal'

export function OffersPage() {
  const { data: session, status } = useSession()
  const [editMode, setEditMode] = useState(false)
  const [showReferences, setShowReferences] = useState(false)
  const [showDomains, setShowDomains] = useState(false)
  const [filters, setFilters] = useState<OffersFilter>({})
  const queryClient = useQueryClient()

  const { data: offersData, isLoading } = useQuery({
    queryKey: ['offers', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          params.append(key, value.toString())
        }
      })
      
      const response = await fetch(`/api/offers?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch offers')
      }
      return response.json()
    },
  })

  const createOfferMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}), // Создаем пустую карточку
      })

      if (!response.ok) {
        throw new Error('Failed to create offer')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offers'] })
      toast.success('Оффер создан успешно')
    },
    onError: (error) => {
      console.error('Error creating offer:', error)
      toast.error('Ошибка при создании оффера')
    },
  })

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Загрузка...</div>
      </div>
    )
  }

  if (!session) {
    return null // Middleware должен перенаправить на страницу входа
  }

  const isAdmin = session.user.role === 'ADMIN'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Заголовок */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Offer Management Panel
              </h1>
              <p className="text-sm text-gray-600">
                Welcome, {session.user.name} ({session.user.role})
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {isAdmin && editMode && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setShowReferences(true)}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    References
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => setShowDomains(true)}
                  >
                    <Globe className="w-4 h-4 mr-2" />
                    Domains
                  </Button>

                  <Button
                    onClick={() => createOfferMutation.mutate()}
                    disabled={createOfferMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {createOfferMutation.isPending ? 'Creating...' : 'Add Offer'}
                  </Button>
                </>
              )}
              
              {isAdmin && (
                <div className="flex items-center space-x-2">
                  <Switch
                    id="edit-mode"
                    checked={editMode}
                    onCheckedChange={setEditMode}
                  />
                  <Label htmlFor="edit-mode">Edit mode</Label>
                </div>
              )}

              {!isAdmin && (
                <Link href="/domains">
                  <Button variant="outline">
                    <Globe className="w-4 h-4 mr-2" />
                    My Domains
                  </Button>
                </Link>
              )}
              
              <Button
                variant="outline"
                onClick={() => signOut()}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Основной контент */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Панель фильтров */}
        <OffersToolbar
          filters={filters}
          onFiltersChange={setFilters}
          showFilters={true}
        />

        {/* Сетка офферов */}
        <div className="mt-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-lg border p-6 animate-pulse"
                >
                  <div className="h-48 bg-gray-200 rounded mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <SortableOffersGrid
              offers={offersData?.offers || []}
              editMode={isAdmin && editMode}
              onOfferUpdate={() => {
                // Refetch offers after update
              }}
            />
          )}
        </div>
      </main>

      {/* Диалоги */}
      {isAdmin && (
        <>
          <ReferencesModal
            open={showReferences}
            onOpenChange={setShowReferences}
          />
          <DomainsModal
            open={showDomains}
            onOpenChange={setShowDomains}
          />
        </>
      )}
    </div>
  )
}
