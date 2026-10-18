import { toShoppingListResponse } from "@/app/_lib/shopping/to-response";
import { apiRoute } from "@/app/api/_lib/api-route";
import { resultResponse } from "@/app/api/_lib/responses";
import { finishShoppingRequestSchema } from "@/contracts/shopping";
import { shoppingModule } from "@/domains/shopping/infrastructure/shopping-module";
import { mapResult } from "@/shared/kernel/result";

/** Termina la compra y devuelve la lista tal como queda. */
export const POST = apiRoute(
  { ids: ["listId"], body: finishShoppingRequestSchema },
  async ({ auth, ids, body }) => {
    const result = await shoppingModule(auth).finishShopping.execute({
      listId: ids.listId,
      modo: body.modo,
    });

    return resultResponse(mapResult(result, toShoppingListResponse));
  },
);
