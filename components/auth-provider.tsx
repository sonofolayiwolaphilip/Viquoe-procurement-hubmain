"use client"

import type React from "react"
import { SessionProvider, useSession } from "next-auth/react"
import type { Session } from "next-auth"

interface AuthProviderProps {
  children: React.ReactNode
  session?: Session | null
}

export function AuthProvider({ children, session }: AuthProviderProps) {
  return <SessionProvider session={session}>{children}</SessionProvider>
}

export function useAuth() {
  const { data: session, status } = useSession()

  return {
    user: session?.user,
    isAuthenticated: !!session?.user,
    isLoading: status === "loading",
    session,
  }
}
