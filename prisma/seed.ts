import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Начинаем наполнение базы данных...')

  // Создаем пользователей
  const adminUser = await prisma.appUser.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      displayName: 'Admin',
      role: 'admin',
    },
  })

  const regularUser = await prisma.appUser.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      displayName: 'Viewer',
      role: 'user',
    },
  })

  console.log('✅ Пользователи созданы')

  // Создаем тестовые офферы
  const offer1 = await prisma.offer.create({
    data: {
      vertical: 'Male Enhancement',
      title: 'Proliving',
      priceUsd: 44,
      geo: ['US'],
      tags: ['SS', 'NEW'],
      status: 'ACTIVE',
      imageUrl: 'https://cdn.example.com/offers/proliving.png',
      order: 10,
    },
  })

  const offer2 = await prisma.offer.create({
    data: {
      vertical: 'Male Enhancement',
      title: 'Titan Surge',
      priceUsd: 149,
      geo: ['US', 'CA'],
      tags: ['CPS', 'Private'],
      status: 'PAUSED',
      imageUrl: 'https://cdn.example.com/offers/titan-surge.png',
      order: 20,
    },
  })

  const offer3 = await prisma.offer.create({
    data: {
      vertical: 'Health',
      title: 'Vydox',
      priceUsd: 69,
      geo: ['US'],
      tags: ['CPS'],
      status: 'ACTIVE',
      imageUrl: 'https://cdn.example.com/offers/vydox.png',
      order: 30,
    },
  })

  console.log('✅ Офферы созданы')

  // Создаем лендинги для Proliving
  await prisma.landing.create({
    data: {
      offerId: offer1.id,
      extId: 188,
      label: 'Default',
      type: 'LANDING',
      locale: 'EN',
      networkCode: 'JL',
      url: 'https://example.com/landing/188',
      order: 1,
    },
  })

  await prisma.landing.createMany({
    data: [
      {
        offerId: offer1.id,
        extId: 274,
        label: 'Reddit barbara + quiz',
        type: 'PRELANDING',
        locale: 'ES',
        networkCode: 'JL',
        url: 'https://example.com/pre/274',
        order: 1,
      },
      {
        offerId: offer1.id,
        extId: 275,
        label: 'Reddit barbara + quiz',
        type: 'PRELANDING',
        locale: 'EN',
        networkCode: 'JL',
        url: 'https://example.com/pre/275',
        order: 2,
      },
    ],
  })

  // Создаем лендинги для Titan Surge
  await prisma.landing.createMany({
    data: [
      {
        offerId: offer2.id,
        extId: 501,
        label: 'Default',
        type: 'LANDING',
        locale: 'EN',
        networkCode: 'EL',
        url: 'https://example.com/ts/landing/501',
        order: 1,
      },
      {
        offerId: offer2.id,
        extId: 901,
        label: 'Quiz v2',
        type: 'PRELANDING',
        locale: 'EN',
        networkCode: 'EL',
        url: 'https://example.com/ts/pre/901',
        order: 1,
      },
    ],
  })

  // Создаем лендинги для Vydox
  await prisma.landing.create({
    data: {
      offerId: offer3.id,
      extId: 310,
      label: 'Default',
      type: 'LANDING',
      locale: 'EN',
      networkCode: 'ER',
      url: 'https://example.com/vy/landing/310',
      order: 1,
    },
  })

  console.log('✅ Лендинги созданы')
  console.log('🎉 Наполнение базы данных завершено!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
