import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { UserRole, UserStatus, OrderStatus } from "@prisma/client"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const [totalUsers, totalOrders, monthlyRevenue, pendingApprovals] = await Promise.all([
      prisma.user.count(),
      prisma.order.count(),
      prisma.order.aggregate({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
          status: {
            in: [OrderStatus.CONFIRMED, OrderStatus.DELIVERED],
          },
        },
        _sum: {
          total: true,
        },
      }),
      prisma.user.count({
        where: {
          status: UserStatus.PENDING,
        },
      }),
    ])

    return NextResponse.json({
      totalUsers,
      totalOrders,
      monthlyRevenue: monthlyRevenue._sum.total || 0,
      pendingApprovals,
    })
  } catch (error) {
    console.error("Admin stats fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
