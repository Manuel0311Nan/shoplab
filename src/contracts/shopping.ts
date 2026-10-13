import { z } from "zod";
export const unidadSchema = z.enum(["unidad", "g", "kg", "ml", "l"]);

export const cantidadSchema = z.object({
  valor: z.number().positive("La cantidad debe ser mayor que cero").max(100_000),
  unidad: unidadSchema,
});

export const shoppingItemSchema = z.object({
  id: z.uuid(),
  nombre: z.string(),
  cantidad: cantidadSchema,
  nota: z.string().nullable(),
  ingredientId: z.uuid().nullable(),
  compradoAt: z.iso.datetime().nullable(),
  updatedAt: z.iso.datetime(),
});

export const shoppingListResponseSchema = z.object({
  id: z.uuid(),
  nombre: z.string(),
  archivada: z.boolean(),
  updatedAt: z.iso.datetime(),
  items: z.array(shoppingItemSchema),
});

export const addItemRequestSchema = z.object({
  id: z.uuid().optional(),
  nombre: z.string().trim().min(1, "Escribe un nombre").max(80, "Máximo 80 caracteres"),
  cantidad: cantidadSchema,
  nota: z.string().trim().max(200).nullish(),
});

export const updateItemRequestSchema = z
  .object({
    comprado: z.boolean().optional(),
    cantidad: cantidadSchema.optional(),
  })
  .refine((body) => body.comprado !== undefined || body.cantidad !== undefined, {
    message: "Indica comprado o cantidad",
  });

export type UnidadDto = z.infer<typeof unidadSchema>;
export type CantidadDto = z.infer<typeof cantidadSchema>;
export type ShoppingItemResponse = z.infer<typeof shoppingItemSchema>;
export type ShoppingListResponse = z.infer<typeof shoppingListResponseSchema>;
export type AddItemRequest = z.input<typeof addItemRequestSchema>;
export type UpdateItemRequest = z.input<typeof updateItemRequestSchema>;
