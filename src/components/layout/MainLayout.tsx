import { MobileLayoutWrapper } from "./MobileLayoutWrapper"
import { getSession } from "@/lib/access"
import { prisma } from "@/lib/prisma"

export async function MainLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()

  if (!session) {
    return <>{children}</>
  }

  // Fetch live modules and role from database to prevent stale JWT snapshots
  const liveUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, role: true, modules: true }
  })

  const freshUser = {
    ...session.user,
    role: liveUser?.role || session.user.role,
    modules: liveUser?.modules || (session.user as any).modules || [],
    name: liveUser?.name || session.user.name,
  }

  const isWarehouseStaff =
    freshUser.role === "SUPERADMIN" ||
    (Array.isArray(freshUser.modules) && freshUser.modules.includes("WAREHOUSE"))

  let incomingSalesOrders: Array<{
    id: string
    internalSoNo: string
    customerName: string
    poNumber: string | null
    totalCartons: number
    submittedAt: string
  }> = []

  if (isWarehouseStaff) {
    try {
      const orders = await prisma.salesOrder.findMany({
        where: {
          submittedToWarehouseAt: { not: null },
          status: "SUBMITTED_TO_WAREHOUSE",
        },
        include: {
          customer: { select: { legalName: true } },
          items: { select: { qtyOrdered: true } },
        },
        orderBy: { submittedToWarehouseAt: "desc" },
        take: 15,
      })

      incomingSalesOrders = orders.map((o) => ({
        id: o.id,
        internalSoNo: o.internalSoNo,
        customerName: o.customer?.legalName || "Unknown Customer",
        poNumber: o.poNumber || null,
        totalCartons: o.items.reduce((sum, item) => sum + Number(item.qtyOrdered || 0), 0),
        submittedAt: o.submittedToWarehouseAt ? o.submittedToWarehouseAt.toISOString() : o.createdAt.toISOString(),
      }))
    } catch (err) {
      console.warn("Failed to query incoming warehouse sales orders:", err)
    }
  }

  return (
    <MobileLayoutWrapper
      role={freshUser.role}
      user={freshUser}
      incomingSalesOrders={incomingSalesOrders}
    >
      {children}
    </MobileLayoutWrapper>
  )
}
