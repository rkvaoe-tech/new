'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { redirect } from 'next/navigation'
import { MainNavigation } from '@/components/layout/main-navigation'
import { OffersPageContent } from '@/components/offers/offers-page-content'
import { DomainsPageContent } from '@/components/domains/domains-page-content'
import UsersPage from '@/app/users/page'
import ProfilePage from '@/app/profile/page'
import { toast } from 'sonner'

export function MainPage() {
  const { data: session, status } = useSession()
  const [activeTab, setActiveTab] = useState<'offers' | 'domains' | 'users' | 'profile'>('offers')
  const [editMode, setEditMode] = useState(false)
  const queryClient = useQueryClient()

  // Create offer mutation - должен быть до всех условных return'ов
  const createOfferMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vertical: 'Male Enhancement',
          title: 'New Offer',
          priceUsd: 44,
          geo: ['US'],
          tags: ['Trial'],
          status: 'ACTIVE',
          imageUrl: '',
        }),
        credentials: 'include',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create offer')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offers'] })
      toast.success('Offer created successfully')
    },
    onError: (error: Error) => {
      console.error('Error creating offer:', error)
      toast.error(error.message)
    },
  })

  // Условные return'ы после всех хуков
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    redirect('/auth/signin')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <MainNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        editMode={editMode}
        onEditModeChange={setEditMode}
        onCreateOffer={() => createOfferMutation.mutate()}
        createOfferLoading={createOfferMutation.isPending}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'offers' && (
          <OffersPageContent editMode={editMode} />
        )}
        {activeTab === 'domains' && (
          <DomainsPageContent editMode={editMode} />
        )}
        {activeTab === 'users' && session?.user?.role === 'ADMIN' && (
          <UsersPage />
        )}
        {activeTab === 'profile' && session?.user?.role !== 'ADMIN' && (
          <ProfilePage />
        )}
      </main>
    </div>
  )
}
