import { z } from "zod";
import { unidadSchema } from "./shopping";

export const categoriaProductoSchema = z.enum([
  "frutas",
  "verduras",
  "vacuno",
  "pollo_pavo",
  "cerdo_cordero",
  "charcuteria",
  "pescado",
  "lacteos_huevos",
  "panaderia",
  "despensa",
  "especias",
  "bebidas",
  "congelados",
  "limpieza",
  "higiene",
  "otros",
]);

export const productoBaseSchema = z.object({
  id: z.uuid(),
  nombre: z.string(),
  categoria: categoriaProductoSchema,
  unidadPorDefecto: unidadSchema,
});

/** GET /catalog/products: la lista base entera, para filtrar en el cliente. */
export const catalogProductsResponseSchema = z.object({ items: z.array(productoBaseSchema) });

export type CategoriaProductoDto = z.infer<typeof categoriaProductoSchema>;
export type ProductoBaseResponse = z.infer<typeof productoBaseSchema>;
export type CatalogProductsResponse = z.infer<typeof catalogProductsResponseSchema>;
