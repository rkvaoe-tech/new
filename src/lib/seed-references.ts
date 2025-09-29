import { prisma } from './prisma'

export async function seedReferences() {
  try {
    // Вертикали
    const verticals = [
      { name: 'Male Enhancement', description: 'Мужское здоровье', order: 1 },
      { name: 'Health', description: 'Здоровье', order: 2 },
      { name: 'Beauty', description: 'Красота', order: 3 },
      { name: 'Weight Loss', description: 'Похудение', order: 4 },
      { name: 'Crypto', description: 'Криптовалюты', order: 5 },
      { name: 'Finance', description: 'Финансы', order: 6 },
      { name: 'Dating', description: 'Знакомства', order: 7 },
      { name: 'CBD', description: 'CBD продукты', order: 8 },
      { name: 'Nutra', description: 'Нутрицевтика', order: 9 },
      { name: 'Sweepstakes', description: 'Лотереи', order: 10 }
    ]

    for (const vertical of verticals) {
      await prisma.vertical.upsert({
        where: { name: vertical.name },
        update: vertical,
        create: vertical
      })
    }

    // Типы офферов
    const offerTypes = [
      { name: 'Trial', description: 'Пробная версия', order: 1 },
      { name: 'SS', description: 'Straight Sale', order: 2 },
      { name: 'CPS', description: 'Cost Per Sale', order: 3 },
      { name: 'Private', description: 'Приватный оффер', order: 4 },
      { name: 'NEW', description: 'Новый оффер', order: 5 },
      { name: 'HOT', description: 'Горячий оффер', order: 6 },
      { name: 'BEST', description: 'Лучший оффер', order: 7 },
      { name: 'TOP', description: 'Топовый оффер', order: 8 },
      { name: 'SALE', description: 'Распродажа', order: 9 },
      { name: 'Premium', description: 'Премиум оффер', order: 10 }
    ]

    for (const offerType of offerTypes) {
      await prisma.offerType.upsert({
        where: { name: offerType.name },
        update: offerType,
        create: offerType
      })
    }

    // Гео
    const geos = [
      { code: 'US', name: 'United States', order: 1 },
      { code: 'CA', name: 'Canada', order: 2 },
      { code: 'UK', name: 'United Kingdom', order: 3 },
      { code: 'AU', name: 'Australia', order: 4 },
      { code: 'DE', name: 'Germany', order: 5 },
      { code: 'FR', name: 'France', order: 6 },
      { code: 'ES', name: 'Spain', order: 7 },
      { code: 'IT', name: 'Italy', order: 8 },
      { code: 'NL', name: 'Netherlands', order: 9 },
      { code: 'SE', name: 'Sweden', order: 10 },
      { code: 'NO', name: 'Norway', order: 11 },
      { code: 'DK', name: 'Denmark', order: 12 },
      { code: 'FI', name: 'Finland', order: 13 },
      { code: 'BR', name: 'Brazil', order: 14 },
      { code: 'MX', name: 'Mexico', order: 15 },
      { code: 'AR', name: 'Argentina', order: 16 },
      { code: 'CL', name: 'Chile', order: 17 },
      { code: 'CO', name: 'Colombia', order: 18 },
      { code: 'PE', name: 'Peru', order: 19 },
      { code: 'JP', name: 'Japan', order: 20 },
      { code: 'KR', name: 'South Korea', order: 21 },
      { code: 'SG', name: 'Singapore', order: 22 },
      { code: 'MY', name: 'Malaysia', order: 23 },
      { code: 'TH', name: 'Thailand', order: 24 },
      { code: 'PH', name: 'Philippines', order: 25 },
      { code: 'IN', name: 'India', order: 26 }
    ]

    for (const geo of geos) {
      await prisma.geo.upsert({
        where: { code: geo.code },
        update: geo,
        create: geo
      })
    }

    // Языки
    const languages = [
      { code: 'EN', name: 'English', order: 1 },
      { code: 'ES', name: 'Spanish', order: 2 },
      { code: 'FR', name: 'French', order: 3 },
      { code: 'DE', name: 'German', order: 4 },
      { code: 'IT', name: 'Italian', order: 5 },
      { code: 'PT', name: 'Portuguese', order: 6 },
      { code: 'RU', name: 'Russian', order: 7 },
      { code: 'JA', name: 'Japanese', order: 8 },
      { code: 'KO', name: 'Korean', order: 9 },
      { code: 'ZH', name: 'Chinese', order: 10 },
      { code: 'AR', name: 'Arabic', order: 11 },
      { code: 'HI', name: 'Hindi', order: 12 },
      { code: 'JB', name: 'Japanese (Beta)', order: 13 }
    ]

    for (const language of languages) {
      await prisma.language.upsert({
        where: { code: language.code },
        update: language,
        create: language
      })
    }

    // Партнеры
    const partners = [
      { code: 'JL', name: 'JumpLead', order: 1 },
      { code: 'EL', name: 'EverLead', order: 2 },
      { code: 'ER', name: 'EverReach', order: 3 },
      { code: 'TS', name: 'TrafficStars', order: 4 },
      { code: 'MW', name: 'MediaWave', order: 5 },
      { code: 'AF', name: 'AffiliateForce', order: 6 },
      { code: 'CJ', name: 'Commission Junction', order: 7 },
      { code: 'SH', name: 'ShareASale', order: 8 }
    ]

    for (const partner of partners) {
      await prisma.partner.upsert({
        where: { code: partner.code },
        update: partner,
        create: partner
      })
    }

    console.log('✅ Справочники успешно заполнены')
  } catch (error) {
    console.error('❌ Ошибка при заполнении справочников:', error)
    throw error
  }
}
