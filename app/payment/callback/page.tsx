"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function PaymentCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<"loading" | "success" | "failed">("loading")
  const [message, setMessage] = useState("")

  useEffect(() => {
    const reference = searchParams.get("reference")

    if (!reference) {
      setStatus("failed")
      setMessage("Invalid payment reference")
      return
    }

    verifyPayment(reference)
  }, [searchParams])

  const verifyPayment = async (reference: string) => {
    try {
      const response = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference }),
      })

      const data = await response.json()

      if (response.ok && data.status === "success") {
        setStatus("success")
        setMessage("Payment completed successfully!")
        toast.success("Payment successful!")
      } else {
        setStatus("failed")
        setMessage(data.message || "Payment verification failed")
        toast.error("Payment failed")
      }
    } catch (error) {
      setStatus("failed")
      setMessage("Failed to verify payment")
      toast.error("Payment verification failed")
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              {status === "loading" && <Loader2 className="h-12 w-12 animate-spin text-blue-500" />}
              {status === "success" && <CheckCircle className="h-12 w-12 text-green-500" />}
              {status === "failed" && <XCircle className="h-12 w-12 text-destructive" />}
            </div>
            <CardTitle>
              {status === "loading" && "Verifying Payment..."}
              {status === "success" && "Payment Successful!"}
              {status === "failed" && "Payment Failed"}
            </CardTitle>
            <CardDescription>{message}</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            {status !== "loading" && (
              <>
                <Button onClick={() => router.push("/orders")} className="w-full">
                  View Orders
                </Button>
                <Button variant="outline" onClick={() => router.push("/products")} className="w-full">
                  Continue Shopping
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
