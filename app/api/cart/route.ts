import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/api-auth"
import { z } from "zod"

const addToCartSchema = z.object({
  productId: z.string(),
  quantity: z.number().min(1),
})

export async function GET() {
  try {
    const user = await requireAuth()
    if (user instanceof NextResponse) return user

    const cartItems = await prisma.cartItem.findMany({
      where: { userId: user.id },
      include: {
        product: {
          include: {
            category: true,
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
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(cartItems)
  } catch (error) {
    console.error("Cart fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    if (user instanceof NextResponse) return user

    const body = await request.json()
    const { productId, quantity } = addToCartSchema.parse(body)

    // Check if product exists and is active
    const product = await prisma.product.findFirst({
      where: { id: productId, isActive: true },
    })

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    // Check if item already exists in cart
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        userId_productId: {
          userId: user.id,
          productId,
        },
      },
    })

    let cartItem
    if (existingItem) {
      // Update quantity
      cartItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
        include: {
          product: {
            include: {
              category: true,
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
      })
    } else {
      // Create new cart item
      cartItem = await prisma.cartItem.create({
        data: {
          userId: user.id,
          productId,
          quantity,
        },
        include: {
          product: {
            include: {
              category: true,
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
      })
    }

    return NextResponse.json(cartItem, { status: 201 })
  } catch (error) {
    console.error("Add to cart error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
