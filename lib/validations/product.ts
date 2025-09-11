import { z } from "zod"

export const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional(),
  price: z.number().min(0.01, "Price must be greater than 0"),
  sku: z.string().min(1, "SKU is required"),
  stock: z.number().min(0, "Stock cannot be negative"),
  minOrder: z.number().min(1, "Minimum order must be at least 1"),
  categoryId: z.string().min(1, "Category is required"),
  image: z.string().optional(),
})

export type ProductInput = z.infer<typeof productSchema>
