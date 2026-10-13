import { toShoppingListResponse } from "@/app/_lib/shopping/to-response";
import { apiRoute } from "@/app/api/_lib/api-route";
import { resultResponse } from "@/app/api/_lib/responses";
import { shoppingModule } from "@/domains/shopping/infrastructure/shopping-module";
import { mapResult } from "@/shared/kernel/result";

export const GET = apiRoute({ ids: ["listId"] }, async ({ auth, ids }) => {
  const result = await shoppingModule(auth).getShoppingList.execute({ listId: ids.listId });

  return resultResponse(mapResult(result, toShoppingListResponse));
});
