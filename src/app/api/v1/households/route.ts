import { darDeAltaHogar } from "@/app/_lib/households/alta-hogar";
import { apiRoute } from "@/app/api/_lib/api-route";
import { resultResponse } from "@/app/api/_lib/responses";
import { createHouseholdRequestSchema } from "@/contracts/households";

/** Crea el hogar del usuario (y su primera lista). Basta la sesión: aún no hay hogar. */
export const POST = apiRoute(
  { auth: "identidad", body: createHouseholdRequestSchema },
  async ({ auth, body }) => resultResponse(await darDeAltaHogar(auth, body), 201),
);
