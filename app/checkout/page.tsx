"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useCartStore } from "@/lib/store/cart-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { formatCurrency } from "@/lib/utils"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { ProtectedRoute } from "@/components/auth/protected-route"

const checkoutSchema = z.object({
  shippingAddress: z.string().min(10, "Address must be at least 10 characters"),
  notes: z.string().optional(),
})

type CheckoutForm = z.infer<typeof checkoutSchema>

function CheckoutPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { items, totalPrice, clearCart } = useCartStore()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
  })

  const onSubmit = async (data: CheckoutForm) => {
    if (items.length === 0) {
      toast.error("Your cart is empty")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
            price: item.price,
          })),
          shippingAddress: data.shippingAddress,
          notes: data.notes,
        }),
      })

      if (!response.ok) throw new Error("Failed to create order")

      const order = await response.json()

      router.push(`/orders/${order.id}`)
      clearCart()
      toast.success("Order placed successfully!")
    } catch (error) {
      toast.error("Failed to create order")
    } finally {
      setIsLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">Your cart is empty</p>
            <Button onClick={() => router.push("/products")}>Continue Shopping</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Form */}
          <Card>
            <CardHeader>
              <CardTitle>Shipping Information</CardTitle>
              <CardDescription>Please provide your shipping details</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={session?.user?.email || ""} disabled />
                </div>

                <div>
                  <Label htmlFor="shippingAddress">Shipping Address</Label>
                  <Textarea
                    id="shippingAddress"
                    placeholder="Enter your full shipping address"
                    {...register("shippingAddress")}
                  />
                  {errors.shippingAddress && (
                    <p className="text-sm text-destructive mt-1">{errors.shippingAddress.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="notes">Order Notes (Optional)</Label>
                  <Textarea id="notes" placeholder="Any special instructions..." {...register("notes")} />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Processing..." : "Place Order"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Qty: {item.quantity} × {formatCurrency(item.price)}
                      </p>
                    </div>
                    <p className="font-medium">{formatCurrency(item.price * item.quantity)}</p>
                  </div>
                ))}

                <Separator />

                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total:</span>
                  <span>{formatCurrency(totalPrice)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function Page() {
  return (
    <ProtectedRoute allowedRoles={["BUYER", "ADMIN"]}>
      <CheckoutPage />
    </ProtectedRoute>
  )
}
