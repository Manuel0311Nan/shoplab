import { misProductos } from "@/app/_lib/catalog/mis-productos";
import { apiRoute } from "@/app/api/_lib/api-route";
import { resultResponse } from "@/app/api/_lib/responses";

/** «Mis productos»: lo escrito a mano por el hogar, con su pack y los posibles duplicados. */
export const GET = apiRoute({}, async ({ auth }) => {
  const response = resultResponse(await misProductos(auth));
  response.headers.set("Cache-Control", "private, no-store");
  return response;
});
