import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { UserRole, UserStatus } from "@prisma/client"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { action } = await request.json()
    const userId = params.id

    let newStatus: UserStatus
    switch (action) {
      case "approve":
        newStatus = UserStatus.ACTIVE
        break
      case "suspend":
        newStatus = UserStatus.SUSPENDED
        break
      case "activate":
        newStatus = UserStatus.ACTIVE
        break
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { status: newStatus },
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("Admin user update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
