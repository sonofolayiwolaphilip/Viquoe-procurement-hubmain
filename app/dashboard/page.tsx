"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { UserRole } from "@prisma/client"

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return

    if (!session) {
      router.push("/auth/signin")
      return
    }

    // Redirect to appropriate dashboard based on role
    switch (session.user.role) {
      case UserRole.ADMIN:
        router.push("/admin")
        break
      case UserRole.FINANCE:
        router.push("/finance")
        break
      case UserRole.SUPPLIER:
        router.push("/supplier")
        break
      case UserRole.BUYER:
      default:
        router.push("/buyer")
        break
    }
  }, [session, status, router])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return null
}
