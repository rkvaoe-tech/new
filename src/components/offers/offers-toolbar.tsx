'use client'

import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Search, X } from 'lucide-react'
import type { OffersFilter } from '@/types'
import { useReferences } from '@/hooks/useReferences'
import { OfferStatus } from '@prisma/client'

interface OffersToolbarProps {
  filters: OffersFilter
  onFiltersChange: (filters: OffersFilter) => void
  showFilters: boolean
}

export function OffersToolbar({ filters, onFiltersChange, showFilters }: OffersToolbarProps) {
  const { data: references, isLoading } = useReferences()

  // Получаем данные из справочников
  const geoOptions = references?.GEO_OPTIONS || []
  const localeOptions = references?.LOCALE_OPTIONS || []
  const partnerOptions = references?.PARTNER_OPTIONS || []
  const offerTypeOptions = references?.OFFER_TYPE_OPTIONS || []
  const verticalOptions = references?.VERTICAL_OPTIONS || []

  const updateFilter = (key: keyof OffersFilter, value: string | undefined) => {
    onFiltersChange({
      ...filters,
      [key]: value || undefined,
    })
  }

  const clearFilters = () => {
    onFiltersChange({})
  }

  const hasActiveFilters = Object.values(filters).some(value => value !== undefined && value !== '')

  return (
    <div className="bg-white rounded-lg border p-4 space-y-4">
      {/* Поиск */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Поиск по названию или вертикали..."
          value={filters.search || ''}
          onChange={(e) => updateFilter('search', e.target.value)}
          className="pl-10"
        />
      </div>

      {showFilters && (
        <>
          {/* Фильтры */}
          <div className="flex flex-wrap justify-start gap-4">
            {/* Статус */}
            <Select
              value={filters.status || ''}
              onValueChange={(value) => updateFilter('status', value === 'all' ? undefined : value as OfferStatus)}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="PAUSED">Pause</SelectItem>
                <SelectItem value="ARCHIVED">Stop</SelectItem>
              </SelectContent>
            </Select>

            {/* GEO */}
            <Select
              value={filters.geo || ''}
              onValueChange={(value) => updateFilter('geo', value === 'all' ? undefined : value)}
            >
              <SelectTrigger className="w-24">
                <SelectValue placeholder="GEO" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All GEO</SelectItem>
                {isLoading ? (
                  <SelectItem value="loading" disabled>Loading...</SelectItem>
                ) : (
                  geoOptions.map((geo) => (
                    <SelectItem key={geo} value={geo}>
                      {geo}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            {/* Вертикаль */}
            <Select
              value={filters.vertical || ''}
              onValueChange={(value) => updateFilter('vertical', value === 'all' ? undefined : value)}
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Vertical" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Verticals</SelectItem>
                {isLoading ? (
                  <SelectItem value="loading" disabled>Loading...</SelectItem>
                ) : (
                  verticalOptions.map((vertical) => (
                    <SelectItem key={vertical} value={vertical}>
                      {vertical}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            {/* Теги */}
            <Select
              value={filters.tag || ''}
              onValueChange={(value) => updateFilter('tag', value === 'all' ? undefined : value)}
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Offer Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {isLoading ? (
                  <SelectItem value="loading" disabled>Loading...</SelectItem>
                ) : (
                  offerTypeOptions.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            {/* Язык */}
            <Select
              value={filters.locale || ''}
              onValueChange={(value) => updateFilter('locale', value === 'all' ? undefined : value)}
            >
              <SelectTrigger className="w-28">
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Languages</SelectItem>
                {isLoading ? (
                  <SelectItem value="loading" disabled>Loading...</SelectItem>
                ) : (
                  localeOptions.map((locale) => (
                    <SelectItem key={locale} value={locale}>
                      {locale}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            {/* Партнер */}
            <Select
              value={filters.partner || ''}
              onValueChange={(value) => updateFilter('partner', value === 'all' ? undefined : value)}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Partner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Partners</SelectItem>
                {isLoading ? (
                  <SelectItem value="loading" disabled>Loading...</SelectItem>
                ) : (
                  partnerOptions.map((partner) => (
                    <SelectItem key={partner} value={partner}>
                      {partner}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={clearFilters}
                className="flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Clear
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
