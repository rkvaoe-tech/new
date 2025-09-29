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
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Globe, Clock, CheckCircle, XCircle, Plus, Copy, Archive, ArchiveRestore, StickyNote, Trash2, AlertCircle, DollarSign } from 'lucide-react'
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

// Schemas
const requestSchema = z.object({
  // Комментарий убран - домены назначаются автоматически
})

type RequestFormData = z.infer<typeof requestSchema>

interface Domain {
  id: string
  domain: string
  assignedAt: string
  isArchived: boolean
  archivedAt: string | null
  note: string | null
  cost?: number | string | null
}

interface DomainRequest {
  id: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  comment: string | null
  createdAt: string
  domain?: Domain | null
}

export function UserDomainsView() {
  const [activeTab, setActiveTab] = useState('active')
  const [editingNote, setEditingNote] = useState<string | null>(null)
  const [noteText, setNoteText] = useState('')
  const queryClient = useQueryClient()

  // Fetch user's assigned domains
  const { data: domains = [], isLoading: loadingDomains } = useQuery({
    queryKey: ['my-domains'],
    queryFn: async () => {
      const response = await fetch('/api/my-domains', {
        credentials: 'include',
      })
      if (!response.ok) {
        throw new Error('Failed to fetch domains')
      }
      return response.json()
    }
  })

  // Fetch user's domain requests
  const { data: requests = [], isLoading: loadingRequests } = useQuery({
    queryKey: ['domain-requests'],
    queryFn: async () => {
      const response = await fetch('/api/domain-requests', {
        credentials: 'include',
      })
      if (!response.ok) {
        throw new Error('Failed to fetch requests')
      }
      return response.json()
    }
  })

  // Create request mutation
  const createRequestMutation = useMutation({
    mutationFn: async (data: RequestFormData) => {
      const response = await fetch('/api/domain-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create request')
      }

      return response.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['domain-requests'] })
      queryClient.invalidateQueries({ queryKey: ['my-domains'] })
      
      // First notification - main action with domain name
      const domainName = data.assignedDomain?.domain || 'Domain'
      toast.success(`${domainName} assigned successfully!`)
      
      // Second notification - domain cost (with delay)
      if (data.assignedDomain?.cost) {
        const cost = Number(data.assignedDomain.cost).toFixed(2)
        setTimeout(() => {
          toast.success(`💰 Domain cost: $${cost}`)
        }, 600)
      }
      
      // Third notification - Binom integration status (with delay)
      if (data.binomIntegration) {
        setTimeout(() => {
          switch (data.binomIntegration) {
            case 'success':
              toast.success('Domain added to Binom tracker')
              break
            case 'error':
              toast.error('Failed to add domain to Binom tracker')
              break
            case 'not_configured':
              toast.info('Binom integration not configured')
              break
            default:
              break
          }
        }, 1200) // 1200ms delay for third notification
      }
      
      // Fourth notification - Google Sheets status (with delay)
      setTimeout(() => {
        if (data.sheetsIntegration === 'success') {
          toast.success('Cost logged to your Google Sheets')
        } else if (data.sheetsIntegration === 'error') {
          toast.warning('Failed to log cost to Google Sheets')
        }
      }, 1800) // 1800ms delay for fourth notification
      
      form.reset()
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const form = useForm<RequestFormData>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      // Больше нет полей для инициализации
    },
  })

  const onSubmit = (data: RequestFormData) => {
    // Отправляем пустой объект, так как комментарий больше не нужен
    createRequestMutation.mutate({})
  }

  // Archive/unarchive domain mutation
  const archiveMutation = useMutation({
    mutationFn: async ({ domainId, isArchived }: { domainId: string; isArchived: boolean }) => {
      const response = await fetch(`/api/domains/${domainId}/archive`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isArchived }),
        credentials: 'include',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update domain')
      }

      return response.json()
    },
    onSuccess: (data, { isArchived }) => {
      queryClient.invalidateQueries({ queryKey: ['my-domains'] })
      
      // First notification - main action
      let mainMessage = isArchived ? 'Domain archived' : 'Domain restored'
      toast.success(mainMessage)
      
      // Second notification - Binom integration status (with delay)
      if (data.binomIntegration) {
        setTimeout(() => {
          if (isArchived) {
            switch (data.binomIntegration) {
              case 'deleted':
                toast.success('✅ Domain deleted from Binom tracker')
                break
              case 'delete_error':
                toast.error('⚠️ Failed to delete domain from Binom tracker')
                break
              case 'disabled':
                toast.info('ℹ️ Binom integration not configured')
                break
              default:
                break
            }
          } else {
            // Restoring domain
            switch (data.binomIntegration) {
              case 'restored':
                toast.success('✅ Domain re-added to Binom tracker')
                break
              case 'restore_error':
                toast.error('⚠️ Failed to re-add domain to Binom tracker')
                break
              case 'restored_no_binom':
                toast.info('ℹ️ Binom integration not configured')
                break
              default:
                break
            }
          }
        }, 800) // 800ms delay for second notification
      }
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  // Update domain note mutation
  const updateNoteMutation = useMutation({
    mutationFn: async ({ domainId, note }: { domainId: string; note: string }) => {
      const response = await fetch(`/api/domains/${domainId}/note`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: note.trim() || null }),
        credentials: 'include',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update note')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-domains'] })
      toast.success('Note updated')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  // Delete domain mutation
  const deleteDomainMutation = useMutation({
    mutationFn: async (domainId: string) => {
      const response = await fetch(`/api/domains/${domainId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete domain')
      }

      return response.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['my-domains'] })
      
      let message = 'Domain deleted successfully'
      
      // Don't show Binom messages for archived domain deletion - they were already handled during archiving
      // if (data.binomIntegration) {
      //   // Archived domains were already removed from Binom during archiving
      // }
      
      toast.success(message)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Domain copied to clipboard')
  }

  const handleEditNote = (domainId: string, currentNote: string | null) => {
    setEditingNote(domainId)
    setNoteText(currentNote || '')
  }

  const handleSaveNote = (domainId: string) => {
    updateNoteMutation.mutate({ domainId, note: noteText })
    setEditingNote(null)
    setNoteText('')
  }

  const handleCancelNote = () => {
    setEditingNote(null)
    setNoteText('')
  }

  const handleBlurNote = (domainId: string) => {
    // Автосохранение при потере фокуса
    handleSaveNote(domainId)
  }

  const hasPendingRequest = requests.some((request: DomainRequest) => request.status === 'PENDING')
  
  // Разделяем домены на активные и архивные
  const activeDomains = domains.filter((domain: Domain) => !domain.isArchived)
  const archivedDomains = domains.filter((domain: Domain) => domain.isArchived)
  
  // Проверяем лимит активных доменов (максимум 10)
  const DOMAIN_LIMIT = 10
  const hasReachedLimit = activeDomains.length >= DOMAIN_LIMIT
  const canRequestDomain = !hasPendingRequest && !hasReachedLimit

  return (
    <div className="space-y-6">
      {/* Assigned Domains */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              My Domains ({activeDomains.length}/{DOMAIN_LIMIT})
              {hasReachedLimit && (
                <Badge variant="destructive" className="text-xs">
                  Limit Reached
                </Badge>
              )}
            </CardTitle>
            {canRequestDomain && (
              <Button 
                onClick={() => form.handleSubmit(onSubmit)()}
                disabled={createRequestMutation.isPending}
              >
                <Plus className="w-4 h-4 mr-2" />
                {createRequestMutation.isPending ? 'Getting...' : 'Get Domain'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {hasReachedLimit && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-800">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">
                  Domain limit reached ({activeDomains.length}/{DOMAIN_LIMIT})
                </span>
              </div>
              <p className="text-xs text-yellow-700 mt-1">
                You have reached the maximum limit of {DOMAIN_LIMIT} active domains. 
                Please archive some domains to request new ones.
              </p>
            </div>
          )}
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="active">Active ({activeDomains.length})</TabsTrigger>
              <TabsTrigger value="archive">Archive ({archivedDomains.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="active">
              {loadingDomains ? (
                <div className="text-center py-4">Loading domains...</div>
              ) : activeDomains.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Globe className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No active domains yet.</p>
                  <p className="text-sm">Get your first domain using the button above.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeDomains.map((domain: Domain) => (
                    <div key={domain.id} className="p-4 border rounded-lg bg-green-50 border-green-200">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <Globe className="w-5 h-5 text-green-600 flex-shrink-0" />
                          <div className="min-w-0">
                            <span className="font-medium text-lg">{domain.domain}</span>
                            <p className="text-sm text-gray-600">
                              Assigned: {new Date(domain.assignedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        
                        {/* Note section - справа от домена */}
                        <div className="flex-1 max-w-md mx-4">
                          {editingNote === domain.id ? (
                            <div className="relative">
                              <Textarea
                                value={noteText}
                                onChange={(e) => setNoteText(e.target.value)}
                                placeholder="Add a note for this domain..."
                                className="resize-none text-sm pr-12 min-h-[2.5rem] max-h-[2.5rem] h-[2.5rem]"
                                style={{ height: '2.5rem', minHeight: '2.5rem', maxHeight: '2.5rem' }}
                                rows={1}
                                maxLength={500}
                                autoFocus
                                onBlur={() => handleBlurNote(domain.id)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Escape') {
                                    handleCancelNote()
                                  } else if (e.key === 'Enter') {
                                    e.preventDefault() // Предотвращаем переход на новую строку
                                    handleSaveNote(domain.id)
                                  }
                                }}
                              />
                              <span className="absolute bottom-1 right-2 text-xs text-gray-400">
                                {noteText.length}/500
                              </span>
                            </div>
                          ) : (
                            <div
                              className="cursor-text p-2 rounded border border-transparent hover:border-gray-300 transition-colors min-h-[2.5rem] flex items-center"
                              onClick={() => handleEditNote(domain.id, domain.note)}
                            >
                              <StickyNote className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                              {domain.note ? (
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{domain.note}</p>
                              ) : (
                                <p className="text-sm text-gray-400 italic">Click to add note...</p>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {domain.cost && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-green-100 rounded text-xs text-green-800">
                              <DollarSign className="w-3 h-3" />
                              <span>{typeof domain.cost === 'string' ? parseFloat(domain.cost).toFixed(2) : domain.cost.toFixed(2)}</span>
                            </div>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(domain.domain)}
                          >
                            <Copy className="w-4 h-4 mr-1" />
                            Copy
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => archiveMutation.mutate({ domainId: domain.id, isArchived: true })}
                            disabled={archiveMutation.isPending}
                          >
                            <Archive className="w-4 h-4 mr-1" />
                            Archive
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="archive">
              {loadingDomains ? (
                <div className="text-center py-4">Loading archived domains...</div>
              ) : archivedDomains.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Archive className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No archived domains yet.</p>
                  <p className="text-sm">Domains you archive will appear here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {archivedDomains.map((domain: Domain) => (
                    <div key={domain.id} className="p-4 border rounded-lg bg-gray-50 border-gray-200">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <Archive className="w-5 h-5 text-gray-500 flex-shrink-0" />
                          <div className="min-w-0">
                            <span className="font-medium text-lg text-gray-700">{domain.domain}</span>
                            <p className="text-sm text-gray-500">
                              Archived: {domain.archivedAt ? new Date(domain.archivedAt).toLocaleDateString() : 'Unknown'}
                            </p>
                          </div>
                        </div>
                        
                        {/* Note section (read-only for archived) */}
                        <div className="flex-1 max-w-md mx-4">
                          {domain.note ? (
                            <div className="p-2 rounded bg-white border min-h-[2.5rem] flex items-center">
                              <StickyNote className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                              <p className="text-sm text-gray-600 whitespace-pre-wrap">{domain.note}</p>
                            </div>
                          ) : (
                            <div className="p-2 rounded border border-transparent min-h-[2.5rem] flex items-center">
                              <StickyNote className="w-4 h-4 text-gray-300 mr-2 flex-shrink-0" />
                              <p className="text-sm text-gray-400 italic">No note</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {domain.cost && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">
                              <DollarSign className="w-3 h-3" />
                              <span>{typeof domain.cost === 'string' ? parseFloat(domain.cost).toFixed(2) : domain.cost.toFixed(2)}</span>
                            </div>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(domain.domain)}
                          >
                            <Copy className="w-4 h-4 mr-1" />
                            Copy
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => archiveMutation.mutate({ domainId: domain.id, isArchived: false })}
                            disabled={archiveMutation.isPending || hasReachedLimit}
                            title={hasReachedLimit ? 'Cannot restore: Domain limit reached (10/10)' : undefined}
                          >
                            <ArchiveRestore className="w-4 h-4 mr-1" />
                            Restore
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteDomainMutation.mutate(domain.id)}
                            disabled={deleteDomainMutation.isPending}
                            className="text-red-600 border-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Форма запроса теперь в заголовке карточки My Domains */}

      {/* История запросов теперь интегрирована в архив */}
    </div>
  )
}
