import { z } from "zod";
import { categoriaSchema } from "./categoria";
import { unidadSchema } from "./shopping";

/** Alias histórico: la categoría es común a lista, despensa y catálogo. */
export const categoriaProductoSchema = categoriaSchema;

export const productoBaseSchema = z.object({
  id: z.uuid(),
  nombre: z.string(),
  categoria: categoriaProductoSchema,
  unidadPorDefecto: unidadSchema,
});

/** GET /catalog/products: la lista base entera, para filtrar en el cliente. */
export const catalogProductsResponseSchema = z.object({ items: z.array(productoBaseSchema) });

/** Lo que el hogar ya escribió (D1, vista 3), para el autocompletado. */
export const productoHogarSchema = z.object({
  nombre: z.string(),
  categoria: categoriaSchema,
  unidad: unidadSchema,
  usos: z.number().int(),
});

/** GET /catalog/household-products: la memoria del hogar, lo más usado primero. */
export const householdProductsResponseSchema = z.object({ items: z.array(productoHogarSchema) });

/** Uno de «Mis productos»: lo escrito a mano por el hogar, con su pack si lo tiene. */
export const miProductoSchema = productoHogarSchema.extend({
  nombreNormalizado: z.string(),
  /** Tamaño del pack recordado (null si nunca se compró por packs). */
  unidadesPorPack: z.number().int().nullable(),
  /** El que eligió el hogar (null: el de por defecto según el nombre, o ninguno). */
  emoji: z.string().nullable(),
});

export const grupoParecidoSchema = z.object({
  /** Nombres normalizados de los productos del hogar que parecen el mismo. */
  productos: z.array(z.object({ nombreNormalizado: z.string(), nombre: z.string() })),
  base: z.object({ id: z.uuid(), nombre: z.string() }).nullable(),
});

/** GET /catalog/my-products: «Mis productos» y los posibles duplicados. */
export const misProductosResponseSchema = z.object({
  items: z.array(miProductoSchema),
  parecidos: z.array(grupoParecidoSchema),
});

/**
 * POST /catalog/my-products/standardize: renombrar o unir un producto del hogar. Se
 * aplica en la memoria del hogar, en las listas activas y en la despensa.
 */
export const estandarizarProductoRequestSchema = z.object({
  /** Nombre normalizado del producto que se edita. */
  desde: z.string().min(1).max(200),
  nombre: z.string().trim().min(1).max(80),
  /** El elegido en el autocompletado, si se une a uno de la lista base. */
  productoBaseId: z.uuid().nullish(),
  categoria: categoriaSchema.optional(),
  unidad: unidadSchema.optional(),
  /** null deja de recordar el pack; sin el campo, no se toca. */
  unidadesPorPack: z.number().int().min(2).max(100).nullable().optional(),
});

export const estandarizarProductoResponseSchema = z.object({
  /** Ítems renombrados en las listas activas y líneas en la despensa. */
  enListas: z.number().int(),
  enDespensa: z.number().int(),
});

/** POST /catalog/my-products/forget: deja de sugerirse en el autocompletado. */
export const olvidarProductoRequestSchema = z.object({
  nombreNormalizado: z.string().min(1).max(200),
});

/** PUT /catalog/emojis: el emoji con que el hogar ve un producto; null vuelve al de por defecto. */
export const cambiarEmojiRequestSchema = z.object({
  nombre: z.string().trim().min(1).max(80),
  emoji: z.string().trim().min(1).max(16).nullable(),
});

/** GET /catalog/emojis: los emojis elegidos por el hogar. */
export const emojisResponseSchema = z.object({
  items: z.array(z.object({ nombreNormalizado: z.string(), emoji: z.string() })),
});

export type CambiarEmojiRequest = z.input<typeof cambiarEmojiRequestSchema>;
export type EmojisResponse = z.infer<typeof emojisResponseSchema>;
export type MiProductoResponse = z.infer<typeof miProductoSchema>;
export type GrupoParecidoResponse = z.infer<typeof grupoParecidoSchema>;
export type MisProductosResponse = z.infer<typeof misProductosResponseSchema>;
export type EstandarizarProductoRequest = z.input<typeof estandarizarProductoRequestSchema>;
export type EstandarizarProductoResponse = z.infer<typeof estandarizarProductoResponseSchema>;
export type ProductoHogarResponse = z.infer<typeof productoHogarSchema>;
export type HouseholdProductsResponse = z.infer<typeof householdProductsResponseSchema>;
export type CategoriaProductoDto = z.infer<typeof categoriaProductoSchema>;
export type ProductoBaseResponse = z.infer<typeof productoBaseSchema>;
export type CatalogProductsResponse = z.infer<typeof catalogProductsResponseSchema>;
