import { useQuery } from '@tanstack/react-query'

export interface ReferenceData {
  VERTICAL_OPTIONS: string[]
  OFFER_TYPE_OPTIONS: string[]
  GEO_OPTIONS: string[]
  LOCALE_OPTIONS: string[]
  PARTNER_OPTIONS: string[]
  verticals: Array<{ id: string; name: string; order: number }>
  offerTypes: Array<{ id: string; name: string; order: number }>
  geos: Array<{ id: string; code: string; name: string; order: number }>
  languages: Array<{ id: string; code: string; name: string; order: number }>
  partners: Array<{ id: string; code: string; name: string; order: number }>
}

export function useReferences() {
  return useQuery<ReferenceData>({
    queryKey: ['references'],
    queryFn: async () => {
      const response = await fetch('/api/references', {
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch references')
      }
      
      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 минут
    gcTime: 10 * 60 * 1000, // 10 минут
  })
}
