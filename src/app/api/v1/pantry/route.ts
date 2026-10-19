import { toPantryResponse } from "@/app/_lib/pantry/to-response";
import { apiRoute } from "@/app/api/_lib/api-route";
import { resultResponse } from "@/app/api/_lib/responses";
import { pantryModule } from "@/domains/pantry/infrastructure/pantry-module";
import { mapResult } from "@/shared/kernel/result";

/** La despensa entera (máximo 500 líneas, sin paginar) con sus ubicaciones. */
export const GET = apiRoute({}, async ({ auth }) =>
  resultResponse(mapResult(await pantryModule(auth).getPantry.execute(), toPantryResponse)),
);
