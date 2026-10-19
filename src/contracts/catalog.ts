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

export type ProductoHogarResponse = z.infer<typeof productoHogarSchema>;
export type HouseholdProductsResponse = z.infer<typeof householdProductsResponseSchema>;
export type CategoriaProductoDto = z.infer<typeof categoriaProductoSchema>;
export type ProductoBaseResponse = z.infer<typeof productoBaseSchema>;
export type CatalogProductsResponse = z.infer<typeof catalogProductsResponseSchema>;
