import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  const dbUrl = process.env.DATABASE_URL || 'file:./dev.db'
  const isPostgres =
    dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://')

  if (isPostgres) {
    // Production / Neon / Supabase — use @prisma/adapter-pg
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Pool } = require('pg')
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaPg } = require('@prisma/adapter-pg')
    const pool = new Pool({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } })
    const adapter = new PrismaPg(pool)
    return new PrismaClient({ adapter })
  } else {
    // Local dev — use better-sqlite3 adapter
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3')
    const adapter = new PrismaBetterSqlite3({ url: dbUrl })
    return new PrismaClient({ adapter })
  }
}

let prismaClient: PrismaClient

if (process.env.NODE_ENV === 'production') {
  prismaClient = createPrismaClient()
} else {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient()
  }
  prismaClient = globalForPrisma.prisma

  // Auto-seed if the local database is empty
  prismaClient.user
    .count()
    .then((count) => {
      if (count === 0) {
        console.log('⚠️  Database is empty. Auto-seeding...')
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { exec } = require('child_process')
        exec('pnpm prisma db seed', (error: Error | null, stdout: string) => {
          if (error) {
            console.error(`❌ Auto-seeding failed: ${error.message}`)
            return
          }
          console.log(`✅ Auto-seeding success:\n${stdout}`)
        })
      }
    })
    .catch((err: Error) => {
      console.warn('⚠️  Could not check user count for auto-seeding:', err.message)
    })
}

export const db = prismaClient
export type { PrismaClient } from '@prisma/client'
