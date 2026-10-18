import { apiRoute } from "@/app/api/_lib/api-route";
import { resultResponse } from "@/app/api/_lib/responses";
import type { CatalogProductsResponse } from "@/contracts/catalog";
import { catalogModule } from "@/domains/catalog/infrastructure/catalog-module";
import { mapResult } from "@/shared/kernel/result";

/**
 * Lista base completa para autocompletar. Igual para todos, cambia solo con un seed:
 * el navegador la guarda un día y luego la revalida en segundo plano.
 */
export const GET = apiRoute({ auth: "identidad" }, async () => {
  const result = await catalogModule().listBaseProducts.execute();
  const response = resultResponse(
    mapResult(result, (items): CatalogProductsResponse => ({ items })),
  );
  if (result.ok) {
    response.headers.set("Cache-Control", "private, max-age=86400, stale-while-revalidate=604800");
  }
  return response;
});
