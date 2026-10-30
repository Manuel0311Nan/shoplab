import { toLineaDesdeSnapshot } from "@/app/_lib/pantry/to-response";
import { apiRoute } from "@/app/api/_lib/api-route";
import { resultResponse } from "@/app/api/_lib/responses";
import { moveStockRequestSchema, type MoveStockResponse } from "@/contracts/pantry";
import { pantryModule } from "@/domains/pantry/infrastructure/pantry-module";
import { mapResult } from "@/shared/kernel/result";

/**
 * Mover a otra ubicación toda la línea o, con `cantidad`, solo una parte («de las 6
 * leches, 1 a la nevera»). También da por organizado lo que estaba «por organizar».
 */
export const POST = apiRoute(
  { ids: ["itemId"], body: moveStockRequestSchema },
  async ({ auth, ids, body }) => {
    const result = await pantryModule(auth).moveStock.execute({
      itemId: ids.itemId,
      ubicacionId: body.ubicacionId,
      usuarioId: auth.userId,
      ...(body.cantidad === undefined ? {} : { cantidad: body.cantidad }),
      ...(body.lineaNuevaId === undefined ? {} : { lineaNuevaId: body.lineaNuevaId }),
    });
    return resultResponse(
      mapResult(result, (r): MoveStockResponse => ({
        movida: toLineaDesdeSnapshot(r.movida),
        resto: r.resto === null ? null : toLineaDesdeSnapshot(r.resto),
      })),
    );
  },
);
