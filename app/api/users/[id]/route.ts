import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/api-auth"
import { UserRole } from "@prisma/client"
import { z } from "zod"

const updateUserSchema = z.object({
  name: z.string().optional(),
  company: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  isActive: z.boolean().optional(),
  role: z.nativeEnum(UserRole).optional(),
})

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireRole([UserRole.ADMIN])
    if (user instanceof NextResponse) return user

    const targetUser = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        company: true,
        phone: true,
        address: true,
        city: true,
        country: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            orders: true,
            suppliedProducts: true,
          },
        },
      },
    })

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(targetUser)
  } catch (error) {
    console.error("User fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireRole([UserRole.ADMIN])
    if (user instanceof NextResponse) return user

    const body = await request.json()
    const validatedData = updateUserSchema.parse(body)

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: validatedData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        company: true,
        phone: true,
        address: true,
        city: true,
        country: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("User update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireRole([UserRole.ADMIN])
    if (user instanceof NextResponse) return user

    // Soft delete by deactivating the user
    await prisma.user.update({
      where: { id: params.id },
      data: { isActive: false },
    })

    return NextResponse.json({ message: "User deactivated successfully" })
  } catch (error) {
    console.error("User deletion error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
