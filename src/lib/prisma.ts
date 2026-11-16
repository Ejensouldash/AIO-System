import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from "@prisma/client"
import dotenv from 'dotenv'

dotenv.config({ path: '.env', override: true })

let connectionString = process.env.DATABASE_URL || ""

if (connectionString.includes("pooler.supabase.com")) {
  connectionString = connectionString.replace(":5432/", ":6543/")
  
  if (!connectionString.includes("pgbouncer=true")) {
    connectionString += connectionString.includes("?") ? "&pgbouncer=true" : "?pgbouncer=true"
  }
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

function createPrismaClient(): PrismaClient {
  const isProd = process.env.NODE_ENV === 'production'
  const pool = new Pool({ 
    connectionString, 
    max: isProd ? 2 : 5,
    idleTimeoutMillis: isProd ? 3000 : 10000, 
    connectionTimeoutMillis: 5000 
  })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
