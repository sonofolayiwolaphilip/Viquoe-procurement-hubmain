"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart } from "lucide-react"
import { useCartStore } from "@/lib/store/cart-store"
import Link from "next/link"

export function CartButton() {
  const { getTotalItems } = useCartStore()
  const totalItems = getTotalItems()

  return (
    <Button variant="outline" size="sm" className="relative bg-transparent" asChild>
      <Link href="/cart">
        <ShoppingCart className="h-4 w-4" />
        {totalItems > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
          >
            {totalItems > 99 ? "99+" : totalItems}
          </Badge>
        )}
        <span className="sr-only">Cart ({totalItems} items)</span>
      </Link>
    </Button>
  )
}
