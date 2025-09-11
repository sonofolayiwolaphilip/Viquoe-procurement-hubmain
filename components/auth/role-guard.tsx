"use client"

import type React from "react"

import { useSession } from "next-auth/react"
import type { UserRole } from "@prisma/client"

interface RoleGuardProps {
  children: React.ReactNode
  allowedRoles: UserRole[]
  fallback?: React.ReactNode
}

export function RoleGuard({ children, allowedRoles, fallback = null }: RoleGuardProps) {
  const { data: session } = useSession()

  if (!session || !allowedRoles.includes(session.user.role)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
