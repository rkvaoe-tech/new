import { seedReferences } from '../src/lib/seed-references'

async function main() {
  try {
    await seedReferences()
    process.exit(0)
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}

main()
