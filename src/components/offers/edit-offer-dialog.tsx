'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { toast } from 'sonner'
import { X } from 'lucide-react'
import { offerSchema } from '@/lib/validations'
import type { OfferWithLandings, OfferFormData } from '@/types'
import { useReferences } from '@/hooks/useReferences'
import { OfferStatus } from '@prisma/client'
import { ImageUpload } from './image-upload'

interface EditOfferDialogProps {
  offer: OfferWithLandings
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: () => void
}

export function EditOfferDialog({ offer, open, onOpenChange, onUpdate }: EditOfferDialogProps) {
  const { data: references, isLoading } = useReferences()
  const [selectedGeo, setSelectedGeo] = useState<string[]>(offer.geo)
  const [selectedTags, setSelectedTags] = useState<string[]>(offer.tags)
  const queryClient = useQueryClient()

  // Получаем данные из справочников
  const geoOptions = references?.GEO_OPTIONS || []
  const offerTypeOptions = references?.OFFER_TYPE_OPTIONS || []

  const form = useForm<OfferFormData>({
    resolver: zodResolver(offerSchema),
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

  const updateOfferMutation = useMutation({
    mutationFn: async (data: OfferFormData) => {
      const response = await fetch(`/api/offers/${offer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          geo: selectedGeo,
          tags: selectedTags,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update offer')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offers'] })
      toast.success('Offer updated successfully')
      onUpdate()
      onOpenChange(false)
    },
    onError: (error) => {
      console.error('Error updating offer:', error)
      toast.error('Error updating offer')
    },
  })

  const onSubmit = (data: OfferFormData) => {
    updateOfferMutation.mutate(data)
  }

  const addGeo = (geo: string) => {
    if (!selectedGeo.includes(geo)) {
      setSelectedGeo([...selectedGeo, geo])
    }
  }

  const removeGeo = (geo: string) => {
    setSelectedGeo(selectedGeo.filter(g => g !== geo))
  }

  const addTag = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag])
    }
  }

  const removeTag = (tag: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tag))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Offer</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Brand Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vertical"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vertical *</FormLabel>
                    <FormControl>
                      <Input placeholder="Male Enhancement" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priceUsd"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price (USD) *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        placeholder="44"
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
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="PAUSED">Paused</SelectItem>
                        <SelectItem value="ARCHIVED">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/image.png" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div>
                <Label>Or Upload File</Label>
                <div className="mt-2">
                  <ImageUpload
                    offerId={offer.id}
                    currentImageUrl={form.watch('imageUrl') || offer.imageUrl}
                    onSuccess={(imageUrl) => {
                      form.setValue('imageUrl', imageUrl)
                    }}
                  />
                </div>
              </div>
            </div>

            {/* GEO */}
            <div className="space-y-2">
              <Label>Countries</Label>
              <Select onValueChange={addGeo}>
                <SelectTrigger>
                  <SelectValue placeholder="Add Country" />
                </SelectTrigger>
                <SelectContent>
                  {geoOptions.filter(geo => !selectedGeo.includes(geo)).map((geo) => (
                    <SelectItem key={geo} value={geo}>
                      {geo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex flex-wrap gap-2">
                {selectedGeo.map((geo) => (
                  <Badge key={geo} variant="secondary" className="flex items-center gap-1">
                    {geo}
                    <button
                      type="button"
                      onClick={() => removeGeo(geo)}
                      className="ml-1 hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label>Tags</Label>
              <Select onValueChange={addTag}>
                <SelectTrigger>
                  <SelectValue placeholder="Add Tag" />
                </SelectTrigger>
                <SelectContent>
                  {offerTypeOptions.filter(tag => !selectedTags.includes(tag)).map((tag) => (
                    <SelectItem key={tag} value={tag}>
                      {tag}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex flex-wrap gap-2">
                {selectedTags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={updateOfferMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateOfferMutation.isPending}>
                {updateOfferMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
