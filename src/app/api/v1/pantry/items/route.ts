import { anadirADespensa } from "@/app/_lib/pantry/despensa-con-catalogo";
import { toLineaDesdeSnapshot } from "@/app/_lib/pantry/to-response";
import { apiRoute } from "@/app/api/_lib/api-route";
import { noContentResponse, resultResponse } from "@/app/api/_lib/responses";
import { addStockRequestSchema } from "@/contracts/pantry";

/**
 * Alta manual. Suma en la línea igual (mismo producto, ubicación y fecha) o abre otra.
 * 204 si ese `id` ya se había guardado (reintento): no suma dos veces.
 */
export const POST = apiRoute({ body: addStockRequestSchema }, async ({ auth, body }) => {
  const result = await anadirADespensa(auth, {
    ...(body.id === undefined ? {} : { movimientoId: body.id }),
    nombre: body.nombre,
    productoBaseId: body.productoBaseId ?? null,
    ...(body.categoria === undefined ? {} : { categoria: body.categoria }),
    ...(body.ubicacionId === undefined ? {} : { ubicacionId: body.ubicacionId }),
    cantidad: body.cantidad,
    caducaEl: body.caducaEl ?? null,
    usuarioId: auth.userId,
  });
  if (!result.ok) return resultResponse(result);
  if (result.value === null) return noContentResponse();
  return resultResponse({ ok: true, value: toLineaDesdeSnapshot(result.value) }, 201);
});
