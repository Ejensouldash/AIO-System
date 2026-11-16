import { PrismaClient, Role } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'

dotenv.config({ path: '.env' })

const connectionString = process.env.DATABASE_URL || ''
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding pristine AIO System database...')

  // 1. Seed Operational Branches
  const rantau = await prisma.branch.upsert({
    where: { id: 'branch-rantau' },
    update: {},
    create: { id: 'branch-rantau', name: 'Operations Plant Rantau', location: 'Rantau, Negeri Sembilan' },
  })

  const pedas = await prisma.branch.upsert({
    where: { id: 'branch-pedas' },
    update: {},
    create: { id: 'branch-pedas', name: 'Packaging Plant Pedas', location: 'Pedas, Negeri Sembilan' },
  })

  const hq = await prisma.branch.upsert({
    where: { id: 'branch-hq' },
    update: {},
    create: { id: 'branch-hq', name: 'Headquarters', location: 'Kuala Lumpur' },
  })

  // 2. Seed Operational Units
  const unitSales = await prisma.unit.upsert({
    where: { id: 'unit-sales' },
    update: {},
    create: { id: 'unit-sales', name: 'Sales Ordering', branchId: rantau.id },
  })

  const unitProduction = await prisma.unit.upsert({
    where: { id: 'unit-production' },
    update: {},
    create: { id: 'unit-production', name: 'Production', branchId: rantau.id },
  })

  const unitWarehouse = await prisma.unit.upsert({
    where: { id: 'unit-warehouse' },
    update: {},
    create: { id: 'unit-warehouse', name: 'Warehouse & Logistics', branchId: rantau.id },
  })

  // 3. Seed System Settings
  await prisma.setting.upsert({
    where: { key: 'SYSTEM_NAME' },
    update: { value: 'AIO System' },
    create: { key: 'SYSTEM_NAME', value: 'AIO System' },
  })

  // 4. Seed Default SuperAdmin Account
  const allPermissions = [
    'DASHBOARD',
    'SALES_ORDERING',
    'SALES_ORDERING_CUSTOMERS_MANAGE',
    'SALES_ORDERING_DOCUMENT_MANAGE',
    'SALES_ORDERING_CREDIT_CHECK',
    'SALES_ORDERING_ORDERS',
    'FORMS',
    'PRODUCTION_STOCK',
    'HANDOVER',
    'TRANSFER_IN_HISTORY',
    'WAREHOUSE',
    'GATEPASS_REQUESTER',
    'WAREHOUSE_GATEPASS',
    'SECURITY_GATEPASS',
    'PALLET_LEDGER',
    'RAW_MATERIAL_WITHDRAWAL',
    'USERS',
    'SETTINGS',
  ]

  const adminHashedPassword = await bcrypt.hash('Admin@aio2026!', 10)
  const adminSimpleHashedPassword = await bcrypt.hash('Admin@123456', 10)

  // Seed admin@aiosystem.com
  await prisma.user.upsert({
    where: { email: 'admin@aiosystem.com' },
    update: { password: adminSimpleHashedPassword, role: Role.SUPERADMIN, modules: allPermissions },
    create: {
      email: 'admin@aiosystem.com',
      name: 'System Administrator',
      password: adminSimpleHashedPassword,
      role: Role.SUPERADMIN,
      branchId: hq.id,
      unitId: unitSales.id,
      modules: allPermissions,
    },
  })

  // Seed admin@aio-system.local
  await prisma.user.upsert({
    where: { email: 'admin@aio-system.local' },
    update: { password: adminHashedPassword, role: Role.SUPERADMIN, modules: allPermissions },
    create: {
      email: 'admin@aio-system.local',
      name: 'System Administrator (Local)',
      password: adminHashedPassword,
      role: Role.SUPERADMIN,
      branchId: hq.id,
      unitId: unitSales.id,
      modules: allPermissions,
    },
  })

  // 5. Seed Default Security Guard Account (for Gatepass QR scanner)
  const securityHashedPassword = await bcrypt.hash('Security@aio2026!', 10)
  await prisma.user.upsert({
    where: { email: 'security@aio-system.local' },
    update: { password: securityHashedPassword, role: Role.STAFF, modules: ['SECURITY_GATEPASS'] },
    create: {
      email: 'security@aio-system.local',
      name: 'Main Gate Security Guard',
      password: securityHashedPassword,
      role: Role.STAFF,
      branchId: rantau.id,
      unitId: unitWarehouse.id,
      modules: ['SECURITY_GATEPASS'],
    },
  })

  console.log('Seed completed successfully.')
  console.log('Default SuperAdmin: admin@aio-system.local / Admin@aio2026!')
  console.log('Default Security Guard: security@aio-system.local / Security@aio2026!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
