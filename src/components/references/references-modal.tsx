'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Trash2, Settings, Tag, MapPin, Languages, Users } from 'lucide-react'
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

// Schemas для валидации
const verticalSchema = z.object({
  name: z.string().min(1, 'Name is required')
})

const offerTypeSchema = z.object({
  name: z.string().min(1, 'Name is required')
})

const geoSchema = z.object({
  code: z.string().min(2, 'Code must be at least 2 characters').max(3, 'Code must be at most 3 characters'),
  name: z.string().min(1, 'Name is required')
})

const languageSchema = z.object({
  code: z.string().min(2, 'Code must be at least 2 characters').max(3, 'Code must be at most 3 characters'),
  name: z.string().min(1, 'Name is required')
})

const partnerSchema = z.object({
  code: z.string().min(2, 'Code must be at least 2 characters').max(5, 'Code must be at most 5 characters'),
  name: z.string().min(1, 'Name is required')
})

type VerticalFormData = z.infer<typeof verticalSchema>
type OfferTypeFormData = z.infer<typeof offerTypeSchema>
type GeoFormData = z.infer<typeof geoSchema>
type LanguageFormData = z.infer<typeof languageSchema>
type PartnerFormData = z.infer<typeof partnerSchema>

interface ReferencesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ReferencesModal({ open, onOpenChange }: ReferencesModalProps) {
  const [activeTab, setActiveTab] = useState('verticals')
  const queryClient = useQueryClient()

  // Загрузка данных из базы данных
  const { data: verticals = [], isLoading: loadingVerticals, error: verticalsError } = useQuery({
    queryKey: ['admin', 'verticals'],
    queryFn: async () => {
      const response = await fetch('/api/admin/verticals', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })
      if (!response.ok) {
        throw new Error(`Failed to fetch verticals: ${response.status}`)
      }
      return response.json()
    },
    enabled: open
  })

  const { data: offerTypes = [], isLoading: loadingOfferTypes, error: offerTypesError } = useQuery({
    queryKey: ['admin', 'offerTypes'],
    queryFn: async () => {
      const response = await fetch('/api/admin/offer-types', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })
      if (!response.ok) {
        throw new Error(`Failed to fetch offer types: ${response.status}`)
      }
      return response.json()
    },
    enabled: open
  })

  const { data: geos = [], isLoading: loadingGeos, error: geosError } = useQuery({
    queryKey: ['admin', 'geos'],
    queryFn: async () => {
      const response = await fetch('/api/admin/geos', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })
      if (!response.ok) {
        throw new Error(`Failed to fetch geos: ${response.status}`)
      }
      return response.json()
    },
    enabled: open
  })

  const { data: languages = [], isLoading: loadingLanguages, error: languagesError } = useQuery({
    queryKey: ['admin', 'languages'],
    queryFn: async () => {
      const response = await fetch('/api/admin/languages', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })
      if (!response.ok) {
        throw new Error(`Failed to fetch languages: ${response.status}`)
      }
      return response.json()
    },
    enabled: open
  })

  const { data: partners = [], isLoading: loadingPartners, error: partnersError } = useQuery({
    queryKey: ['admin', 'partners'],
    queryFn: async () => {
      const response = await fetch('/api/admin/partners', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })
      if (!response.ok) {
        throw new Error(`Failed to fetch partners: ${response.status}`)
      }
      return response.json()
    },
    enabled: open
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Управление справочниками</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 h-auto">
            <TabsTrigger value="verticals" className="text-sm">
              Verticals
            </TabsTrigger>
            <TabsTrigger value="offer-types" className="text-sm">
              Types
            </TabsTrigger>
            <TabsTrigger value="geos" className="text-sm">
              Countries
            </TabsTrigger>
            <TabsTrigger value="languages" className="text-sm">
              Languages
            </TabsTrigger>
            <TabsTrigger value="partners" className="text-sm">
              Partners
            </TabsTrigger>
          </TabsList>

          <TabsContent value="verticals">
            {verticalsError && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-800">Error loading вертикалей: {verticalsError.message}</p>
              </div>
            )}
            <VerticalsList verticals={verticals} isLoading={loadingVerticals} />
          </TabsContent>

          <TabsContent value="offer-types">
            {offerTypesError && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-800">Error loading типов офферов: {offerTypesError.message}</p>
              </div>
            )}
            <OfferTypesList offerTypes={offerTypes} isLoading={loadingOfferTypes} />
          </TabsContent>

          <TabsContent value="geos">
            {geosError && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-800">Error loading гео: {geosError.message}</p>
              </div>
            )}
            <GeosList geos={geos} isLoading={loadingGeos} />
          </TabsContent>

          <TabsContent value="languages">
            {languagesError && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-800">Error loading языков: {languagesError.message}</p>
              </div>
            )}
            <LanguagesList languages={languages} isLoading={loadingLanguages} />
          </TabsContent>

          <TabsContent value="partners">
            {partnersError && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-800">Error loading партнеров: {partnersError.message}</p>
              </div>
            )}
            <PartnersList partners={partners} isLoading={loadingPartners} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

