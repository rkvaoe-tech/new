'use client'

import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { 
  Trash2, 
  Globe, 
  Link, 
  Copy,
  Plus
} from 'lucide-react'
import { z } from 'zod'
import { useReferences } from '@/hooks/useReferences'
import { LandingType } from '@prisma/client'
import type { Landing } from '@prisma/client'

// Схема валидации для одного лендинга
const landingItemSchema = z.object({
  id: z.string().optional(), // Для существующих лендингов
  extId: z.number().min(1, 'Minimum 1').max(9999, 'Maximum 4 digits').optional(),
  label: z.string().min(1, 'Name is required'),
  type: z.enum(['LANDING', 'PRELANDING']),
  locale: z.string().min(1, 'Language is required'),
  networkCode: z.string().optional(),
  url: z.string().url('Invalid URL'),
})

// Схема для формы с отдельными массивами лендингов и прелендингов
const bulkLandingSchema = z.object({
  landings: z.array(landingItemSchema),
  prelandings: z.array(landingItemSchema),
})

type BulkLandingFormData = z.infer<typeof bulkLandingSchema>
type LandingItemData = z.infer<typeof landingItemSchema>

interface BulkLandingDialogProps {
  offerId: string
  existingLandings: Landing[]
  existingPrelandings: Landing[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function BulkLandingDialog({ 
  offerId, 
  existingLandings,
  existingPrelandings,
  open, 
  onOpenChange, 
  onSuccess 
}: BulkLandingDialogProps) {
  const { data: references, isLoading: referencesLoading } = useReferences()
  const queryClient = useQueryClient()

  // Получаем данные из справочников
  const localeOptions = references?.LOCALE_OPTIONS || []
  const partnerOptions = references?.PARTNER_OPTIONS || []

  // Подготавливаем начальные данные из существующих лендингов и прелендингов
  const getInitialData = () => {
    const landings = existingLandings.map(landing => ({
      id: landing.id,
      extId: landing.extId || undefined,
      label: landing.label,
      type: landing.type as LandingType,
      locale: landing.locale,
      networkCode: landing.networkCode || undefined,
      url: landing.url,
    }))
    
    const prelandings = existingPrelandings.map(landing => ({
      id: landing.id,
      extId: landing.extId || undefined,
      label: landing.label,
      type: landing.type as LandingType,
      locale: landing.locale,
      url: landing.url,
    }))
    
    return { landings, prelandings }
  }

  const form = useForm<BulkLandingFormData>({
    resolver: zodResolver(bulkLandingSchema),
    defaultValues: getInitialData(),
  })

  const { fields: landingFields, append: appendLanding, remove: removeLanding } = useFieldArray({
    control: form.control,
    name: 'landings',
  })

  const { fields: prelandingFields, append: appendPrelanding, remove: removePrelanding } = useFieldArray({
    control: form.control,
    name: 'prelandings',
  })

  const createLandingsMutation = useMutation({
    mutationFn: async (data: BulkLandingFormData) => {
      const results = []
      
      // Обрабатываем лендинги
      for (const landing of data.landings) {
        let response
        
        if (landing.id) {
          // Обновляем существующий лендинг
          response = await fetch(`/api/landings/${landing.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              extId: landing.extId,
              label: landing.label,
              locale: landing.locale,
              networkCode: landing.networkCode,
              url: landing.url,
            }),
          })
        } else {
          // Создаем новый лендинг
          response = await fetch(`/api/offers/${offerId}/landings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              extId: landing.extId,
              label: landing.label,
              type: 'LANDING',
              locale: landing.locale,
              networkCode: landing.networkCode,
              url: landing.url,
            }),
          })
        }

        if (!response.ok) {
          const error = await response.json()
          const action = landing.id ? 'updating' : 'creating'
          throw new Error(`Error ${action} landing "${landing.label}": ${error.error}`)
        }

        results.push(await response.json())
      }

      // Обрабатываем прелендинги
      for (const prelanding of data.prelandings) {
        let response
        
        if (prelanding.id) {
          // Обновляем существующий прелендинг
          response = await fetch(`/api/landings/${prelanding.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              extId: prelanding.extId,
              label: prelanding.label,
              locale: prelanding.locale,
              url: prelanding.url,
            }),
          })
        } else {
          // Создаем новый прелендинг
          response = await fetch(`/api/offers/${offerId}/landings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              extId: prelanding.extId,
              label: prelanding.label,
              type: 'PRELANDING',
              locale: prelanding.locale,
              url: prelanding.url,
            }),
          })
        }

        if (!response.ok) {
          const error = await response.json()
          const action = prelanding.id ? 'updating' : 'creating'
          throw new Error(`Error ${action} prelanding "${prelanding.label}": ${error.error}`)
        }

