import { apiRoute } from "@/app/api/_lib/api-route";
import { noContentResponse, resultResponse } from "@/app/api/_lib/responses";
import { cambiarEmojiRequestSchema, type EmojisResponse } from "@/contracts/catalog";
import { catalogHogarModule } from "@/domains/catalog/infrastructure/catalog-module";
import { mapResult } from "@/shared/kernel/result";

/**
 * Los emojis que ha elegido el hogar. Los de por defecto no viajan: salen del nombre
 * con `emojiPorDefecto` (kernel), igual en el servidor y en el cliente.
 */
export const GET = apiRoute({}, async ({ auth }) => {
  const result = await catalogHogarModule(auth).emojis.execute();
  const response = resultResponse(
    mapResult(result, (mapa): EmojisResponse => ({
      items: [...mapa].map(([nombreNormalizado, emoji]) => ({ nombreNormalizado, emoji })),
    })),
  );
  response.headers.set("Cache-Control", "private, no-store");
  return response;
});

/** Elegir el emoji de un producto (null: vuelve al de por defecto). 204. */
export const PUT = apiRoute({ body: cambiarEmojiRequestSchema }, async ({ auth, body }) => {
  const result = await catalogHogarModule(auth).cambiarEmoji.execute(body);
  return result.ok ? noContentResponse() : resultResponse(result);
});
