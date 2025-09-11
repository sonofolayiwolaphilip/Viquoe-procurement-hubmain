import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/api-auth"
import { productSchema } from "@/lib/validations/product"
import { UserRole } from "@prisma/client"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: params.id },
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
    })

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error("Product fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth()
    if (user instanceof NextResponse) return user

    const body = await request.json()
    const validatedData = productSchema.parse(body)

    // Check if user owns the product or is admin
    const existingProduct = await prisma.product.findUnique({
      where: { id: params.id },
    })

    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    if (existingProduct.supplierId !== user.id && user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const product = await prisma.product.update({
      where: { id: params.id },
      data: validatedData,
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
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error("Product update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth()
    if (user instanceof NextResponse) return user

    // Check if user owns the product or is admin
    const existingProduct = await prisma.product.findUnique({
      where: { id: params.id },
    })

    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    if (existingProduct.supplierId !== user.id && user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await prisma.product.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "Product deleted successfully" })
  } catch (error) {
    console.error("Product deletion error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
