import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/api-auth"
import { orderSchema } from "@/lib/validations/order"

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    if (user instanceof NextResponse) return user

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const status = searchParams.get("status")

    const skip = (page - 1) * limit

    const where: any = {
      userId: user.id,
    }

    if (status) {
      where.status = status
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          orderItems: {
            include: {
              product: {
                include: {
                  supplier: {
                    select: {
                      id: true,
                      name: true,
                      company: true,
                    },
                  },
                },
              },
            },
          },
          invoices: true,
          payments: true,
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.order.count({ where }),
    ])

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Orders fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    if (user instanceof NextResponse) return user

    const body = await request.json()
    const validatedData = orderSchema.parse(body)

    // Generate order number
    const orderNumber = `ORD-${Date.now()}`

    // Calculate totals
    let totalAmount = 0
    const orderItemsData = []

    for (const item of validatedData.items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      })

      if (!product) {
        return NextResponse.json({ error: `Product ${item.productId} not found` }, { status: 404 })
      }

      if (product.stock < item.quantity) {
        return NextResponse.json({ error: `Insufficient stock for ${product.name}` }, { status: 400 })
      }

      const itemTotal = product.price.toNumber() * item.quantity
      totalAmount += itemTotal

      orderItemsData.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: product.price,
        totalPrice: itemTotal,
      })
    }

    // Create order with items
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: user.id,
        totalAmount,
        shippingAddress: validatedData.shippingAddress,
        notes: validatedData.notes,
        orderItems: {
          create: orderItemsData,
        },
      },
      include: {
        orderItems: {
          include: {
            product: {
              include: {
                supplier: {
                  select: {
                    id: true,
                    name: true,
                    company: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    // Update product stock
    for (const item of validatedData.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      })
    }

    // Clear cart items for ordered products
    await prisma.cartItem.deleteMany({
      where: {
        userId: user.id,
        productId: {
          in: validatedData.items.map((item) => item.productId),
        },
      },
    })

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    console.error("Order creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
