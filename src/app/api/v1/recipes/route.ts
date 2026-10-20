import { sugerirRecetas } from "@/app/_lib/recipes/recetas-con-despensa";
import { toRecetaResumen } from "@/app/_lib/recipes/to-response";
import { apiRoute } from "@/app/api/_lib/api-route";
import { resultResponse } from "@/app/api/_lib/responses";
import type { SugerenciasResponse } from "@/contracts/recipes";
import { mapResult } from "@/shared/kernel/result";

/**
 * Recetas según la despensa del hogar: primero las que se pueden hacer (con las
 * raciones ajustadas a lo que hay), después las que casi.
 */
export const GET = apiRoute({}, async ({ auth }) =>
  resultResponse(
    mapResult(await sugerirRecetas(auth), (s): SugerenciasResponse => ({
      puedes: s.puedes.map(toRecetaResumen),
      casi: s.casi.map(toRecetaResumen),
      masCompra: s.masCompra,
      despensaVacia: s.despensaVacia,
    })),
  ),
);
