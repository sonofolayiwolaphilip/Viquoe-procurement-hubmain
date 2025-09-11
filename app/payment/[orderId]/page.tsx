"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, CreditCard, CheckCircle, XCircle } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { toast } from "sonner"
import { ProtectedRoute } from "@/components/auth/protected-route"

interface Order {
  id: string
  total: number
  status: string
  items: Array<{
    id: string
    quantity: number
    price: number
    product: {
      name: string
    }
  }>
}

function PaymentPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)

  const orderId = params.orderId as string

  useEffect(() => {
    fetchOrder()
  }, [orderId])

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}`)
      if (response.ok) {
        const orderData = await response.json()
        setOrder(orderData)
      } else {
        toast.error("Order not found")
        router.push("/orders")
      }
    } catch (error) {
      toast.error("Failed to load order")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePayment = async () => {
    setIsProcessing(true)
    try {
      const response = await fetch("/api/payments/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      })

      if (!response.ok) {
        throw new Error("Failed to initialize payment")
      }

      const { authorization_url } = await response.json()

      window.location.href = authorization_url
    } catch (error) {
      toast.error("Failed to initialize payment")
      setIsProcessing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">Order not found</p>
            <Button onClick={() => router.push("/orders")}>View Orders</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (order.status !== "PENDING") {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">This order has already been {order.status.toLowerCase()}</p>
            <Button onClick={() => router.push("/orders")}>View Orders</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Payment</h1>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Order #{order.id.slice(-8)}
              <Badge variant="outline">{order.status}</Badge>
            </CardTitle>
            <CardDescription>Complete your payment to confirm this order</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{item.product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Qty: {item.quantity} × {formatCurrency(item.price)}
                    </p>
                  </div>
                  <p className="font-medium">{formatCurrency(item.price * item.quantity)}</p>
                </div>
              ))}

              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total Amount:</span>
                  <span>{formatCurrency(order.total)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Method
            </CardTitle>
            <CardDescription>Secure payment powered by Paystack</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handlePayment} disabled={isProcessing} className="w-full" size="lg">
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Pay {formatCurrency(order.total)}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function Page() {
  return (
    <ProtectedRoute allowedRoles={["BUYER", "ADMIN"]}>
      <PaymentPage />
    </ProtectedRoute>
  )
}
