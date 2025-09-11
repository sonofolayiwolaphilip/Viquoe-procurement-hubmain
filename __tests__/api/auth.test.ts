import { POST } from "@/app/api/auth/register/route"
import { prisma } from "@/lib/prisma"
import { NextRequest } from "next/server"
import bcrypt from "bcryptjs"
import jest from "jest" // Declaring the jest variable

jest.mock("bcryptjs")

describe("/api/auth/register", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should register a new user successfully", async () => {
    const mockUser = {
      id: "1",
      name: "John Doe",
      email: "john@example.com",
      role: "BUYER",
    }
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
    ;(bcrypt.hash as jest.Mock).mockResolvedValue("hashedpassword")
    ;(prisma.user.create as jest.Mock).mockResolvedValue({
      ...mockUser,
      password: "hashedpassword",
    })

    const request = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
        confirmPassword: "password123",
        role: "BUYER",
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.message).toBe("User created successfully")
    expect(data.user).toEqual(mockUser)
  })

  it("should return error if user already exists", async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: "1",
      email: "john@example.com",
    })

    const request = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
        confirmPassword: "password123",
        role: "BUYER",
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe("User already exists")
  })
})
