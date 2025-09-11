import { type NextRequest, NextResponse } from "next/server"
import { paystack } from "@/lib/paystack"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const { reference } = await request.json()

    if (!reference) {
      return NextResponse.json({ error: "Reference is required" }, { status: 400 })
    }

    const verification = await paystack.verifyPayment(reference)

    if (!verification.status) {
      return NextResponse.json({ error: "Payment verification failed" }, { status: 400 })
    }

    const paymentData = verification.data

    const payment = await prisma.payment.update({
      where: { id: reference },
      data: {
        status: paymentData.status === "success" ? "COMPLETED" : "FAILED",
        metadata: {
          ...paymentData,
        },
      },
      include: {
        order: true,
      },
    })

    if (paymentData.status === "success") {
      await prisma.order.update({
        where: { id: payment.orderId },
        data: {
          status: "CONFIRMED",
          paidAt: new Date(),
        },
      })

      await prisma.invoice.create({
        data: {
          orderId: payment.orderId,
          amount: payment.amount,
          status: "PAID",
          dueDate: new Date(),
          paidAt: new Date(),
        },
      })
    }

    return NextResponse.json({
      status: paymentData.status,
      message: verification.message,
      payment,
    })
  } catch (error) {
    console.error("Payment verification error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
