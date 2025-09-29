'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Trash2, Globe, Clock, CheckCircle, XCircle, User, List, Archive, StickyNote, Cloud, DollarSign } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { CloudflareSetup } from './cloudflare-setup'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

// Schema для массового добавления доменов
const bulkDomainsSchema = z.object({
  domains: z.string().min(1, 'Please enter at least one domain'),
  cost: z.string().optional().transform((val) => {
    if (!val || val.trim() === '') return null
    const num = parseFloat(val)
    return isNaN(num) ? null : num
  })
})

type BulkDomainsFormData = z.infer<typeof bulkDomainsSchema>

interface AdminDomainsViewProps {
  editMode: boolean
}

interface Domain {
  id: string
  domain: string
  isAssigned: boolean
  assignedTo: string | null
  assignedAt: string | null
  createdAt: string
  isArchived: boolean
  archivedAt: string | null
  note: string | null
  cost?: number | null
  user?: {
    id: string
    displayName: string
    email: string
  } | null
}

interface DomainRequest {
  id: string
  userId: string
  domainId: string | null
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  comment: string | null
  createdAt: string
  user: {
    id: string
    displayName: string
    email: string
  }
  domain?: Domain | null
}

export function AdminDomainsView({ editMode }: AdminDomainsViewProps) {
  const [activeTab, setActiveTab] = useState('available')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingCost, setEditingCost] = useState<string | null>(null)
  const [costValue, setCostValue] = useState('')
  // Убираем режим single - только bulk добавление
  const queryClient = useQueryClient()

  // Fetch domains
  const { data: domains = [], isLoading: loadingDomains } = useQuery({
    queryKey: ['admin', 'domains'],
    queryFn: async () => {
      const response = await fetch('/api/admin/domains', {
        credentials: 'include',
      })
      if (!response.ok) {
        throw new Error('Failed to fetch domains')
      }
      const data = await response.json()
      console.log('Domains data:', data.slice(0, 2)) // Debug: показать первые 2 домена
      return data
    }
  })

  // Fetch domain requests
  const { data: requests = [], isLoading: loadingRequests } = useQuery({
    queryKey: ['admin', 'domain-requests'],
    queryFn: async () => {
      const response = await fetch('/api/admin/domain-requests', {
        credentials: 'include',
      })
      if (!response.ok) {
        throw new Error('Failed to fetch domain requests')
      }
      return response.json()
    }
  })

  // Create bulk domains mutation
  const createBulkDomainsMutation = useMutation({
    mutationFn: async (data: BulkDomainsFormData) => {
      // Parse domains from textarea (split by newlines and filter empty)
      const domainList = data.domains
        .split('\n')
        .map(domain => domain.trim())
        .filter(domain => domain.length > 0)

      const response = await fetch('/api/admin/domains/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          domains: domainList,
          cost: data.cost 
        }),
        credentials: 'include',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create domains')
      }

      return response.json()
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'domains'] })
      toast.success(result.message)
      bulkDomainsForm.reset()
      setShowAddModal(false)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  // Delete domain mutation
  const deleteDomainMutation = useMutation({
    mutationFn: async (domainId: string) => {
      const response = await fetch(`/api/admin/domains/${domainId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete domain')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'domains'] })
      toast.success('Domain deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  // Убираем систему одобрения - домены назначаются автоматически

  const bulkDomainsForm = useForm<BulkDomainsFormData>({
    resolver: zodResolver(bulkDomainsSchema),
    defaultValues: {
      domains: '',
      cost: undefined,
    },
  })

  const onBulkSubmit = (data: BulkDomainsFormData) => {
    createBulkDomainsMutation.mutate(data)
  }

  const handleDeleteDomain = (domainId: string) => {
    if (window.confirm('Are you sure you want to delete this domain?')) {
      deleteDomainMutation.mutate(domainId)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
      case 'APPROVED':
        return <Badge variant="outline" className="text-green-600 border-green-600"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>
      case 'REJECTED':
        return <Badge variant="outline" className="text-red-600 border-red-600"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Update domain cost mutation
  const updateCostMutation = useMutation({
    mutationFn: async ({ domainId, cost }: { domainId: string; cost: number | null }) => {
      const response = await fetch(`/api/admin/domains/${domainId}/cost`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cost }),
        credentials: 'include',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update cost')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'domains'] })
      toast.success('Domain cost updated successfully')
      setEditingCost(null)
      setCostValue('')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const handleEditCost = (domainId: string, currentCost: number | null) => {
    setEditingCost(domainId)
    setCostValue(currentCost?.toString() || '')
  }

  const handleSaveCost = (domainId: string) => {
    const cost = costValue.trim() === '' ? null : parseFloat(costValue)
    if (cost !== null && (isNaN(cost) || cost < 0)) {
      toast.error('Please enter a valid cost')
      return
    }
    updateCostMutation.mutate({ domainId, cost })
  }

  const handleCancelCost = () => {
    setEditingCost(null)
    setCostValue('')
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList className="grid w-full max-w-2xl grid-cols-3 h-auto">
            <TabsTrigger value="available" className="text-sm">
              Available ({domains.filter((d: Domain) => !d.isAssigned).length})
            </TabsTrigger>
            <TabsTrigger value="assigned" className="text-sm">
              Assigned ({domains.filter((d: Domain) => d.isAssigned && !d.isArchived).length})
            </TabsTrigger>
            <TabsTrigger value="archive" className="text-sm">
              Archive ({domains.filter((d: Domain) => d.isArchived).length})
            </TabsTrigger>
          </TabsList>
          
          {/* Cloudflare Setup Button */}
          {editMode && (
            <Button
              variant="outline"
              onClick={() => setActiveTab('cloudflare')}
              className={`flex items-center gap-2 ${
                activeTab === 'cloudflare' ? 'bg-primary text-primary-foreground' : ''
              }`}
            >
              <Cloud className="w-4 h-4" />
              Cloudflare Setup
            </Button>
          )}
        </div>

        <TabsContent value="available">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Available Domains ({domains.filter((d: Domain) => !d.isAssigned).length})</CardTitle>
                {editMode && (
                  <Button onClick={() => setShowAddModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Domains
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loadingDomains ? (
                <div className="text-center py-4">Loading available domains...</div>
              ) : domains.filter((d: Domain) => !d.isAssigned).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Globe className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No available domains.</p>
                  <p className="text-sm">{editMode ? 'Add some domains above.' : 'Contact admin to add domains.'}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {domains.filter((d: Domain) => !d.isAssigned).map((domain: Domain) => (
                    <div key={domain.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Globe className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">{domain.domain}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 px-2 py-1 bg-green-50 rounded text-xs text-green-700">
                          <DollarSign className="w-3 h-3" />
                          <span>{domain.cost ? parseFloat(domain.cost.toString()).toFixed(2) : '0.00'}</span>
                        </div>
                        <span className="text-xs text-gray-500">
                          Added {new Date(domain.createdAt).toLocaleDateString()}
                        </span>
                        {editMode && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteDomain(domain.id)}
                            disabled={deleteDomainMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assigned">
          <Card>
            <CardHeader>
              <CardTitle>Assigned Domains ({domains.filter((d: Domain) => d.isAssigned && !d.isArchived).length})</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingDomains ? (
                <div className="text-center py-4">Loading assigned domains...</div>
              ) : domains.filter((d: Domain) => d.isAssigned && !d.isArchived).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <User className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No assigned domains yet.</p>
                  <p className="text-sm">Domains will appear here when users request them.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {domains
                    .filter((d: Domain) => d.isAssigned && !d.isArchived)
                    .sort((a, b) => {
                      // Сортируем по assigned_at от новых к старым (desc)
                      if (!a.assignedAt && !b.assignedAt) return 0
                      if (!a.assignedAt) return 1
                      if (!b.assignedAt) return -1
                      return new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime()
                    })
                    .map((domain: Domain) => (
                    <div key={domain.id} className="p-4 border rounded-lg bg-green-50 border-green-200">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <Globe className="w-5 h-5 text-green-600 flex-shrink-0" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-lg">{domain.domain}</span>
                            </div>
                            {domain.user && (
                              <div className="flex items-center gap-2 mb-1">
                                <User className="w-3 h-3 text-gray-500" />
                                <span className="text-sm text-gray-600">{domain.user.displayName}</span>
                                <span className="text-xs text-gray-500">({domain.user.email})</span>
                              </div>
                            )}
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <div className="flex items-center gap-1 px-2 py-1 bg-green-100 rounded text-xs text-green-800">
                                <DollarSign className="w-3 h-3" />
                                <span>{domain.cost ? parseFloat(domain.cost.toString()).toFixed(2) : '0.00'}</span>
                              </div>
                              <span>Added: {new Date(domain.createdAt).toLocaleDateString()}</span>
                              <span>Assigned: {new Date(domain.assignedAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        
                        {editMode && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteDomain(domain.id)}
                            disabled={deleteDomainMutation.isPending}
                            className="flex-shrink-0"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="archive">
          <Card>
            <CardHeader>
              <CardTitle>Archived Domains ({domains.filter((d: Domain) => d.isArchived).length})</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingDomains ? (
                <div className="text-center py-4">Loading archived domains...</div>
              ) : domains.filter((d: Domain) => d.isArchived).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Archive className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No archived domains yet.</p>
                  <p className="text-sm">Domains archived by users will appear here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {domains.filter((d: Domain) => d.isArchived).map((domain: Domain) => (
                    <div key={domain.id} className="p-4 border rounded-lg bg-gray-50">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <Archive className="w-4 h-4 text-gray-500 flex-shrink-0" />
                          <div className="min-w-0">
                           <div className="flex items-center gap-2 mb-1">
                             <span className="font-medium text-gray-700">{domain.domain}</span>
                           </div>
                            {domain.user && (
                              <div className="flex items-center gap-2 mb-1">
                                <User className="w-3 h-3 text-gray-500" />
                                <span className="text-sm text-gray-600">{domain.user.displayName}</span>
                                <span className="text-xs text-gray-500">({domain.user.email})</span>
                              </div>
                            )}
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">
                                <DollarSign className="w-3 h-3" />
                                <span>{domain.cost ? parseFloat(domain.cost.toString()).toFixed(2) : '0.00'}</span>
                              </div>
                              <span>Assigned: {new Date(domain.assignedAt).toLocaleDateString()}</span>
                              {domain.archivedAt && (
                                <span>Archived: {new Date(domain.archivedAt).toLocaleDateString()}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* User's note */}
                        <div className="flex-1 max-w-md mx-4">
                          {domain.note ? (
                            <div className="p-2 rounded bg-white border min-h-[2.5rem] flex items-start">
                              <StickyNote className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <p className="text-xs text-gray-500 mb-1">User's note:</p>
                                <p className="text-sm text-gray-600 whitespace-pre-wrap">{domain.note}</p>
                              </div>
                            </div>
                          ) : (
                            <div className="p-2 rounded border border-transparent min-h-[2.5rem] flex items-center">
                              <StickyNote className="w-4 h-4 text-gray-300 mr-2 flex-shrink-0" />
                              <p className="text-sm text-gray-400 italic">No note</p>
                            </div>
                          )}
                        </div>
                        
                        {editMode && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteDomain(domain.id)}
                            disabled={deleteDomainMutation.isPending}
                            className="flex-shrink-0"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cloudflare">
          <CloudflareSetup editMode={editMode} />
        </TabsContent>
      </Tabs>

      {/* Add Domains Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Domains</DialogTitle>
          </DialogHeader>
          <Form {...bulkDomainsForm}>
            <form onSubmit={bulkDomainsForm.handleSubmit(onBulkSubmit)} className="space-y-4">
              <FormField
                control={bulkDomainsForm.control}
                name="domains"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Domains (one per line)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder={`example1.com\nexample2.com\nexample3.com`}
                        className="resize-none min-h-[200px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={bulkDomainsForm.control}
                name="cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Domain Cost (USD)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        step="0.01"
                        min="0"
                        max="999999.99"
                        placeholder="2.50"
                        value={field.value || ''}
                        onChange={field.onChange}
                        name={field.name}
                        onBlur={field.onBlur}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createBulkDomainsMutation.isPending}
                >
                  <List className="w-4 h-4 mr-2" />
                  {createBulkDomainsMutation.isPending ? 'Adding...' : 'Add Domains'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
