"use client"

import type React from "react"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import type { UserRole } from "@prisma/client"

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
  redirectTo?: string
}

export function ProtectedRoute({ children, allowedRoles, redirectTo = "/auth/signin" }: ProtectedRouteProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return // Still loading

    if (!session) {
      router.push(redirectTo)
      return
    }

    if (allowedRoles && !allowedRoles.includes(session.user.role)) {
      router.push("/unauthorized")
      return
    }
  }, [session, status, router, allowedRoles, redirectTo])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  if (allowedRoles && !allowedRoles.includes(session.user.role)) {
    return null
  }

  return <>{children}</>
}
