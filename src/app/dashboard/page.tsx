import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { SupplyChainControlTower } from "@/components/dashboard/SupplyChainControlTower"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  // Query all three operational stages in parallel with resilience against cold-start empty DB
  const [
    activeCustomers,
    pendingIntakes,
    creditReviewsOnHold,
    confirmedOrders,
    todayReports,
    quarantineHoldCount,
    pendingHandovers,
    inventoryBatches,
    inTransitDOs,
    scheduledGatepasses,
  ] = await Promise.all([
    // Stage 1: Demand
    prisma.customer.count().catch(() => 0),
    prisma.salesDocumentIntake.count({ where: { status: { in: ["UPLOADED", "PENDING"] } } }).catch(() => 0),
    prisma.creditCheckCase.count({ where: { status: { in: ["ON_HOLD", "UPLOADED"] } } }).catch(() => 0),
    prisma.salesOrder.count({ where: { status: { not: "DRAFT" } } }).catch(() => 0),

    // Stage 2: Production
    prisma.dailyReport.findMany({
      where: { date: { gte: todayStart } },
      select: {
        productions: { select: { totalBox: true } },
      },
    }).catch(() => []),
    prisma.productionHoldItem.count({ where: { status: "PENDING" } }).catch(() => 0),
    prisma.productionHandover.count({ where: { status: "PENDING" } }).catch(() => 0),

    // Stage 3: Warehouse
    prisma.inventoryBatch.findMany({
      select: { availableBalance: true },
    }).catch(() => []),
    prisma.distributionOrder.count({ where: { status: "SHIPPED" } }).catch(() => 0),
    prisma.warehouseGatePass.count({
      where: { status: { in: ["READY_FOR_PICKUP", "CHECKED_IN", "LOADING"] } },
    }).catch(() => 0),
  ])

  const todayCartons = todayReports.reduce((acc, rep) => {
    return acc + rep.productions.reduce((pAcc, p) => pAcc + (p.totalBox || 0), 0)
  }, 0)

  const totalAvailableUnits = inventoryBatches.reduce((acc, b) => acc + (b.availableBalance || 0), 0)

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      <SupplyChainControlTower
        demandMetrics={{
          activeCustomers,
          pendingIntakes,
          creditReviewsOnHold,
          confirmedOrders,
        }}
        productionMetrics={{
          todayCartons,
          activeReportsCount: todayReports.length,
          quarantineHoldCount,
          pendingHandovers,
        }}
        warehouseMetrics={{
          totalAvailableUnits,
          inTransitDOs,
          scheduledGatepasses,
          activeBatchesCount: inventoryBatches.length,
        }}
      />
    </div>
  )
}
