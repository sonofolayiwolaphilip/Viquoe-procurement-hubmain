import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/api-auth"
import { productSchema } from "@/lib/validations/product"
import { UserRole } from "@prisma/client"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const category = searchParams.get("category")
    const search = searchParams.get("search")
    const supplierId = searchParams.get("supplierId")

    const skip = (page - 1) * limit

    const where: any = {
      isActive: true,
    }

    if (category) {
      where.category = {
        name: category,
      }
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ]
    }

    if (supplierId) {
      where.supplierId = supplierId
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
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
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.product.count({ where }),
    ])

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Products fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole([UserRole.SUPPLIER, UserRole.ADMIN])
    if (user instanceof NextResponse) return user

    const body = await request.json()
    const validatedData = productSchema.parse(body)

    const product = await prisma.product.create({
      data: {
        ...validatedData,
        supplierId: user.id,
      },
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

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error("Product creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
