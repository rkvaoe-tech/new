'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Settings, 
  Tag, 
  Users, 
  Languages,
  MapPin
} from 'lucide-react'

// Вспомогательные функции для получения полных названий
function getGeoName(code: string): string {
  const geoNames: Record<string, string> = {
    'US': 'United States',
    'CA': 'Canada', 
    'UK': 'United Kingdom',
    'AU': 'Australia',
    'DE': 'Germany',
    'FR': 'France',
    'ES': 'Spain',
    'IT': 'Italy',
    'NL': 'Netherlands',
    'SE': 'Sweden',
    'NO': 'Norway',
    'DK': 'Denmark',
    'FI': 'Finland',
    'BR': 'Brazil',
    'MX': 'Mexico',
    'AR': 'Argentina',
    'CL': 'Chile',
    'CO': 'Colombia',
    'PE': 'Peru',
    'JP': 'Japan',
    'KR': 'South Korea',
    'SG': 'Singapore',
    'MY': 'Malaysia',
    'TH': 'Thailand',
    'PH': 'Philippines',
    'IN': 'India'
  }
  return geoNames[code] || code
}

function getLanguageName(code: string): string {
  const languageNames: Record<string, string> = {
    'EN': 'English',
    'ES': 'Spanish',
    'FR': 'French',
    'DE': 'German',
    'IT': 'Italian',
    'PT': 'Portuguese',
    'RU': 'Russian',
    'JA': 'Japanese',
    'KO': 'Korean',
    'ZH': 'Chinese',
    'AR': 'Arabic',
    'HI': 'Hindi',
    'JB': 'Japanese (Beta)'
  }
  return languageNames[code] || code
}

function getPartnerName(code: string): string {
  const partnerNames: Record<string, string> = {
    'JL': 'JumpLead',
    'EL': 'EverLead',
    'ER': 'EverReach',
    'TS': 'TrafficStars',
    'MW': 'MediaWave',
    'AF': 'AffiliateForce',
    'CJ': 'Commission Junction',
    'SH': 'ShareASale'
  }
  return partnerNames[code] || code
}

// Схемы валидации
const verticalSchema = z.object({
  name: z.string().min(1, 'Название обязательно'),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  order: z.number().default(0)
})

const offerTypeSchema = z.object({
  name: z.string().min(1, 'Название обязательно'),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  order: z.number().default(0)
})

const geoSchema = z.object({
  code: z.string().min(1, 'Код обязателен').max(3, 'Код не более 3 символов').transform(s => s.toUpperCase()),
  name: z.string().min(1, 'Название обязательно'),
  isActive: z.boolean().default(true),
  order: z.number().default(0)
})

const languageSchema = z.object({
  code: z.string().min(1, 'Код обязателен').max(3, 'Код не более 3 символов').transform(s => s.toUpperCase()),
  name: z.string().min(1, 'Название обязательно'),
  isActive: z.boolean().default(true),
  order: z.number().default(0)
})

const partnerSchema = z.object({
  code: z.string().min(1, 'Код обязателен').max(5, 'Код не более 5 символов').transform(s => s.toUpperCase()),
  name: z.string().min(1, 'Название обязательно'),
  isActive: z.boolean().default(true),
  order: z.number().default(0)
})

type VerticalFormData = z.infer<typeof verticalSchema>
type OfferTypeFormData = z.infer<typeof offerTypeSchema>
type GeoFormData = z.infer<typeof geoSchema>
type LanguageFormData = z.infer<typeof languageSchema>
type PartnerFormData = z.infer<typeof partnerSchema>

