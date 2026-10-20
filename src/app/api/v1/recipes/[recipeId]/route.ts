import { verReceta } from "@/app/_lib/recipes/recetas-con-despensa";
import { toRecetaDetalle } from "@/app/_lib/recipes/to-response";
import { apiRoute } from "@/app/api/_lib/api-route";
import { resultResponse } from "@/app/api/_lib/responses";
import { recetaQuerySchema } from "@/contracts/recipes";
import { mapResult } from "@/shared/kernel/result";

/** Una receta cruzada con la despensa. `?raciones=` para ver qué falta con otras raciones. */
export const GET = apiRoute(
  { ids: ["recipeId"], query: recetaQuerySchema },
  async ({ auth, ids, query }) =>
    resultResponse(mapResult(await verReceta(auth, ids.recipeId, query.raciones), toRecetaDetalle)),
);
