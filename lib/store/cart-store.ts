import { create } from "zustand"
import { persist } from "zustand/middleware"

interface CartItem {
  id: string
  productId: string
  name: string
  price: number
  quantity: number
  image?: string
  sku: string
  supplier: {
    id: string
    name: string
    company?: string
  }
  stock: number
}

interface CartStore {
  items: CartItem[]
  isLoading: boolean
  error: string | null

  // Actions
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => Promise<void>
  removeItem: (productId: string) => Promise<void>
  updateQuantity: (productId: string, quantity: number) => Promise<void>
  clearCart: () => void
  syncWithServer: () => Promise<void>

  // Getters
  getTotalItems: () => number
  getTotalPrice: () => number
  getItemByProductId: (productId: string) => CartItem | undefined

  // Internal actions
  setItems: (items: CartItem[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,
      error: null,

      addItem: async (item) => {
        set({ isLoading: true, error: null })

        try {
          const response = await fetch("/api/cart", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              productId: item.productId,
              quantity: item.quantity || 1,
            }),
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || "Failed to add item to cart")
          }

          // Sync with server to get updated cart
          await get().syncWithServer()
        } catch (error) {
          set({ error: error instanceof Error ? error.message : "Failed to add item" })
          throw error
        } finally {
          set({ isLoading: false })
        }
      },

      removeItem: async (productId) => {
        set({ isLoading: true, error: null })

        try {
          const item = get().getItemByProductId(productId)
          if (!item) return

          const response = await fetch(`/api/cart/${item.id}`, {
            method: "DELETE",
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || "Failed to remove item")
          }

          // Remove from local state
          set({
            items: get().items.filter((i) => i.productId !== productId),
          })
        } catch (error) {
          set({ error: error instanceof Error ? error.message : "Failed to remove item" })
          throw error
        } finally {
          set({ isLoading: false })
        }
      },

      updateQuantity: async (productId, quantity) => {
        if (quantity <= 0) {
          await get().removeItem(productId)
          return
        }

        set({ isLoading: true, error: null })

        try {
          const item = get().getItemByProductId(productId)
          if (!item) return

          const response = await fetch(`/api/cart/${item.id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ quantity }),
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || "Failed to update quantity")
          }

          // Update local state
          set({
            items: get().items.map((i) => (i.productId === productId ? { ...i, quantity } : i)),
          })
        } catch (error) {
          set({ error: error instanceof Error ? error.message : "Failed to update quantity" })
          throw error
        } finally {
          set({ isLoading: false })
        }
      },

      clearCart: () => {
        set({ items: [], error: null })
      },

      syncWithServer: async () => {
        set({ isLoading: true, error: null })

        try {
          const response = await fetch("/api/cart")

          if (!response.ok) {
            if (response.status === 401) {
              // User not authenticated, clear cart
              set({ items: [] })
              return
            }
            throw new Error("Failed to sync cart")
          }

          const cartItems = await response.json()

          // Transform server data to match our store format
          const transformedItems: CartItem[] = cartItems.map((item: any) => ({
            id: item.id,
            productId: item.product.id,
            name: item.product.name,
            price: item.product.price,
            quantity: item.quantity,
            image: item.product.image,
            sku: item.product.sku,
            supplier: item.product.supplier,
            stock: item.product.stock,
          }))

          set({ items: transformedItems })
        } catch (error) {
          set({ error: error instanceof Error ? error.message : "Failed to sync cart" })
        } finally {
          set({ isLoading: false })
        }
      },

      getTotalItems: () => get().items.reduce((total, item) => total + item.quantity, 0),

      getTotalPrice: () => get().items.reduce((total, item) => total + item.price * item.quantity, 0),

      getItemByProductId: (productId) => get().items.find((item) => item.productId === productId),

      setItems: (items) => set({ items }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
    }),
    {
      name: "cart-storage",
      partialize: (state) => ({ items: state.items }), // Only persist items
    },
  ),
)
