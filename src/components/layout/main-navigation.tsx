'use client'

import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LogOut, Plus, Settings, Globe, Users, User } from 'lucide-react'
import { ReferencesModal } from '@/components/references/references-modal'

interface MainNavigationProps {
  activeTab: 'offers' | 'domains' | 'users' | 'profile'
  onTabChange: (tab: 'offers' | 'domains' | 'users' | 'profile') => void
  editMode: boolean
  onEditModeChange: (editMode: boolean) => void
  onCreateOffer?: () => void
  createOfferLoading?: boolean
}

export function MainNavigation({
  activeTab,
  onTabChange,
  editMode,
  onEditModeChange,
  onCreateOffer,
  createOfferLoading = false
}: MainNavigationProps) {
  const { data: session } = useSession()
  const [showReferences, setShowReferences] = useState(false)

  const isAdmin = session?.user?.role === 'ADMIN'

  return (
    <>
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Tab Navigation */}
            <div>
              <Tabs value={activeTab} onValueChange={onTabChange}>
                <TabsList className="grid w-full max-w-lg grid-cols-3 h-auto">
                  <TabsTrigger value="offers" className="flex items-center gap-2 py-2">
                    <Settings className="w-4 h-4" />
                    Offers
                  </TabsTrigger>
                  <TabsTrigger value="domains" className="flex items-center gap-2 py-2">
                    <Globe className="w-4 h-4" />
                    Domains
                  </TabsTrigger>
                  {isAdmin ? (
                    <TabsTrigger value="users" className="flex items-center gap-2 py-2">
                      <Users className="w-4 h-4" />
                      Users
                    </TabsTrigger>
                  ) : (
                    <TabsTrigger value="profile" className="flex items-center gap-2 py-2">
                      <User className="w-4 h-4" />
                      Profile
                    </TabsTrigger>
                  )}
                </TabsList>
              </Tabs>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Admin Actions in Edit Mode */}
              {isAdmin && editMode && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setShowReferences(true)}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    References
                  </Button>

                  {activeTab === 'offers' && onCreateOffer && (
                    <Button
                      onClick={onCreateOffer}
                      disabled={createOfferLoading}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {createOfferLoading ? 'Creating...' : 'Add Offer'}
                    </Button>
                  )}
                </>
              )}
              
              {/* Edit Mode Toggle for Admins - только для вкладки Offers */}
              {isAdmin && activeTab === 'offers' && (
                <div className="flex items-center space-x-2">
                  <Switch
                    id="edit-mode"
                    checked={editMode}
                    onCheckedChange={onEditModeChange}
                  />
                  <Label htmlFor="edit-mode">Edit mode</Label>
                </div>
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

      {/* References Modal */}
      {isAdmin && (
        <ReferencesModal
          open={showReferences}
          onOpenChange={setShowReferences}
        />
      )}
    </>
  )
}
