import { anadirFaltantes } from "@/app/_lib/recipes/recetas-con-despensa";
import { apiRoute } from "@/app/api/_lib/api-route";
import { resultResponse } from "@/app/api/_lib/responses";
import { faltantesALaListaRequestSchema } from "@/contracts/recipes";

/**
 * Añade a una lista lo que falta para esas raciones (lo calcula el servidor). Lo que
 * ya estaba en la lista no se toca y se cuenta en `yaEstaban`.
 */
export const POST = apiRoute(
  { ids: ["recipeId"], body: faltantesALaListaRequestSchema },
  async ({ auth, ids, body }) =>
    resultResponse(
      await anadirFaltantes(auth, {
        recetaId: ids.recipeId,
        raciones: body.raciones,
        ...(body.listaId === undefined ? {} : { listaId: body.listaId }),
      }),
    ),
);
