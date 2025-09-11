"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Users,
  Building2,
  Package,
  DollarSign,
  TrendingUp,
  ShoppingCart,
  AlertTriangle,
  Search,
  Filter,
  Eye,
  BarChart3,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { UserRole } from "@prisma/client"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { formatCurrency } from "@/lib/utils"

interface User {
  id: string
  name: string
  email: string
  role: UserRole
  status: "ACTIVE" | "PENDING" | "SUSPENDED"
  createdAt: string
}

interface Order {
  id: string
  user: { name?: string; email?: string }
  total: number
  status: "PENDING" | "CONFIRMED" | "DELIVERED" | "CANCELLED"
  createdAt: string
}

function AdminDashboardContent() {
  const { data: session } = useSession()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [userFilter, setUserFilter] = useState("all")
  const [orderFilter, setOrderFilter] = useState("all")

  const [users, setUsers] = useState([])
  const [orders, setOrders] = useState([])
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrders: 0,
    monthlyRevenue: 0,
    pendingApprovals: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)

      // Fetch users
      const usersResponse = await fetch("/api/admin/users")
      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        setUsers(usersData)
      }

      // Fetch orders
      const ordersResponse = await fetch("/api/admin/orders")
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json()
        setOrders(ordersData)
      }

      // Fetch dashboard stats
      const statsResponse = await fetch("/api/admin/stats")
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
      }
    } catch (error) {
      toast.error("Failed to load dashboard data")
    } finally {
      setIsLoading(false)
    }
  }

  const handleUserAction = async (userId: string, action: "approve" | "suspend" | "activate") => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })

      if (response.ok) {
        toast.success(`User ${action}d successfully`)
        fetchDashboardData() // Refresh data
      } else {
        throw new Error("Failed to update user")
      }
    } catch (error) {
      toast.error(`Failed to ${action} user`)
    }
  }

  const handleOrderAction = async (orderId: string, action: "approve" | "cancel") => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })

      if (response.ok) {
        toast.success(`Order ${action}d successfully`)
        fetchDashboardData() // Refresh data
      } else {
        throw new Error("Failed to update order")
      }
    } catch (error) {
      toast.error(`Failed to ${action} order`)
    }
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = userFilter === "all" || user.role === userFilter || user.status === userFilter
    return matchesSearch && matchesFilter
  })

  const filteredOrders = orders.filter((order) => {
    const matchesFilter = orderFilter === "all" || order.status === orderFilter
    return matchesFilter
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
      case "DELIVERED":
      case "CONFIRMED":
        return "bg-green-100 text-green-800"
      case "PENDING":
        return "bg-yellow-100 text-yellow-800"
      case "SUSPENDED":
      case "CANCELLED":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ACTIVE":
      case "DELIVERED":
      case "CONFIRMED":
        return <CheckCircle className="h-4 w-4" />
      case "PENDING":
        return <Clock className="h-4 w-4" />
      case "SUSPENDED":
      case "CANCELLED":
        return <XCircle className="h-4 w-4" />
      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">V</span>
              </div>
              <div>
                <h1 className="text-xl font-bold">Admin Dashboard</h1>
                <p className="text-sm text-muted-foreground">Welcome, {session?.user?.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary">Administrator</Badge>
              <Button onClick={() => router.push("/")} variant="outline">
                Back to Home
              </Button>
              <Button onClick={() => signOut()} variant="outline">
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Active platform users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.monthlyRevenue)}</div>
              <p className="text-xs text-muted-foreground">Total platform revenue</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Platform orders</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pendingApprovals}</div>
              <p className="text-xs text-muted-foreground">Requires attention</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="orders">Order Management</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Recent Orders */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Orders</CardTitle>
                  <CardDescription>Latest platform activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {orders.slice(0, 5).map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">#{order.id.slice(-8)}</p>
                          <p className="text-sm text-muted-foreground">{order.user?.name || order.user?.email}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatCurrency(order.total)}</p>
                          <Badge className={getStatusColor(order.status)}>
                            {getStatusIcon(order.status)}
                            <span className="ml-1">{order.status}</span>
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Platform Health */}
              <Card>
                <CardHeader>
                  <CardTitle>Platform Health</CardTitle>
                  <CardDescription>Key performance indicators</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Active Users (24h)</span>
                    <span className="font-bold text-green-600">89%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Order Success Rate</span>
                    <span className="font-bold text-green-600">94%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Payment Success Rate</span>
                    <span className="font-bold text-green-600">97%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Platform Commission</span>
                    <span className="font-bold">₦{formatCurrency(stats.platformCommission)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">User Management</h2>
              <div className="flex space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Select value={userFilter} onValueChange={setUserFilter}>
                  <SelectTrigger className="w-40">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value={UserRole.BUYER}>Buyers</SelectItem>
                    <SelectItem value={UserRole.SUPPLIER}>Suppliers</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="SUSPENDED">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Join Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{user.name || "N/A"}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {user.role === UserRole.BUYER ? (
                              <Building2 className="h-3 w-3 mr-1" />
                            ) : (
                              <Package className="h-3 w-3 mr-1" />
                            )}
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(user.status)}>
                            {getStatusIcon(user.status)}
                            <span className="ml-1">{user.status}</span>
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {user.status === "PENDING" && (
                              <Button size="sm" variant="outline" onClick={() => handleUserAction(user.id, "approve")}>
                                Approve
                              </Button>
                            )}
                            {user.status === "ACTIVE" && (
                              <Button size="sm" variant="outline" onClick={() => handleUserAction(user.id, "suspend")}>
                                Suspend
                              </Button>
                            )}
                            {user.status === "SUSPENDED" && (
                              <Button size="sm" variant="outline" onClick={() => handleUserAction(user.id, "activate")}>
                                Activate
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Order Management</h2>
              <Select value={orderFilter} onValueChange={setOrderFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Orders</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                  <SelectItem value="DELIVERED">Delivered</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">#{order.id.slice(-8)}</TableCell>
                        <TableCell>{order.user?.name || order.user?.email}</TableCell>
                        <TableCell>{formatCurrency(order.total)}</TableCell>
                        <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(order.status)}>
                            {getStatusIcon(order.status)}
                            <span className="ml-1">{order.status}</span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button size="sm" variant="ghost">
                              <Eye className="h-4 w-4" />
                            </Button>
                            {order.status === "PENDING" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleOrderAction(order.id, "approve")}
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleOrderAction(order.id, "cancel")}
                                >
                                  Cancel
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <h2 className="text-2xl font-bold">Platform Analytics</h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Growth</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-8 w-8 text-green-600" />
                    <div>
                      <p className="text-2xl font-bold">+24%</p>
                      <p className="text-sm text-muted-foreground">vs last month</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>User Acquisition</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <Users className="h-8 w-8 text-blue-600" />
                    <div>
                      <p className="text-2xl font-bold">+156</p>
                      <p className="text-sm text-muted-foreground">new users this month</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Order Volume</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="h-8 w-8 text-purple-600" />
                    <div>
                      <p className="text-2xl font-bold">+18%</p>
                      <p className="text-sm text-muted-foreground">order increase</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
      <AdminDashboardContent />
    </ProtectedRoute>
  )
}
