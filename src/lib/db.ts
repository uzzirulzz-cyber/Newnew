import { PrismaClient } from '@prisma/client'

// MongoDB Atlas connection — hardcoded to prevent the container's
// DATABASE_URL env var (file:./dev.db SQLite) from overriding .env
const MONGODB_URL = "mongodb+srv://max11:n3lSs2xcyaCSGH9O@playbeat.umqpdyx.mongodb.net/playbeat?retryWrites=true&w=majority&appName=playbeat"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Force the correct MongoDB URL — ignore any container env override
process.env.DATABASE_URL = MONGODB_URL

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error'],
    datasources: {
      db: {
        url: MONGODB_URL,
      },
    },
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
