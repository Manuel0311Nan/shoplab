import { toUbicacionResponse } from "@/app/_lib/pantry/to-response";
import { apiRoute } from "@/app/api/_lib/api-route";
import { noContentResponse, resultResponse } from "@/app/api/_lib/responses";
import { deleteUbicacionQuerySchema, updateUbicacionRequestSchema } from "@/contracts/pantry";
import { pantryModule } from "@/domains/pantry/infrastructure/pantry-module";
import { mapResult } from "@/shared/kernel/result";

/** Renombrar, cambiar el tipo o mover a otra posición (1 = la primera). */
export const PATCH = apiRoute(
  { ids: ["locationId"], body: updateUbicacionRequestSchema },
  async ({ auth, ids, body }) => {
    const result = await pantryModule(auth).updateUbicacion.execute({
      id: ids.locationId,
      ...(body.nombre === undefined ? {} : { nombre: body.nombre }),
      ...(body.tipo === undefined ? {} : { tipo: body.tipo }),
      ...(body.posicion === undefined ? {} : { posicion: body.posicion }),
    });
    return resultResponse(mapResult(result, toUbicacionResponse));
  },
);

/** Con productos dentro hace falta ?destinoId=: se mueven allí. 204. */
export const DELETE = apiRoute(
  { ids: ["locationId"], query: deleteUbicacionQuerySchema },
  async ({ auth, ids, query }) => {
    const result = await pantryModule(auth).deleteUbicacion.execute({
      id: ids.locationId,
      usuarioId: auth.userId,
      ...(query.destinoId === undefined ? {} : { destinoId: query.destinoId }),
    });
    return result.ok ? noContentResponse() : resultResponse(result);
  },
);
