import { z } from "zod";
import { paginaSchema } from "./pagination";
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
  /** Producto de la lista base del que salió (autocompletado), o null. */
  productoBaseId: z.uuid().nullable(),
  compradoAt: z.iso.datetime().nullable(),
  updatedAt: z.iso.datetime(),
});

export const shoppingListResponseSchema = z.object({
  id: z.uuid(),
  nombre: z.string(),
  archivada: z.boolean(),
  /** Solo archivadas: cuándo se borrará (archivadaAt + 15 días). */
  caducaEl: z.iso.datetime().nullable(),
  updatedAt: z.iso.datetime(),
  items: z.array(shoppingItemSchema),
});

const nombreListaSchema = z
  .string()
  .trim()
  .min(1, "Ponle un nombre a la lista")
  .max(80, "Máximo 80 caracteres");

/** Tarjeta de Mis listas. */
export const shoppingListSummarySchema = z.object({
  id: z.uuid(),
  nombre: z.string(),
  archivada: z.boolean(),
  archivadaAt: z.iso.datetime().nullable(),
  /** Solo archivadas: cuándo se borrará (archivadaAt + 15 días). */
  caducaEl: z.iso.datetime().nullable(),
  pendientes: z.number().int(),
  total: z.number().int(),
  updatedAt: z.iso.datetime(),
});

export const estadoListasSchema = z.enum(["activas", "archivadas"]);

/** GET /lists?estado=activas|archivadas&cursor=…&limite=… */
export const listListsQuerySchema = z.object({
  estado: estadoListasSchema.default("activas"),
  cursor: z.string().max(200).optional(),
  limite: z.coerce.number().int().min(1).max(50).optional(),
});

export const shoppingListPageSchema = paginaSchema(shoppingListSummarySchema);

/** Con 15 activas hay que mandar `archivarListaId` (la que se archiva para hacer sitio). */
export const createListRequestSchema = z.object({
  id: z.uuid().optional(),
  nombre: nombreListaSchema,
  archivarListaId: z.uuid().optional(),
});

export const updateListRequestSchema = z
  .object({
    nombre: nombreListaSchema.optional(),
    archivada: z.boolean().optional(),
    archivarListaId: z.uuid().optional(),
  })
  .refine((body) => body.nombre !== undefined || body.archivada !== undefined, {
    message: "Indica nombre o archivada",
  });

/** `details` de LIMITE_DE_LISTAS (409): entre qué listas elegir. */
export const limiteDeListasDetailsSchema = z.object({
  max: z.number().int(),
  activas: z.array(z.object({ id: z.uuid(), nombre: z.string() })),
});

/** `details` de POSIBLE_DUPLICADO (409) y UNIDADES_DISTINTAS (400): el producto que ya está. */
export const duplicadoDetailsSchema = z.object({
  existente: z.object({
    itemId: z.uuid(),
    nombre: z.string(),
    cantidad: cantidadSchema,
    comprado: z.boolean(),
  }),
});

export const addItemRequestSchema = z.object({
  id: z.uuid().optional(),
  nombre: z.string().trim().min(1, "Escribe un nombre").max(80, "Máximo 80 caracteres"),
  cantidad: cantidadSchema,
  nota: z.string().trim().max(200).nullish(),
  productoBaseId: z.uuid().nullish(),
  /** Respuesta a POSIBLE_DUPLICADO. */
  duplicado: z.enum(["unir", "separar"]).optional(),
  /** Respuesta a UNIDADES_DISTINTAS: unidad del total (si se pueden convertir). */
  unidadFinal: unidadSchema.optional(),
  /** Respuesta a UNIDADES_DISTINTAS: total escrito por el usuario (si no se pueden convertir). */
  cantidadFinal: cantidadSchema.optional(),
});

export const updateItemRequestSchema = z
  .object({
    comprado: z.boolean().optional(),
    cantidad: cantidadSchema.optional(),
  })
  .refine((body) => body.comprado !== undefined || body.cantidad !== undefined, {
    message: "Indica comprado o cantidad",
  });

export const modoTerminarCompraSchema = z.enum(["vaciar", "conservarPendientes"]);

/** Terminar la compra: se quitan los comprados y, con `vaciar`, también los pendientes. */
export const finishShoppingRequestSchema = z.object({ modo: modoTerminarCompraSchema });

export type UnidadDto = z.infer<typeof unidadSchema>;
export type CantidadDto = z.infer<typeof cantidadSchema>;
export type ShoppingItemResponse = z.infer<typeof shoppingItemSchema>;
export type ShoppingListResponse = z.infer<typeof shoppingListResponseSchema>;
export type AddItemRequest = z.input<typeof addItemRequestSchema>;
export type UpdateItemRequest = z.input<typeof updateItemRequestSchema>;
export type ModoTerminarCompraDto = z.infer<typeof modoTerminarCompraSchema>;
export type FinishShoppingRequest = z.input<typeof finishShoppingRequestSchema>;
export type ShoppingListSummary = z.infer<typeof shoppingListSummarySchema>;
export type EstadoListasDto = z.infer<typeof estadoListasSchema>;
export type ListListsQuery = z.input<typeof listListsQuerySchema>;
export type ShoppingListPage = z.infer<typeof shoppingListPageSchema>;
export type CreateListRequest = z.input<typeof createListRequestSchema>;
export type UpdateListRequest = z.input<typeof updateListRequestSchema>;
export type LimiteDeListasDetails = z.infer<typeof limiteDeListasDetailsSchema>;
export type DuplicadoDetails = z.infer<typeof duplicadoDetailsSchema>;
