"use client";
import { type CatalogProductsResponse, catalogProductsResponseSchema } from "@/contracts/catalog";

let pendiente: Promise<CatalogProductsResponse["items"]> | null = null;

/**
 * La lista base, descargada una sola vez por pestaña (y cacheada por el navegador un
 * día: ver Cache-Control de la ruta). Si falla, se reintenta en el siguiente foco y el
 * formulario sigue funcionando sin sugerencias.
 */
export function cargarCatalogo(): Promise<CatalogProductsResponse["items"]> {
  pendiente ??= fetch("/api/v1/catalog/products")
    .then(async (res) => {
      if (!res.ok) throw new Error(`catálogo: ${res.status}`);
      return catalogProductsResponseSchema.parse(await res.json()).items;
    })
    .catch((error: unknown) => {
      pendiente = null;
      throw error;
    });
  return pendiente;
}
