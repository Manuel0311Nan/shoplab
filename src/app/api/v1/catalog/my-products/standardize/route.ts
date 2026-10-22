import { estandarizarProducto } from "@/app/_lib/catalog/mis-productos";
import { apiRoute } from "@/app/api/_lib/api-route";
import { resultResponse } from "@/app/api/_lib/responses";
import { estandarizarProductoRequestSchema } from "@/contracts/catalog";

/**
 * Renombrar o unir un producto del hogar: se aplica en la memoria del hogar, en las
 * listas activas y en la despensa. Devuelve cuántos ítems y líneas cambiaron.
 */
export const POST = apiRoute(
  { body: estandarizarProductoRequestSchema },
  async ({ auth, body }) => {
    return resultResponse(
      await estandarizarProducto(auth, {
        desde: body.desde,
        nombre: body.nombre,
        ...(body.productoBaseId == null ? {} : { productoBaseId: body.productoBaseId }),
        ...(body.categoria === undefined ? {} : { categoria: body.categoria }),
        ...(body.unidad === undefined ? {} : { unidad: body.unidad }),
        ...(body.unidadesPorPack === undefined ? {} : { unidadesPorPack: body.unidadesPorPack }),
      }),
    );
  },
);
