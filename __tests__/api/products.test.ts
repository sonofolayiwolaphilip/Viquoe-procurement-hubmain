import { GET, POST } from "@/app/api/products/route"
import { prisma } from "@/lib/prisma"
import { NextRequest } from "next/server"
import jest from "jest"

// Mock the auth functions
jest.mock("@/lib/api-auth", () => ({
  requireAuth: jest.fn(),
  requireRole: jest.fn(),
}))

describe("/api/products", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("GET /api/products", () => {
    it("should return products with pagination", async () => {
      const mockProducts = [
        {
          id: "1",
          name: "Test Product",
          price: 100,
          stock: 10,
          category: { name: "Test Category" },
          supplier: { id: "1", name: "Test Supplier" },
        },
      ]
      ;(prisma.product.findMany as jest.Mock).mockResolvedValue(mockProducts)
      ;(prisma.product.count as jest.Mock).mockResolvedValue(1)

      const request = new NextRequest("http://localhost:3000/api/products")
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.products).toEqual(mockProducts)
      expect(data.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        pages: 1,
      })
    })

    it("should handle search parameters", async () => {
      const request = new NextRequest("http://localhost:3000/api/products?search=test&category=electronics")
      ;(prisma.product.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.product.count as jest.Mock).mockResolvedValue(0)

      await GET(request)

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isActive: true,
            category: { name: "electronics" },
            OR: [
              { name: { contains: "test", mode: "insensitive" } },
              { description: { contains: "test", mode: "insensitive" } },
            ],
          }),
        }),
      )
    })
  })

  describe("POST /api/products", () => {
    it("should create a product when authenticated as supplier", async () => {
      const { requireRole } = require("@/lib/api-auth")
      requireRole.mockResolvedValue({ id: "supplier1", role: "SUPPLIER" })

      const mockProduct = {
        id: "1",
        name: "New Product",
        price: 100,
        stock: 10,
      }
      ;(prisma.product.create as jest.Mock).mockResolvedValue(mockProduct)

      const request = new NextRequest("http://localhost:3000/api/products", {
        method: "POST",
        body: JSON.stringify({
          name: "New Product",
          price: 100,
          stock: 10,
          categoryId: "cat1",
          sku: "SKU001",
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data).toEqual(mockProduct)
    })
  })
})
