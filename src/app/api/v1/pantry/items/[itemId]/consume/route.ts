import { apiRoute } from "@/app/api/_lib/api-route";
import { resultResponse } from "@/app/api/_lib/responses";
import { consumeStockRequestSchema, type ConsumeStockResponse } from "@/contracts/pantry";
import { pantryModule } from "@/domains/pantry/infrastructure/pantry-module";
import { mapResult } from "@/shared/kernel/result";

/** Gastar o tirar (sin cantidad, todo). `avisarLista` propone añadirlo a la lista (D8). */
export const POST = apiRoute(
  { ids: ["itemId"], body: consumeStockRequestSchema },
  async ({ auth, ids, body }) => {
    const result = await pantryModule(auth).consumeStock.execute({
      itemId: ids.itemId,
      motivo: body.motivo,
      usuarioId: auth.userId,
      ...(body.cantidad === undefined ? {} : { cantidad: body.cantidad }),
      ...(body.id === undefined ? {} : { movimientoId: body.id }),
    });
    return resultResponse(
      mapResult(result, (c): ConsumeStockResponse => ({
        linea: {
          id: c.linea.id,
          cantidad: { valor: c.linea.cantidad.valor, unidad: c.linea.cantidad.unidad },
          agotada: c.agotada,
        },
        avisarLista: c.avisarLista,
      })),
    );
  },
);
