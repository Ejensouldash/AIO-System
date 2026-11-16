import { cache } from "react"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

// Dedupes auth() across every call within a single request's render tree.
export const getSession = cache(async () => auth())

export const FORM_MODULES = [
  "FORMS",
  "PRODUCTION_STOCK",
  "HANDOVER",
  "TRANSFER_IN_HISTORY",
  "WAREHOUSE",
  "GATEPASS_REQUESTER",
  "WAREHOUSE_GATEPASS",
  "SECURITY_GATEPASS",
  "PALLET_LEDGER",
  "RAW_MATERIAL_WITHDRAWAL",
  "SALES_ORDERING",
  "SALES_ORDERING_DASHBOARD",
  "SALES_ORDERING_CUSTOMERS",
  "SALES_ORDERING_DOCUMENTS",
  "SALES_ORDERING_INTAKE",
  "SALES_ORDERING_CREDIT_CHECK",
  "SALES_ORDERING_ORDERS",
  "SALES_ORDERING_CUSTOMERS_MANAGE",
  "SALES_ORDERING_DOCUMENT_MANAGE",
]

export const WAREHOUSE_MODULES = [
  "WAREHOUSE",
  "GATEPASS_REQUESTER",
  "WAREHOUSE_GATEPASS",
  "SECURITY_GATEPASS",
  "PALLET_LEDGER",
  "RAW_MATERIAL_WITHDRAWAL",
]

export const SOD_MODULES = [
  "SALES_ORDERING",
  "SALES_ORDERING_DASHBOARD",
  "SALES_ORDERING_CUSTOMERS",
  "SALES_ORDERING_DOCUMENTS",
  "SALES_ORDERING_INTAKE",
  "SALES_ORDERING_CREDIT_CHECK",
  "SALES_ORDERING_ORDERS",
  "SALES_ORDERING_CUSTOMERS_MANAGE",
  "SALES_ORDERING_DOCUMENT_MANAGE",
]

export const PRODUCTION_MODULES = [
  "FORMS",
  "PRODUCTION_STOCK",
  "HANDOVER",
  "TRANSFER_IN_HISTORY",
]

export type AccessInfo = {
  userId: string
  role: string
  isSuperAdmin: boolean
  modules: string[]
  branchName: string | null
  unitId: string | null
  unitName: string | null
  name: string | null
  signatureUrl: string | null
}

export const getAccessInfo = cache(async (): Promise<AccessInfo | null> => {
  const session = await getSession()
  if (!session?.user?.id) return null

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      role: true,
      modules: true,
      unitId: true,
      signatureUrl: true,
      branch: { select: { name: true } },
      unit: { select: { name: true } },
    },
  })

  const isSuperAdmin =
    dbUser?.role === "SUPERADMIN" ||
    dbUser?.unit?.name === "Information Technology" ||
    session.user.role === "SUPERADMIN"

  return {
    userId: session.user.id,
    role: dbUser?.role || session.user.role,
    isSuperAdmin,
    modules: dbUser?.modules || [],
    branchName: dbUser?.branch?.name || (session.user as any).branchName || null,
    unitId: dbUser?.unitId || null,
    unitName: dbUser?.unit?.name || (session.user as any).unitName || null,
    name: dbUser?.name || session.user.name || null,
    signatureUrl: dbUser?.signatureUrl || null,
  }
})

export function hasAnyModule(access: AccessInfo, required: string[]): boolean {
  return access.isSuperAdmin || required.some(m => access.modules.includes(m))
}

export async function getUserModuleAccess(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, modules: true }
  })
  if (!user) return null

  const isSuperAdmin = user.role === "SUPERADMIN"
  const userModules = new Set(user.modules || [])

  return {
    isSuperAdmin,
    hasModule: (mod: string) => isSuperAdmin || userModules.has(mod),
    hasAnyModule: (mods: string[]) => isSuperAdmin || mods.some(m => userModules.has(m)),
  }
}
