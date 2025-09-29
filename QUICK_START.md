# 🚀 Быстрый старт

Если у вас нет PostgreSQL или вы хотите быстро посмотреть на интерфейс, можно запустить проект с SQLite:

## 1. Измените DATABASE_URL в .env.local

\`\`\`env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-secret-key-change-this-in-production"
NEXTAUTH_URL="http://localhost:3000"
\`\`\`

## 2. Обновите Prisma схему

В \`prisma/schema.prisma\` замените:

\`\`\`prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
\`\`\`

на:

\`\`\`prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
\`\`\`

## 3. Запустите команды

\`\`\`bash
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
\`\`\`

## 4. Откройте http://localhost:3000

Используйте тестовые аккаунты:
- **Admin**: admin@example.com / admin
- **User**: user@example.com / user

---

**Примечание**: Для production обязательно используйте PostgreSQL как указано в основном README.md
