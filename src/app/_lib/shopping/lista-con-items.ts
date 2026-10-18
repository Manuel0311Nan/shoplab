import "server-only";
import type { ShoppingListResponse } from "@/contracts/shopping";
import type { ShoppingModule } from "@/domains/shopping/infrastructure/shopping-module";
import { mapResult, type Result } from "@/shared/kernel/result";
import { toShoppingListResponse } from "./to-response";

/** Tras modificar la lista, la respuesta incluye sus ítems como el GET. */
export async function getListaConItems(
  shopping: ShoppingModule,
  listId: string,
): Promise<Result<ShoppingListResponse>> {
  return mapResult(await shopping.getShoppingList.execute({ listId }), toShoppingListResponse);
}
