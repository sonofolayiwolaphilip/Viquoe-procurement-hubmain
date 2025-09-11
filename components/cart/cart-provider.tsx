"use client"

import type React from "react"

import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { useCartStore } from "@/lib/store/cart-store"

interface CartProviderProps {
  children: React.ReactNode
}

export function CartProvider({ children }: CartProviderProps) {
  const { data: session, status } = useSession()
  const syncWithServer = useCartStore((state) => state.syncWithServer)
  const clearCart = useCartStore((state) => state.clearCart)

  useEffect(() => {
    if (status === "loading") return

    if (session) {
      // User is authenticated, sync with server
      syncWithServer()
    } else {
      // User is not authenticated, clear cart
      clearCart()
    }
  }, [session, status, syncWithServer, clearCart])

  return <>{children}</>
}
