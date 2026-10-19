import { apiRoute } from "@/app/api/_lib/api-route";
import { resultResponse } from "@/app/api/_lib/responses";
import type { HouseholdProductsResponse } from "@/contracts/catalog";
import { catalogHogarModule } from "@/domains/catalog/infrastructure/catalog-module";
import { mapResult } from "@/shared/kernel/result";

/**
 * Lo que el hogar ya escribió, para el autocompletado (D1, vista 3). Cambia con cada
 * producto nuevo, así que no se cachea.
 */
export const GET = apiRoute({}, async ({ auth }) => {
  const result = await catalogHogarModule(auth).listHouseholdProducts.execute();
  const response = resultResponse(
    mapResult(result, (items): HouseholdProductsResponse => ({
      items: items.map(({ nombre, categoria, unidad, usos }) => ({
        nombre,
        categoria,
        unidad,
        usos,
      })),
    })),
  );
  response.headers.set("Cache-Control", "private, no-store");
  return response;
});
