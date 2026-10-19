import { toUbicacionResponse } from "@/app/_lib/pantry/to-response";
import { apiRoute } from "@/app/api/_lib/api-route";
import { resultResponse } from "@/app/api/_lib/responses";
import { createUbicacionRequestSchema } from "@/contracts/pantry";
import { pantryModule } from "@/domains/pantry/infrastructure/pantry-module";
import { mapResult } from "@/shared/kernel/result";

export const GET = apiRoute({}, async ({ auth }) =>
  resultResponse(
    mapResult(await pantryModule(auth).getPantry.execute(), (v) => ({
      items: v.ubicaciones.map(toUbicacionResponse),
    })),
  ),
);

/** Nueva ubicación al final. Máximo 12, sin nombres repetidos. */
export const POST = apiRoute({ body: createUbicacionRequestSchema }, async ({ auth, body }) => {
  const result = await pantryModule(auth).createUbicacion.execute({
    nombre: body.nombre,
    tipo: body.tipo,
    ...(body.id === undefined ? {} : { id: body.id }),
  });
  return resultResponse(mapResult(result, toUbicacionResponse), 201);
});
