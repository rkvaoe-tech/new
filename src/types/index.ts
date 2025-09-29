import { type Offer, type Landing, type AppUser, type AuditLog, type OfferStatus, type LandingType } from '@prisma/client'

// Расширенные типы для API
export interface OfferWithLandings extends Offer {
  landings: Landing[]
}

export interface LandingWithOffer extends Landing {
  offer: Offer
}

export interface AuditLogWithActor extends AuditLog {
  actor: AppUser | null
}

// Типы для форм
export interface OfferFormData {
  vertical: string
  title: string
  priceUsd: number
  geo: string[]
  tags: string[]
  status: OfferStatus
  imageUrl: string
}

export interface LandingFormData {
  extId?: number
  label: string
  type: LandingType
  locale: string
  networkCode?: string
  url: string
  notes?: string
}

// Типы для фильтров
export interface OffersFilter {
  search?: string
  status?: OfferStatus
  geo?: string
  vertical?: string
  tag?: string
  locale?: string
  partner?: string
}

// Типы для NextAuth
export interface User {
  id: string
  email: string
  displayName: string
  role: 'user' | 'admin'
}

// Справочники
export const GEO_OPTIONS = [
  'US', 'CA', 'UK', 'AU', 'DE', 'FR', 'ES', 'IT', 'NL', 'SE', 'NO', 'DK', 'FI',
  'BR', 'MX', 'AR', 'CL', 'CO', 'PE', 'JP', 'KR', 'SG', 'MY', 'TH', 'PH', 'IN'
] as const

export const LOCALE_OPTIONS = [
  'EN', 'ES', 'FR', 'DE', 'IT', 'PT', 'RU', 'JA', 'KO', 'ZH', 'AR', 'HI', 'JB'
] as const

export const PARTNER_OPTIONS = [
  'JL', 'EL', 'ER', 'TS', 'MW', 'AF', 'CJ', 'SH'
] as const

export const VERTICAL_OPTIONS = [
  'Male Enhancement', 'Health', 'Beauty', 'Weight Loss', 'Crypto', 'Finance', 'Dating', 'CBD', 'Nutra', 'Sweepstakes'
] as const

export const OFFER_TYPE_OPTIONS = [
  'Trial', 'SS', 'CPS', 'Private', 'NEW', 'HOT', 'BEST', 'TOP', 'SALE', 'Premium'
] as const

// Для обратной совместимости
export const TAG_OPTIONS = OFFER_TYPE_OPTIONS
