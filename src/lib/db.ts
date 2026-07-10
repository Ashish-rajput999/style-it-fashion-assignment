import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

let prismaClient: PrismaClient

// Default to sqlite file relative to current working directory
const dbUrl = process.env.DATABASE_URL || 'file:./prisma/dev.db'

if (process.env.NODE_ENV === 'production') {
  const adapter = new PrismaBetterSqlite3({ url: dbUrl })
  prismaClient = new PrismaClient({ adapter })
} else {
  if (!globalForPrisma.prisma) {
    const adapter = new PrismaBetterSqlite3({ url: dbUrl })
    globalForPrisma.prisma = new PrismaClient({ adapter })
  }
  prismaClient = globalForPrisma.prisma
}

export const db = prismaClient
export type { PrismaClient } from '@prisma/client'