export default function ReferencesAdminPage() {
  const [activeTab, setActiveTab] = useState('verticals')
  const queryClient = useQueryClient()

  // Загрузка данных из базы данных
  const { data: verticals = [], isLoading: loadingVerticals, error: verticalsError } = useQuery({
    queryKey: ['admin', 'verticals'],
    queryFn: async () => {
      console.log('Загружаем вертикали...')
      const response = await fetch('/api/admin/verticals', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Важно для передачи cookies
      })
      console.log('Ответ вертикали:', response.status)
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Ошибка загрузки вертикалей:', errorText)
        throw new Error(`Failed to fetch verticals: ${response.status}`)
      }
      const data = await response.json()
      console.log('Данные вертикалей:', data)
      return data
    }
  })

  const { data: offerTypes = [], isLoading: loadingOfferTypes, error: offerTypesError } = useQuery({
    queryKey: ['admin', 'offerTypes'],
    queryFn: async () => {
      console.log('Загружаем типы офферов...')
      const response = await fetch('/api/admin/offer-types', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Важно для передачи cookies
      })
      console.log('Ответ типы офферов:', response.status)
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Ошибка загрузки типов офферов:', errorText)
        throw new Error(`Failed to fetch offer types: ${response.status}`)
      }
      const data = await response.json()
      console.log('Данные типов офферов:', data)
      return data
    }
  })

  // Отладочная информация
  console.log('Состояние загрузки:', { loadingVerticals, loadingOfferTypes })
  console.log('Ошибки:', { verticalsError, offerTypesError })
  console.log('Данные:', { verticals: verticals.length, offerTypes: offerTypes.length })

  // Загрузка остальных справочников
  const { data: geos = [], isLoading: loadingGeos, error: geosError } = useQuery({
    queryKey: ['admin', 'geos'],
    queryFn: async () => {
      console.log('Загружаем гео...')
      const response = await fetch('/api/admin/geos', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })
      console.log('Ответ гео:', response.status)
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Ошибка загрузки гео:', errorText)
        throw new Error(`Failed to fetch geos: ${response.status}`)
      }
      const data = await response.json()
      console.log('Данные гео:', data)
      return data
    }
  })

  const { data: languages = [], isLoading: loadingLanguages, error: languagesError } = useQuery({
    queryKey: ['admin', 'languages'],
    queryFn: async () => {
      console.log('Загружаем языки...')
      const response = await fetch('/api/admin/languages', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })
      console.log('Ответ языки:', response.status)
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Ошибка загрузки языков:', errorText)
        throw new Error(`Failed to fetch languages: ${response.status}`)
      }
      const data = await response.json()
      console.log('Данные языков:', data)
      return data
    }
  })

  const { data: partners = [], isLoading: loadingPartners, error: partnersError } = useQuery({
    queryKey: ['admin', 'partners'],
    queryFn: async () => {
      console.log('Загружаем партнеров...')
      const response = await fetch('/api/admin/partners', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })
      console.log('Ответ партнеры:', response.status)
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Ошибка загрузки партнеров:', errorText)
        throw new Error(`Failed to fetch partners: ${response.status}`)
      }
      const data = await response.json()
      console.log('Данные партнеров:', data)
      return data
    }
  })

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Управление справочниками</h1>
          <p className="text-gray-600 mt-1">
            Администрирование вертикалей, типов офферов, гео, языков и партнерок
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="verticals" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Вертикали
          </TabsTrigger>
          <TabsTrigger value="offer-types" className="flex items-center gap-2">
            <Tag className="w-4 h-4" />
            Типы офферов
          </TabsTrigger>
          <TabsTrigger value="geos" className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Гео
          </TabsTrigger>
          <TabsTrigger value="languages" className="flex items-center gap-2">
            <Languages className="w-4 h-4" />
            Языки
          </TabsTrigger>
          <TabsTrigger value="partners" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Партнерки
          </TabsTrigger>
        </TabsList>

        <TabsContent value="verticals">
          {verticalsError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">Ошибка загрузки вертикалей: {verticalsError.message}</p>
            </div>
          )}
          <VerticalsList verticals={verticals} isLoading={loadingVerticals} />
        </TabsContent>

        <TabsContent value="offer-types">
          {offerTypesError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">Ошибка загрузки типов офферов: {offerTypesError.message}</p>
            </div>
          )}
          <OfferTypesList offerTypes={offerTypes} isLoading={loadingOfferTypes} />
        </TabsContent>

        <TabsContent value="geos">
          {geosError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">Ошибка загрузки гео: {geosError.message}</p>
            </div>
          )}
          <GeosList geos={geos} isLoading={loadingGeos} />
        </TabsContent>

        <TabsContent value="languages">
          {languagesError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">Ошибка загрузки языков: {languagesError.message}</p>
            </div>
          )}
          <LanguagesList languages={languages} isLoading={loadingLanguages} />
        </TabsContent>

        <TabsContent value="partners">
          {partnersError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">Ошибка загрузки партнеров: {partnersError.message}</p>
            </div>
          )}
          <PartnersList partners={partners} isLoading={loadingPartners} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Компонент для управления вертикалями
