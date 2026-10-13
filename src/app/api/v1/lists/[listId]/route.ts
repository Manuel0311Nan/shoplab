import { toShoppingListResponse } from "@/app/_lib/shopping/to-response";
import { parseId } from "@/app/api/_lib/parse";
import { errorResponse, resultResponse } from "@/app/api/_lib/responses";
import { shoppingModule } from "@/domains/shopping/infrastructure/shopping-module";
import { getAuthContext } from "@/shared/kernel/auth-context";
import { ok } from "@/shared/kernel/result";

type Params = { params: Promise<{ listId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const auth = await getAuthContext();
  if (!auth.ok) return errorResponse(auth.error);
  const listId = parseId((await params).listId);
  if (!listId.ok) return errorResponse(listId.error);
  const result = await shoppingModule(auth.value).getShoppingList.execute({
    listId: listId.value,
  });
  if (!result.ok) return errorResponse(result.error);
  return resultResponse(ok(toShoppingListResponse(result.value)));
}
