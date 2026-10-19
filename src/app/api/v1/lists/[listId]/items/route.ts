import { toShoppingItemResponse } from "@/app/_lib/shopping/to-response";
import { apiRoute } from "@/app/api/_lib/api-route";
import { resultResponse } from "@/app/api/_lib/responses";
import { addItemRequestSchema } from "@/contracts/shopping";
import { anadirProducto } from "@/app/_lib/shopping/productos-con-catalogo";
import { mapResult } from "@/shared/kernel/result";

export const POST = apiRoute(
  { ids: ["listId"], body: addItemRequestSchema },
  async ({ auth, ids, body }) => {
    const result = await anadirProducto(auth, {
      listId: ids.listId,
      itemId: body.id,
      nombre: body.nombre,
      cantidad: body.cantidad,
      nota: body.nota ?? null,
      productoBaseId: body.productoBaseId ?? null,
      ...(body.categoria === undefined ? {} : { categoria: body.categoria }),
      ...(body.duplicado === undefined ? {} : { duplicado: body.duplicado }),
      ...(body.unidadFinal === undefined ? {} : { unidadFinal: body.unidadFinal }),
      ...(body.cantidadFinal === undefined ? {} : { cantidadFinal: body.cantidadFinal }),
    });

    return resultResponse(mapResult(result, toShoppingItemResponse), 201);
  },
);
