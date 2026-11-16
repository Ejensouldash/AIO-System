import type { NextAuthConfig } from "next-auth"

const AUTH_SESSION_VERSION = process.env.AUTH_SESSION_VERSION || "v1_aio_system"
const baseSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "aio-system-super-secret-key-replace-in-production-32-chars"

export const authConfig = {
  secret: `${baseSecret}_${AUTH_SESSION_VERSION}`,
  trustHost: true,
  providers: [],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.unitId = user.unitId
        token.branchId = user.branchId
        token.branchName = (user as any).branchName
        token.unitName = (user as any).unitName
        token.modules = (user as any).modules
        token.signatureUrl = (user as any).signatureUrl
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.unitId = token.unitId as string | null
        session.user.branchId = token.branchId as string | null
        ;(session.user as any).branchName = token.branchName as string | null
        ;(session.user as any).unitName = token.unitName as string | null
        ;(session.user as any).modules = (token.modules as string[]) || []
        ;(session.user as any).signatureUrl = (token.signatureUrl as string) || null
      }
      return session
    }
  },
  session: { strategy: "jwt" }
} satisfies NextAuthConfig
