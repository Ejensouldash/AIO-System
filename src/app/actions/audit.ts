"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

/**
 * Logs a user action into the AuditLog table.
 */
export async function logUserAction(action: string, details?: string) {
  try {
    const session = await auth()
    if (!session || !session.user) return

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userName: session.user.name || "Unknown User",
        action,
        details
      }
    })
  } catch (error) {
    console.error("Failed to log user action:", error)
  }
}

/**
 * Fetches recent audit logs.
 */
export async function getAuditLogs(page: number = 1, pageSize: number = 50, userId?: string) {
  try {
    const session = await auth()
    if (!session) return { success: false, error: "Unauthorized" }

    const skip = (page - 1) * pageSize
    const whereClause = userId ? { userId } : {}
    
    const [logs, totalCount] = await Promise.all([
      prisma.auditLog.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize
      }),
      prisma.auditLog.count({ where: whereClause })
    ])

    return { 
      success: true, 
      data: logs,
      totalPages: Math.ceil(totalCount / pageSize),
      totalCount
    }
  } catch (error: any) {
    console.error("Failed to fetch audit logs:", error)
    return { success: false, data: [], totalPages: 0 }
  }
}
