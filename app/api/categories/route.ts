import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/api-auth"
import { UserRole } from "@prisma/client"
import { z } from "zod"

const categorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  description: z.string().optional(),
  image: z.string().optional(),
})

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: {
            products: {
              where: { isActive: true },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    })

    return NextResponse.json(categories)
  } catch (error) {
    console.error("Categories fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole([UserRole.ADMIN])
    if (user instanceof NextResponse) return user

    const body = await request.json()
    const validatedData = categorySchema.parse(body)

    const category = await prisma.category.create({
      data: validatedData,
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error("Category creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
