import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "./prisma"
import bcrypt from "bcryptjs"
import type { UserRole } from "@prisma/client"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            console.log("Missing credentials")
            return null
          }

          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email,
            },
          })

          if (!user || !user.password) {
            console.log("User not found or no password")
            return null
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password)
          
          if (!isPasswordValid) {
            console.log("Invalid password")
            return null
          }

          console.log("User authenticated successfully")
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            image: user.image,
          }
        } catch (error) {
          console.error("Authorization error:", error)
          return null
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in
      if (user) {
        token.role = user.role
        token.userId = user.id
      }
      
      // Handle account linking for OAuth providers
      if (account && account.provider !== "credentials") {
        // For OAuth providers, fetch user role from database
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email! },
          select: { id: true, role: true }
        })
        if (dbUser) {
          token.role = dbUser.role
          token.userId = dbUser.id
        }
      }
      
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.userId as string || token.sub!
        session.user.role = token.role as UserRole
      }
      return session
    },
    // Add signIn callback to handle OAuth users
    async signIn({ user, account, profile }) {
      // Allow credentials provider
      if (account?.provider === "credentials") {
        return true
      }
      
      // For OAuth providers, ensure user exists in database
      if (account?.provider === "google" && user.email) {
        try {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email }
          })
          
          // If user doesn't exist, create them with default role
          if (!existingUser) {
            await prisma.user.create({
              data: {
                email: user.email,
                name: user.name || "",
                image: user.image,
                role: "BUYER", // Default role for OAuth users
                // Don't set password for OAuth users
              }
            })
          }
          return true
        } catch (error) {
          console.error("Error in signIn callback:", error)
          return false
        }
      }
      
      return true
    },
  },
  pages: {
    signIn: "/auth/signin",
    // Remove signUp page as NextAuth doesn't use it
  },
  debug: process.env.NODE_ENV === "development",
  secret: process.env.NEXTAUTH_SECRET,
}