function VerticalsList({ verticals, isLoading }: { verticals: any[], isLoading: boolean }) {
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingVertical, setEditingVertical] = useState<any>(null)
  const queryClient = useQueryClient()

  const form = useForm<VerticalFormData>({
    resolver: zodResolver(verticalSchema),
    defaultValues: {
      name: '',
      description: '',
      isActive: true,
      order: 0
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
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create vertical')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'verticals'] })
      toast.success('Вертикаль создана')
      setShowCreateDialog(false)
      form.reset()
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: Partial<VerticalFormData> }) => {
      const response = await fetch(`/api/admin/verticals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update vertical')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'verticals'] })
      toast.success('Вертикаль обновлена')
      setEditingVertical(null)
      form.reset()
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/verticals/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete vertical')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'verticals'] })
      toast.success('Вертикаль деактивирована')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })

  const onSubmit = (data: VerticalFormData) => {
    if (editingVertical) {
      updateMutation.mutate({ id: editingVertical.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const handleEdit = (vertical: any) => {
    setEditingVertical(vertical)
    form.reset({
      name: vertical.name,
      description: vertical.description || '',
      isActive: vertical.isActive,
      order: vertical.order
    })
    setShowCreateDialog(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Вы уверены, что хотите деактивировать эту вертикаль?')) {
      deleteMutation.mutate(id)
    }
  }

  if (isLoading) {
    return <div className="text-center py-8">Загрузка...</div>
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Вертикали ({verticals.length})</CardTitle>
        <Dialog open={showCreateDialog} onOpenChange={(open) => {
          setShowCreateDialog(open)
          if (!open) {
            setEditingVertical(null)
            form.reset()
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Добавить вертикаль
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingVertical ? 'Редактировать вертикаль' : 'Создать вертикаль'}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Название</FormLabel>
                      <FormControl>
                        <Input placeholder="Male Enhancement" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Описание</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Описание вертикали..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="order"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Порядок сортировки</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Активна</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Отображать в списках выбора
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowCreateDialog(false)}
                  >
                    Отмена
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {editingVertical ? 'Обновить' : 'Создать'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {verticals.map((vertical) => (
            <div 
              key={vertical.id} 
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div>
                  <div className="font-medium">{vertical.name}</div>
                  {vertical.description && (
                    <div className="text-sm text-gray-500">{vertical.description}</div>
                  )}
                </div>
                <Badge variant={vertical.isActive ? 'default' : 'secondary'}>
                  {vertical.isActive ? 'Активна' : 'Неактивна'}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(vertical)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(vertical.id)}
                  disabled={!vertical.isActive}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
          
          {verticals.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Нет вертикалей
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Компонент для управления типами офферов (пока заглушка)
function OfferTypesList({ offerTypes, isLoading }: { offerTypes: any[], isLoading: boolean }) {
  if (isLoading) {
    return <div className="text-center py-8">Загрузка...</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Типы офферов ({offerTypes.length})</CardTitle>
        <p className="text-sm text-gray-600">Функциональность редактирования в разработке</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {offerTypes.map((type, index) => (
            <div 
              key={index}
              className="p-3 border rounded-lg bg-gray-50"
            >
              <div className="font-medium text-sm">{type.name}</div>
              {type.description && (
                <div className="text-xs text-gray-500 mt-1">{type.description}</div>
              )}
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
  )
}

// Компонент для управления гео
function GeosList({ geos, isLoading }: { geos: any[], isLoading: boolean }) {
  if (isLoading) {
    return <div className="text-center py-8">Загрузка...</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Гео ({geos.length})</CardTitle>
        <p className="text-sm text-gray-600">Отображение справочника гео</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {geos.map((geo, index) => (
            <div 
              key={index}
              className="p-3 border rounded-lg bg-gray-50"
            >
              <div className="font-medium text-sm">{geo.code} - {geo.name}</div>
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
  )
}

// Компонент для управления языками  
function LanguagesList({ languages, isLoading }: { languages: any[], isLoading: boolean }) {
  if (isLoading) {
    return <div className="text-center py-8">Загрузка...</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Языки ({languages.length})</CardTitle>
        <p className="text-sm text-gray-600">Отображение справочника языков</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {languages.map((language, index) => (
            <div 
              key={index}
              className="p-3 border rounded-lg bg-gray-50"
            >
              <div className="font-medium text-sm">{language.code} - {language.name}</div>
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
  )
}

// Компонент для управления партнерами
function PartnersList({ partners, isLoading }: { partners: any[], isLoading: boolean }) {
  if (isLoading) {
    return <div className="text-center py-8">Загрузка...</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Партнеры ({partners.length})</CardTitle>
        <p className="text-sm text-gray-600">Отображение справочника партнеров</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {partners.map((partner, index) => (
            <div 
              key={index}
              className="p-3 border rounded-lg bg-gray-50"
            >
              <div className="font-medium text-sm">{partner.code} - {partner.name}</div>
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
  )
}