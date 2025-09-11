import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { paystack } from "@/lib/paystack"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const initializePaymentSchema = z.object({
  orderId: z.string(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { orderId } = initializePaymentSchema.parse(body)

    const order = await prisma.order.findUnique({
      where: {
        id: orderId,
        userId: session.user.id,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    if (order.status !== "PENDING") {
      return NextResponse.json({ error: "Order cannot be paid" }, { status: 400 })
    }

    const reference = `order_${orderId}_${Date.now()}`

    const paymentResponse = await paystack.initializePayment({
      email: session.user.email!,
      amount: order.total,
      reference,
      callback_url: `${process.env.NEXTAUTH_URL}/payment/callback`,
      metadata: {
        orderId,
        userId: session.user.id,
        custom_fields: [
          {
            display_name: "Order ID",
            variable_name: "order_id",
            value: orderId,
          },
        ],
      },
    })

    if (!paymentResponse.status) {
      return NextResponse.json({ error: "Failed to initialize payment" }, { status: 500 })
    }

    await prisma.payment.create({
      data: {
        id: reference,
        orderId,
        amount: order.total,
        currency: "NGN",
        provider: "PAYSTACK",
        status: "PENDING",
        metadata: {
          paystack_reference: reference,
          authorization_url: paymentResponse.data.authorization_url,
        },
      },
    })

    return NextResponse.json({
      authorization_url: paymentResponse.data.authorization_url,
      reference,
    })
  } catch (error) {
    console.error("Payment initialization error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
