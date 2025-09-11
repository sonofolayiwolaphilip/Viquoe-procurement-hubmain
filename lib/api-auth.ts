import { getServerSession } from "next-auth/next"
import { authOptions } from "./auth"
import type { UserRole } from "@prisma/client"
import { NextResponse } from "next/server"

export async function getAuthenticatedUser() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return null
  }
  return session.user
}

export async function requireAuth() {
  const user = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  return user
}

export async function requireRole(allowedRoles: UserRole[]) {
  const user = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (!allowedRoles.includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  return user
}
