import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const testDomains = [
  'example1.com',
  'example2.com', 
  'example3.com',
  'testdomain.net',
  'mydomain.org',
  'sample-site.com',
  'demo-domain.net',
  'test-website.org'
]

async function seedDomains() {
  try {
    console.log('🌱 Seeding domains...')
    
    for (const domain of testDomains) {
      const existingDomain = await prisma.domain.findUnique({
        where: { domain }
      })
      
      if (!existingDomain) {
        await prisma.domain.create({
          data: { domain }
        })
        console.log(`✅ Created domain: ${domain}`)
      } else {
        console.log(`⏭️  Domain already exists: ${domain}`)
      }
    }
    
    const totalDomains = await prisma.domain.count()
    console.log(`\n🎉 Seeding completed! Total domains: ${totalDomains}`)
    
  } catch (error) {
    console.error('❌ Error seeding domains:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run if called directly
if (require.main === module) {
  seedDomains()
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

export { seedDomains }
