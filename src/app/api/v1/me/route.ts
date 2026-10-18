import type { MeResponse } from "@/contracts/me";
import { apiRoute } from "@/app/api/_lib/api-route";
import { resultResponse } from "@/app/api/_lib/responses";
import { getAuthContext } from "@/shared/kernel/auth-context";
import { ok } from "@/shared/kernel/result";

/** Quién soy y con qué hogar trabajo. Responde también sin hogar, para que la app sepa pedirlo. */
export const GET = apiRoute({ auth: "identidad" }, async ({ auth }) => {
  const contexto = await getAuthContext();
  return resultResponse(
    ok<MeResponse>({
      userId: auth.userId,
      nombre: auth.nombre,
      email: auth.email,
      hogarId: contexto.ok ? contexto.value.hogarId : null,
    }),
  );
});
