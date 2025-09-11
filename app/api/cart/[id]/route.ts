import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/api-auth"
import { z } from "zod"

const updateCartSchema = z.object({
  quantity: z.number().min(1),
})

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth()
    if (user instanceof NextResponse) return user

    const body = await request.json()
    const { quantity } = updateCartSchema.parse(body)

    const cartItem = await prisma.cartItem.findFirst({
      where: { id: params.id, userId: user.id },
    })

    if (!cartItem) {
      return NextResponse.json({ error: "Cart item not found" }, { status: 404 })
    }

    const updatedItem = await prisma.cartItem.update({
      where: { id: params.id },
      data: { quantity },
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

    return NextResponse.json(updatedItem)
  } catch (error) {
    console.error("Cart update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth()
    if (user instanceof NextResponse) return user

    const cartItem = await prisma.cartItem.findFirst({
      where: { id: params.id, userId: user.id },
    })

    if (!cartItem) {
      return NextResponse.json({ error: "Cart item not found" }, { status: 404 })
    }

    await prisma.cartItem.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "Item removed from cart" })
  } catch (error) {
    console.error("Cart deletion error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
