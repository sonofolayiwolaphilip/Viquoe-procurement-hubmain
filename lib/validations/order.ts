import { z } from "zod"
import { OrderStatus } from "@prisma/client"

export const orderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string(),
        quantity: z.number().min(1),
      }),
    )
    .min(1, "At least one item is required"),
  shippingAddress: z.string().min(1, "Shipping address is required"),
  notes: z.string().optional(),
})

export const updateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
  notes: z.string().optional(),
})

export type OrderInput = z.infer<typeof orderSchema>
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>
