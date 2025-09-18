// lib/database.ts
import { PrismaClient } from '@prisma/client'
import { supabase } from './supabase'

// Prisma Client (for complex queries and relationships)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Supabase helpers for specific features
export const supabaseHelpers = {
  // Auth helpers
  auth: {
    signUp: async (email: string, password: string, userData?: any) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      })
      return { data, error }
    },

    signIn: async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      return { data, error }
    },

    signOut: async () => {
      const { error } = await supabase.auth.signOut()
      return { error }
    },

    getUser: async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      return { user, error }
    }
  },

  // File upload helpers
  storage: {
    uploadFile: async (bucket: string, filePath: string, file: File) => {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file)
      return { data, error }
    },

    getPublicUrl: (bucket: string, filePath: string) => {
      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath)
      return data.publicUrl
    }
  },

  // Real-time subscriptions
  realtime: {
    subscribeToTable: (table: string, callback: (payload: any) => void) => {
      return supabase
        .channel(`${table}-changes`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: table
        }, callback)
        .subscribe()
    }
  }
}