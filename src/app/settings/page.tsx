export const dynamic = "force-dynamic"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { SettingsLayoutClient } from "./SettingsLayoutClient"

export default async function SettingsPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const isSuperAdmin = session.user.role === "SUPERADMIN"

  // Fetch current user details
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, include: { unit: true } })
  if (!user) redirect("/login")

  const isTrueSuperAdmin = user.role === "SUPERADMIN"

  // Fetch global settings (SuperAdmin only to prevent leaking sensitive keys to non-admin client props)
  let settingsMap: Record<string, string> = {}
  if (isSuperAdmin) {
    const settingsList = await prisma.setting.findMany()
    settingsList.forEach(s => { settingsMap[s.key] = s.value })
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-gray-900">User Settings</h1>
        <p className="text-sm text-gray-500 mt-1 font-medium">Manage your personal profile and account credentials.</p>
      </div>

      <SettingsLayoutClient
        user={user}
        settingsMap={settingsMap}
        isSuperAdmin={isSuperAdmin}
        isTrueSuperAdmin={isTrueSuperAdmin}
      />
    </div>
  )
}
