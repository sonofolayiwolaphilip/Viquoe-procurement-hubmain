"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Minus, ShoppingCart } from "lucide-react"
import { useCartStore } from "@/lib/store/cart-store"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface Product {
  id: string
  name: string
  price: number
  sku: string
  image?: string
  stock: number
  supplier: {
    id: string
    name: string
    company?: string
  }
}

interface AddToCartButtonProps {
  product: Product
  variant?: "default" | "outline" | "secondary"
  size?: "sm" | "default" | "lg"
  showQuantitySelector?: boolean
}

export function AddToCartButton({
  product,
  variant = "default",
  size = "default",
  showQuantitySelector = true,
}: AddToCartButtonProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [quantity, setQuantity] = useState(1)
  const { addItem, isLoading, getItemByProductId } = useCartStore()

  const existingItem = getItemByProductId(product.id)
  const currentQuantityInCart = existingItem?.quantity || 0

  const handleAddToCart = async () => {
    if (!session) {
      toast.error("Please sign in to add items to cart")
      router.push("/auth/signin")
      return
    }

    if (currentQuantityInCart + quantity > product.stock) {
      toast.error(`Only ${product.stock - currentQuantityInCart} items available`)
      return
    }

    try {
      await addItem({
        id: "", // Will be set by server
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        sku: product.sku,
        supplier: product.supplier,
        stock: product.stock,
        quantity,
      })

      toast.success(`Added ${quantity} ${product.name} to cart`)
      setQuantity(1) // Reset quantity after successful add
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add to cart")
    }
  }

  const incrementQuantity = () => {
    if (currentQuantityInCart + quantity < product.stock) {
      setQuantity(quantity + 1)
    }
  }

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1)
    }
  }

  const isOutOfStock = product.stock === 0
  const isMaxQuantity = currentQuantityInCart + quantity >= product.stock

  if (isOutOfStock) {
    return (
      <Button variant="outline" size={size} disabled>
        Out of Stock
      </Button>
    )
  }

  return (
    <div className="space-y-3">
      {showQuantitySelector && (
        <div className="flex items-center space-x-2">
          <Label htmlFor="quantity" className="text-sm font-medium">
            Quantity:
          </Label>
          <div className="flex items-center space-x-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={decrementQuantity}
              disabled={quantity <= 1}
              className="h-8 w-8 p-0 bg-transparent"
            >
              <Minus className="h-3 w-3" />
            </Button>
            <Input
              id="quantity"
              type="number"
              min="1"
              max={product.stock - currentQuantityInCart}
              value={quantity}
              onChange={(e) => {
                const value = Number.parseInt(e.target.value)
                if (value >= 1 && value <= product.stock - currentQuantityInCart) {
                  setQuantity(value)
                }
              }}
              className="h-8 w-16 text-center"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={incrementQuantity}
              disabled={isMaxQuantity}
              className="h-8 w-8 p-0 bg-transparent"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      <Button
        onClick={handleAddToCart}
        disabled={isLoading || isMaxQuantity}
        variant={variant}
        size={size}
        className="w-full"
      >
        {isLoading ? (
          "Adding..."
        ) : (
          <>
            <ShoppingCart className="h-4 w-4 mr-2" />
            Add to Cart
          </>
        )}
      </Button>

      {currentQuantityInCart > 0 && (
        <p className="text-sm text-muted-foreground">{currentQuantityInCart} already in cart</p>
      )}

      {isMaxQuantity && <p className="text-sm text-yellow-600">Maximum available quantity reached</p>}
    </div>
  )
}
