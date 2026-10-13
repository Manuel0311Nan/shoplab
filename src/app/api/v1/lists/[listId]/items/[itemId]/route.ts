import { toShoppingItemResponse } from "@/app/_lib/shopping/to-response";
import { apiRoute } from "@/app/api/_lib/api-route";
import { errorResponse, noContentResponse, resultResponse } from "@/app/api/_lib/responses";
import { updateItemRequestSchema } from "@/contracts/shopping";
import { shoppingModule } from "@/domains/shopping/infrastructure/shopping-module";
import { mapResult } from "@/shared/kernel/result";

export const PATCH = apiRoute(
  { ids: ["listId", "itemId"], body: updateItemRequestSchema },
  async ({ auth, ids, body }) => {
    const result = await shoppingModule(auth).updateItem.execute({
      listId: ids.listId,
      itemId: ids.itemId,
      usuarioId: auth.userId,
      cantidad: body.cantidad,
      comprado: body.comprado,
    });

    return resultResponse(mapResult(result, toShoppingItemResponse));
  },
);

export const DELETE = apiRoute({ ids: ["listId", "itemId"] }, async ({ auth, ids }) => {
  const result = await shoppingModule(auth).removeItem.execute(ids);

  return result.ok ? noContentResponse() : errorResponse(result.error);
});
