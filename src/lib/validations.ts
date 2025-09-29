import { z } from 'zod'
import { OfferStatus, LandingType } from '@prisma/client'

export const offerSchema = z.object({
  vertical: z.string().min(1, 'Вертикаль обязательна'),
  title: z.string().min(1, 'Название обязательно'),
  priceUsd: z.number().min(0, 'Цена должна быть больше или равна 0'),
  geo: z.array(z.string()),
  tags: z.array(z.string()),
  status: z.nativeEnum(OfferStatus),
  imageUrl: z.string().optional(),
})

export const offerUpdateSchema = offerSchema.partial()

export const landingSchema = z.object({
  extId: z.number().optional(),
  label: z.string().min(1, 'Название обязательно'),
  type: z.nativeEnum(LandingType),
  locale: z.string().min(2, 'Локаль должна быть минимум 2 символа').max(6, 'Локаль должна быть максимум 6 символов'),
  networkCode: z.string().regex(/^[A-Z0-9]{2,6}$/, 'Код партнера должен быть 2-6 символов в верхнем регистре').optional(),
  url: z.string().url('URL должен быть валидным').refine((url) => url.startsWith('https://'), 'URL должен начинаться с https://'),
  notes: z.string().optional(),
})

export const landingUpdateSchema = landingSchema.partial()

export const offersFilterSchema = z.object({
  search: z.string().optional(),
  status: z.nativeEnum(OfferStatus).optional(),
  geo: z.string().optional(),
  tag: z.string().optional(),
  locale: z.string().optional(),
  partner: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
})

export const reorderSchema = z.object({
  items: z.array(z.object({
    id: z.string(),
    order: z.number(),
  })),
})
