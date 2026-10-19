import { actualizarEnDespensa } from "@/app/_lib/pantry/despensa-con-catalogo";
import { toLineaDesdeSnapshot } from "@/app/_lib/pantry/to-response";
import { apiRoute } from "@/app/api/_lib/api-route";
import { noContentResponse, resultResponse } from "@/app/api/_lib/responses";
import { updateStockRequestSchema } from "@/contracts/pantry";
import { pantryModule } from "@/domains/pantry/infrastructure/pantry-module";
import { mapResult } from "@/shared/kernel/result";

/**
 * Mover, poner o quitar la caducidad, cambiar la categoría o corregir la cantidad. Si
 * coincide con otra línea igual se juntan: la respuesta es la línea que queda (otro id).
 */
export const PATCH = apiRoute(
  { ids: ["itemId"], body: updateStockRequestSchema },
  async ({ auth, ids, body }) => {
    const result = await actualizarEnDespensa(auth, {
      itemId: ids.itemId,
      usuarioId: auth.userId,
      ...(body.ubicacionId === undefined ? {} : { ubicacionId: body.ubicacionId }),
      ...(body.caducaEl === undefined ? {} : { caducaEl: body.caducaEl }),
      ...(body.categoria === undefined ? {} : { categoria: body.categoria }),
      ...(body.cantidad === undefined ? {} : { cantidad: body.cantidad }),
    });
    return resultResponse(mapResult(result, toLineaDesdeSnapshot));
  },
);

/** Quitar una línea añadida por error. 204. */
export const DELETE = apiRoute({ ids: ["itemId"] }, async ({ auth, ids }) => {
  const result = await pantryModule(auth).removeStock.execute({
    itemId: ids.itemId,
    usuarioId: auth.userId,
  });
  return result.ok ? noContentResponse() : resultResponse(result);
});
