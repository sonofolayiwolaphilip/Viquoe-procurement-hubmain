import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, requireRole } from "@/lib/api-auth"
import { UserRole } from "@prisma/client"
import { z } from "zod"

const createInvoiceSchema = z.object({
  orderId: z.string(),
  dueDate: z.string().transform((str) => new Date(str)),
  taxAmount: z.number().min(0),
  notes: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    if (user instanceof NextResponse) return user

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const status = searchParams.get("status")

    const skip = (page - 1) * limit

    const where: any = {}

    // Filter based on user role
    if (user.role === UserRole.BUYER) {
      where.userId = user.id
    } else if (user.role === UserRole.SUPPLIER) {
      where.order = {
        orderItems: {
          some: {
            product: {
              supplierId: user.id,
            },
          },
        },
      }
    }
    // Admin and Finance can see all invoices

    if (status) {
      where.status = status
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          order: {
            include: {
              orderItems: {
                include: {
                  product: true,
                },
              },
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              company: true,
            },
          },
          payments: true,
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.invoice.count({ where }),
    ])

    return NextResponse.json({
      invoices,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Invoices fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole([UserRole.ADMIN, UserRole.SUPPLIER])
    if (user instanceof NextResponse) return user

    const body = await request.json()
    const { orderId, dueDate, taxAmount, notes } = createInvoiceSchema.parse(body)

    const order = await prisma.order.findUnique({
      where: { id: orderId },
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

    // Check if supplier can create invoice for this order
    if (user.role === UserRole.SUPPLIER) {
      const hasSupplierProducts = order.orderItems.some((item) => item.product.supplierId === user.id)
      if (!hasSupplierProducts) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}`

    const subtotal = order.totalAmount.toNumber()
    const totalAmount = subtotal + taxAmount

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        orderId,
        userId: order.userId,
        subtotal,
        taxAmount,
        totalAmount,
        dueDate,
        notes,
      },
      include: {
        order: {
          include: {
            orderItems: {
              include: {
                product: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            company: true,
          },
        },
        payments: true,
      },
    })

    return NextResponse.json(invoice, { status: 201 })
  } catch (error) {
    console.error("Invoice creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
