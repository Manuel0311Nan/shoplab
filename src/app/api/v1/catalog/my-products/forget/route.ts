import { olvidarProducto } from "@/app/_lib/catalog/mis-productos";
import { apiRoute } from "@/app/api/_lib/api-route";
import { noContentResponse, resultResponse } from "@/app/api/_lib/responses";
import { olvidarProductoRequestSchema } from "@/contracts/catalog";

/** Deja de sugerirse en el autocompletado. Las listas y la despensa no cambian. 204. */
export const POST = apiRoute({ body: olvidarProductoRequestSchema }, async ({ auth, body }) => {
  const result = await olvidarProducto(auth, body.nombreNormalizado);
  return result.ok ? noContentResponse() : resultResponse(result);
});