// Компонент для управления вертикалями
function VerticalsList({ verticals, isLoading }: { verticals: any[], isLoading: boolean }) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const queryClient = useQueryClient()

  const form = useForm<VerticalFormData>({
    resolver: zodResolver(verticalSchema),
    defaultValues: {
      name: ''
    }
  })

  const createMutation = useMutation({
    mutationFn: async (data: VerticalFormData) => {
      const response = await fetch('/api/admin/verticals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      })
      if (!response.ok) throw new Error('Failed to create vertical')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'verticals'] })
      queryClient.invalidateQueries({ queryKey: ['references'] })
      setDialogOpen(false)
      form.reset()
      toast.success('Вертикаль создана')
    },
    onError: (error) => {
      toast.error('Error creating вертикали')
    }
  })


  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/verticals/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      if (!response.ok) throw new Error('Failed to delete vertical')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'verticals'] })
      queryClient.invalidateQueries({ queryKey: ['references'] })
      toast.success('Вертикаль удалена')
    },
    onError: (error) => {
      toast.error('Error deleting вертикали')
    }
  })

  const onSubmit = (data: VerticalFormData) => {
    createMutation.mutate(data)
  }

  const handleCreate = () => {
    form.reset({
      name: ''
    })
    setDialogOpen(true)
  }

  if (isLoading) {
    return <div className="text-center py-8">Загрузка...</div>
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Verticals ({verticals.length})</CardTitle>
          <Button onClick={handleCreate} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {verticals.map((vertical) => (
              <div key={vertical.id} className="p-3 border rounded-lg flex items-center justify-between">
                <h3 className="font-medium">{vertical.name}</h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteMutation.mutate(vertical.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
          
          {verticals.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Нет вертикалей
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Создать вертикаль</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Vertical Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Отмена
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  Создать
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  )
}

// Компонент для управления типами офферов
function OfferTypesList({ offerTypes, isLoading }: { offerTypes: any[], isLoading: boolean }) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const queryClient = useQueryClient()

  const form = useForm<OfferTypeFormData>({
    resolver: zodResolver(offerTypeSchema),
    defaultValues: {
      name: ''
    }
  })

  const createMutation = useMutation({
    mutationFn: async (data: OfferTypeFormData) => {
      const response = await fetch('/api/admin/offer-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      })
      if (!response.ok) throw new Error('Failed to create offer type')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'offerTypes'] })
      queryClient.invalidateQueries({ queryKey: ['references'] })
      setDialogOpen(false)
      form.reset()
      toast.success('Тип оффера создан')
    },
    onError: (error) => {
      toast.error('Error creating типа оффера')
    }
  })


  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/offer-types/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      if (!response.ok) throw new Error('Failed to delete offer type')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'offerTypes'] })
      queryClient.invalidateQueries({ queryKey: ['references'] })
      toast.success('Тип оффера удален')
    },
    onError: (error) => {
      toast.error('Error deleting типа оффера')
    }
  })

  const onSubmit = (data: OfferTypeFormData) => {
    createMutation.mutate(data)
  }

  const handleCreate = () => {
    form.reset({
      name: ''
    })
    setDialogOpen(true)
  }

  if (isLoading) {
    return <div className="text-center py-8">Загрузка...</div>
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Offer Types ({offerTypes.length})</CardTitle>
          <Button onClick={handleCreate} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {offerTypes.map((offerType) => (
              <div key={offerType.id} className="p-3 border rounded-lg flex items-center justify-between">
                <h3 className="font-medium">{offerType.name}</h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteMutation.mutate(offerType.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
          
          {offerTypes.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Нет типов офферов
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Создать тип оффера</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Offer Type Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Отмена
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  Создать
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  )
}

// Компонент для управления гео
function GeosList({ geos, isLoading }: { geos: any[], isLoading: boolean }) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const queryClient = useQueryClient()

  const form = useForm<GeoFormData>({
    resolver: zodResolver(geoSchema),
    defaultValues: {
      code: '',
      name: ''
    }
  })

  const createMutation = useMutation({
    mutationFn: async (data: GeoFormData) => {
      const response = await fetch('/api/admin/geos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      })
      if (!response.ok) throw new Error('Failed to create geo')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'geos'] })
      queryClient.invalidateQueries({ queryKey: ['references'] })
      setDialogOpen(false)
      form.reset()
      toast.success('Гео создано')
    },
    onError: (error) => {
      toast.error('Error creating гео')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/geos/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      if (!response.ok) throw new Error('Failed to delete geo')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'geos'] })
      queryClient.invalidateQueries({ queryKey: ['references'] })
      toast.success('Гео удалено')
    },
    onError: (error) => {
      toast.error('Error deleting гео')
    }
  })

  const onSubmit = (data: GeoFormData) => {
    createMutation.mutate(data)
  }

  const handleCreate = () => {
    form.reset({
      code: '',
      name: ''
    })
    setDialogOpen(true)
  }

  if (isLoading) {
    return <div className="text-center py-8">Загрузка...</div>
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Countries ({geos.length})</CardTitle>
          <Button onClick={handleCreate} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {geos.map((geo) => (
              <div key={geo.id} className="p-3 border rounded-lg flex items-center justify-between">
                <h3 className="font-medium">{geo.code} - {geo.name}</h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteMutation.mutate(geo.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
          
          {geos.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Нет гео
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Создать гео</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code</FormLabel>
                    <FormControl>
                      <Input placeholder="US" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Country Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Отмена
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  Создать
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  )
}

// Компонент для управления языками
function LanguagesList({ languages, isLoading }: { languages: any[], isLoading: boolean }) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const queryClient = useQueryClient()

  const form = useForm<LanguageFormData>({
    resolver: zodResolver(languageSchema),
    defaultValues: {
      code: '',
      name: ''
    }
  })

  const createMutation = useMutation({
    mutationFn: async (data: LanguageFormData) => {
      const response = await fetch('/api/admin/languages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      })
      if (!response.ok) throw new Error('Failed to create language')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'languages'] })
      queryClient.invalidateQueries({ queryKey: ['references'] })
      setDialogOpen(false)
      form.reset()
      toast.success('Язык создан')
    },
    onError: (error) => {
      toast.error('Error creating языка')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/languages/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      if (!response.ok) throw new Error('Failed to delete language')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'languages'] })
      queryClient.invalidateQueries({ queryKey: ['references'] })
      toast.success('Язык удален')
    },
    onError: (error) => {
      toast.error('Error deleting языка')
    }
  })

  const onSubmit = (data: LanguageFormData) => {
    createMutation.mutate(data)
  }

  const handleCreate = () => {
    form.reset({
      code: '',
      name: ''
    })
    setDialogOpen(true)
  }

  if (isLoading) {
    return <div className="text-center py-8">Загрузка...</div>
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Languages ({languages.length})</CardTitle>
          <Button onClick={handleCreate} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {languages.map((language) => (
              <div key={language.id} className="p-3 border rounded-lg flex items-center justify-between">
                <h3 className="font-medium">{language.code} - {language.name}</h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteMutation.mutate(language.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
          
          {languages.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Нет языков
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Создать язык</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code</FormLabel>
                    <FormControl>
                      <Input placeholder="EN" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Language Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Отмена
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  Создать
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  )
}

// Компонент для управления партнерами
function PartnersList({ partners, isLoading }: { partners: any[], isLoading: boolean }) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const queryClient = useQueryClient()

  const form = useForm<PartnerFormData>({
    resolver: zodResolver(partnerSchema),
    defaultValues: {
      code: '',
      name: ''
    }
  })

  const createMutation = useMutation({
    mutationFn: async (data: PartnerFormData) => {
      const response = await fetch('/api/admin/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      })
      if (!response.ok) throw new Error('Failed to create partner')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'partners'] })
      queryClient.invalidateQueries({ queryKey: ['references'] })
      setDialogOpen(false)
      form.reset()
      toast.success('Партнер создан')
    },
    onError: (error) => {
      toast.error('Error creating партнера')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/partners/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      if (!response.ok) throw new Error('Failed to delete partner')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'partners'] })
      queryClient.invalidateQueries({ queryKey: ['references'] })
      toast.success('Партнер удален')
    },
    onError: (error) => {
      toast.error('Error deleting партнера')
    }
  })

  const onSubmit = (data: PartnerFormData) => {
    createMutation.mutate(data)
  }

  const handleCreate = () => {
    form.reset({
      code: '',
      name: ''
    })
    setDialogOpen(true)
  }

  if (isLoading) {
    return <div className="text-center py-8">Загрузка...</div>
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Partners ({partners.length})</CardTitle>
          <Button onClick={handleCreate} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {partners.map((partner) => (
              <div key={partner.id} className="p-3 border rounded-lg flex items-center justify-between">
                <h3 className="font-medium">{partner.code} - {partner.name}</h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteMutation.mutate(partner.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
          
          {partners.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Нет партнеров
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Создать партнера</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code</FormLabel>
                    <FormControl>
                      <Input placeholder="FB" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Partner Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Отмена
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  Создать
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  )
}
