"use client"

import { useSession } from "next-auth/react"
import type { UserRole } from "@prisma/client"

export function useAuth() {
  const { data: session, status } = useSession()

  return {
    user: session?.user,
    isAuthenticated: !!session,
    isLoading: status === "loading",
    hasRole: (role: UserRole) => session?.user?.role === role,
    hasAnyRole: (roles: UserRole[]) => roles.includes(session?.user?.role as UserRole),
  }
}
