import { toLineaDesdeSnapshot } from "@/app/_lib/pantry/to-response";
import { apiRoute } from "@/app/api/_lib/api-route";
import { resultResponse } from "@/app/api/_lib/responses";
import { deshacerConsumoRequestSchema } from "@/contracts/pantry";
import { pantryModule } from "@/domains/pantry/infrastructure/pantry-module";
import { mapResult } from "@/shared/kernel/result";

/**
 * «Deshacer» un gasto o desecho recién hecho (unos minutos de margen): devuelve lo
 * gastado con un ajuste. Responde con la línea (si vuelve y coincide con otra, la otra).
 */
export const POST = apiRoute(
  { ids: ["movementId"], body: deshacerConsumoRequestSchema },
  async ({ auth, ids, body }) => {
    const result = await pantryModule(auth).deshacerConsumo.execute({
      movimientoId: ids.movementId,
      id: body.id,
      usuarioId: auth.userId,
    });
    return resultResponse(mapResult(result, toLineaDesdeSnapshot));
  },
);
