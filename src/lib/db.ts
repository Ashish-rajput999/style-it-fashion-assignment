import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

let prismaClient: PrismaClient

// Default to sqlite file relative to current working directory
const dbUrl = process.env.DATABASE_URL || 'file:./dev.db'

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

// Auto-seed if the database is empty in non-production environments
if (process.env.NODE_ENV !== 'production') {
  prismaClient.user.count()
    .then((count) => {
      if (count === 0) {
        console.log('⚠️ Database is empty. Auto-seeding database...')
        const { exec } = require('child_process')
        exec('pnpm prisma db seed', (error: any, stdout: any, stderr: any) => {
          if (error) {
            console.error(`❌ Auto-seeding failed: ${error.message}`)
            return
          }
          console.log(`✅ Auto-seeding success:\n${stdout}`)
        })
      }
    })
    .catch((err) => {
      console.warn('⚠️ Could not check user count for auto-seeding:', err.message)
    })
}

export const db = prismaClient
export type { PrismaClient } from '@prisma/client'
