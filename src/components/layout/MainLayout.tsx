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

  return (
    <MobileLayoutWrapper
      role={freshUser.role}
      user={freshUser}
    >
      {children}
    </MobileLayoutWrapper>
  )
}
