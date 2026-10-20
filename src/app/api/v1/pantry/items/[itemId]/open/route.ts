import { abrirEnDespensa } from "@/app/_lib/pantry/despensa-con-catalogo";
import { toLineaDesdeSnapshot } from "@/app/_lib/pantry/to-response";
import { apiRoute } from "@/app/api/_lib/api-route";
import { resultResponse } from "@/app/api/_lib/responses";
import { openStockRequestSchema, type OpenStockResponse } from "@/contracts/pantry";
import { mapResult } from "@/shared/kernel/result";

/**
 * «Lo he abierto». Con varias unidades se abre una (su propia línea) y en la original
 * queda el resto. No cambia la caducidad: avisa en verde, amarillo o rojo según los días
 * que lleva abierto.
 */
export const POST = apiRoute(
  { ids: ["itemId"], body: openStockRequestSchema },
  async ({ auth, ids, body }) => {
    const result = await abrirEnDespensa(auth, {
      itemId: ids.itemId,
      usuarioId: auth.userId,
      ...(body.abiertoEl === undefined ? {} : { abiertoEl: body.abiertoEl }),
      ...(body.lineaNuevaId === undefined ? {} : { lineaNuevaId: body.lineaNuevaId }),
    });
    return resultResponse(
      mapResult(result, (r): OpenStockResponse => ({
        abierta: toLineaDesdeSnapshot(r.abierta),
        resto: r.resto === null ? null : toLineaDesdeSnapshot(r.resto),
      })),
    );
  },
);
