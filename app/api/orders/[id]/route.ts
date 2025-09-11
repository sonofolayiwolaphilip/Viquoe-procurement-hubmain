import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, requireRole } from "@/lib/api-auth"
import { updateOrderStatusSchema } from "@/lib/validations/order"
import { UserRole } from "@prisma/client"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth()
    if (user instanceof NextResponse) return user

    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            company: true,
          },
        },
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
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Check if user can access this order
    if (order.userId !== user.id && user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error("Order fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireRole([UserRole.ADMIN, UserRole.SUPPLIER])
    if (user instanceof NextResponse) return user

    const body = await request.json()
    const { status, notes } = updateOrderStatusSchema.parse(body)

    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Check if supplier can update this order
    if (user.role === UserRole.SUPPLIER) {
      const hasSupplierProducts = order.orderItems.some((item) => item.product.supplierId === user.id)
      if (!hasSupplierProducts) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    const updatedOrder = await prisma.order.update({
      where: { id: params.id },
      data: {
        status,
        notes: notes || order.notes,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            company: true,
          },
        },
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
    })

    return NextResponse.json(updatedOrder)
  } catch (error) {
    console.error("Order update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