        results.push(await response.json())
      }

      return results
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ['offers'] })
      
      toast.success('Landings and prelandings saved successfully')
      onSuccess()
      onOpenChange(false)
        form.reset(getInitialData())
    },
    onError: (error: Error) => {
      console.error('Error creating landings:', error)
      toast.error(error.message)
    },
  })

  const onSubmit = (data: BulkLandingFormData) => {
    createLandingsMutation.mutate(data)
  }

  const addLanding = () => {
    appendLanding({
      label: '',
      type: 'LANDING',
      locale: '',
      networkCode: undefined,
      url: 'https://',
    })
  }

  const addPrelanding = () => {
    appendPrelanding({
      label: '',
      type: 'PRELANDING',
      locale: '',
      url: 'https://',
    })
  }


  const duplicateLanding = (index: number) => {
    const itemToDuplicate = form.getValues(`landings.${index}`)
    appendLanding({
      ...itemToDuplicate,
      id: undefined, // Убираем id, чтобы создать новый лендинг
      label: `${itemToDuplicate.label} (copy)`,
    })
  }

  const duplicatePrelanding = (index: number) => {
    const itemToDuplicate = form.getValues(`prelandings.${index}`)
    appendPrelanding({
      ...itemToDuplicate,
      id: undefined, // Убираем id, чтобы создать новый прелендинг
      label: `${itemToDuplicate.label} (copy)`,
    })
  }

  const handleDeleteLanding = async (index: number) => {
    const landing = form.getValues(`landings.${index}`)
    
    if (landing.id) {
      // Если это существующий лендинг, удаляем его на сервере
      try {
        const response = await fetch(`/api/landings/${landing.id}`, {
          method: 'DELETE',
        })
        
        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Error deleting')
        }
        
        toast.success(`Landing "${landing.label}" deleted`)
        queryClient.invalidateQueries({ queryKey: ['offers'] })
        onSuccess() // Обновляем данные
      } catch (error: any) {
        toast.error(error.message)
        return
      }
    }
    
    // Удаляем из формы
    removeLanding(index)
  }

  const handleDeletePrelanding = async (index: number) => {
    const prelanding = form.getValues(`prelandings.${index}`)
    
    if (prelanding.id) {
      // Если это существующий прелендинг, удаляем его на сервере
      try {
        const response = await fetch(`/api/landings/${prelanding.id}`, {
          method: 'DELETE',
        })
        
        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Error deleting')
        }
        
        toast.success(`Prelanding "${prelanding.label}" deleted`)
        queryClient.invalidateQueries({ queryKey: ['offers'] })
        onSuccess() // Обновляем данные
      } catch (error: any) {
        toast.error(error.message)
        return
      }
    }
    
    // Удаляем из формы
    removePrelanding(index)
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      form.reset(getInitialData())
    }
    onOpenChange(open)
  }

  const getTypeIcon = (type: LandingType) => {
    return type === 'LANDING' ? <Globe className="w-4 h-4" /> : <Link className="w-4 h-4" />
  }

  const getTypeColor = (type: LandingType) => {
    return type === 'LANDING' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
  }

  if (referencesLoading) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-md">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="text-gray-500">Loading references...</div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Landing and Prelanding Management
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">

            {/* Список лендингов и прелендингов */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 min-h-0">
              {/* Секция лендингов */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-600" />
                  <h3 className="font-medium text-blue-600">Landings ({landingFields.length})</h3>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={addLanding}
                    className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700"
                    title="Add Landing"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                
                {landingFields.map((field, index) => (
                  <div key={field.id} className="border rounded-lg p-4 space-y-3">
                    {/* Поля формы */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-2">
                      {/* ID */}
                      <FormField
                        control={form.control}
                        name={`landings.${index}.extId`}
                        render={({ field }) => (
                          <FormItem className="space-y-1 lg:col-span-1 form-item-compact">
                            <FormLabel className="text-xs font-medium">ID</FormLabel>
                            <FormControl>
                              <Input 
                                type="text" 
                                placeholder="1234"
                                className="h-8 px-2"
                                {...field}
                                onChange={(e) => {
                                  const value = e.target.value
                                  if (value === '' || (parseInt(value) >= 1 && parseInt(value) <= 9999)) {
                                    field.onChange(value ? parseInt(value) : undefined)
                                  }
                                }}
                                value={field.value || ''}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Название */}
                      <FormField
                        control={form.control}
                        name={`landings.${index}.label`}
                        render={({ field }) => (
                          <FormItem className="space-y-1 lg:col-span-4 form-item-compact">
                            <FormLabel className="text-xs font-medium">NAME</FormLabel>
                            <FormControl>
                              <Input placeholder="Default" className="h-8 px-2" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* URL */}
                      <FormField
                        control={form.control}
                        name={`landings.${index}.url`}
                        render={({ field }) => (
                          <FormItem className="space-y-1 lg:col-span-4 form-item-compact">
                            <FormLabel className="text-xs font-medium">URL</FormLabel>
                            <FormControl>
                              <Input placeholder="https://example.com/landing/188" className="h-8 px-2" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Сеть */}
                      <FormField
                        control={form.control}
                        name={`landings.${index}.networkCode`}
                        render={({ field }) => (
                          <FormItem className="space-y-1 lg:col-span-1 select-form-item">
                            <FormLabel className="text-xs font-medium">NETWORK</FormLabel>
                            <Select 
                              onValueChange={(value) => field.onChange(value === 'none' ? undefined : value)} 
                              value={field.value || 'none'}
                            >
                              <FormControl>
                                <SelectTrigger className="select-trigger-compact px-2">
                                  <SelectValue placeholder="-" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">-</SelectItem>
                                {partnerOptions.map((partner) => (
                                  <SelectItem key={partner} value={partner}>
                                    {partner}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Язык */}
                      <FormField
                        control={form.control}
                        name={`landings.${index}.locale`}
                        render={({ field }) => (
                          <FormItem className="space-y-1 lg:col-span-1 select-form-item">
                            <FormLabel className="text-xs font-medium">LANG</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="select-trigger-compact px-2">
                                  <SelectValue placeholder="-" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {localeOptions.map((locale) => (
                                  <SelectItem key={locale} value={locale}>
                                    {locale}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Кнопки управления */}
                      <div className="flex items-end gap-1 lg:col-span-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => duplicateLanding(index)}
                          className="h-8 w-8 p-0"
                              title="Duplicate"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                        
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteLanding(index)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                              title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Секция прелендингов */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Link className="w-4 h-4 text-purple-600" />
                  <h3 className="font-medium text-purple-600">Prelandings ({prelandingFields.length})</h3>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={addPrelanding}
                    className="h-6 w-6 p-0 text-purple-600 hover:text-purple-700"
                    title="Add Prelanding"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                
                {prelandingFields.map((field, index) => (
                  <div key={field.id} className="border rounded-lg p-4 space-y-3">
                    {/* Поля формы */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-2">
                      {/* ID */}
                      <FormField
                        control={form.control}
                        name={`prelandings.${index}.extId`}
                        render={({ field }) => (
                          <FormItem className="space-y-1 lg:col-span-1 form-item-compact">
                            <FormLabel className="text-xs font-medium">ID</FormLabel>
                            <FormControl>
                              <Input 
                                type="text" 
                                placeholder="1234"
                                className="h-8 px-2"
                                {...field}
                                onChange={(e) => {
                                  const value = e.target.value
                                  if (value === '' || (parseInt(value) >= 1 && parseInt(value) <= 9999)) {
                                    field.onChange(value ? parseInt(value) : undefined)
                                  }
                                }}
                                value={field.value || ''}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Название */}
                      <FormField
                        control={form.control}
                        name={`prelandings.${index}.label`}
                        render={({ field }) => (
                          <FormItem className="space-y-1 lg:col-span-4 form-item-compact">
                            <FormLabel className="text-xs font-medium">NAME</FormLabel>
                            <FormControl>
                              <Input placeholder="Default" className="h-8 px-2" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* URL */}
                      <FormField
                        control={form.control}
                        name={`prelandings.${index}.url`}
                        render={({ field }) => (
                          <FormItem className="space-y-1 lg:col-span-5 form-item-compact">
                            <FormLabel className="text-xs font-medium">URL</FormLabel>
                            <FormControl>
                              <Input placeholder="https://example.com/landing/188" className="h-8 px-2" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />


                      {/* Язык */}
                      <FormField
                        control={form.control}
                        name={`prelandings.${index}.locale`}
                        render={({ field }) => (
                          <FormItem className="space-y-1 lg:col-span-1 select-form-item">
                            <FormLabel className="text-xs font-medium">LANG</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="select-trigger-compact px-2">
                                  <SelectValue placeholder="-" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {localeOptions.map((locale) => (
                                  <SelectItem key={locale} value={locale}>
                                    {locale}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Кнопки управления */}
                      <div className="flex items-end gap-1 lg:col-span-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => duplicatePrelanding(index)}
                          className="h-8 w-8 p-0"
                              title="Duplicate"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                        
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePrelanding(index)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                              title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator className="my-4" />

            {/* Кнопки управления */}
            <div className="flex justify-between items-center flex-shrink-0">
              <div className="text-sm text-gray-600">
                Total items: {landingFields.length + prelandingFields.length}
              </div>
              
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  disabled={createLandingsMutation.isPending}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createLandingsMutation.isPending || (landingFields.length === 0 && prelandingFields.length === 0)}
                >
                  {createLandingsMutation.isPending ? 'Saving...' : `Save All (${landingFields.length + prelandingFields.length})`}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
