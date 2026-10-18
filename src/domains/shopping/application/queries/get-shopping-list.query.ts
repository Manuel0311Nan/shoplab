import { ShoppingErrors } from "@/domains/shopping/domain/shopping-errors";
import type { ShoppingItemSnapshot } from "@/domains/shopping/domain/shopping-item";
import type { ShoppingList, ShoppingListSnapshot } from "@/domains/shopping/domain/shopping-list";
import { err, ok, type Result } from "@/shared/kernel/result";
import type { ShoppingListRepository } from "../ports/shopping-list-repository";

export interface ShoppingListView extends ShoppingListSnapshot {
  readonly items: readonly ShoppingItemSnapshot[];
}

/** La lista con sus ítems activos, tal como la ven la API y la web. */
export function toShoppingListView(list: ShoppingList): ShoppingListView {
  return {
    ...list.toSnapshot(),
    items: list.itemsActivos().map((item) => item.toSnapshot()),
  };
}

export class GetShoppingListQuery {
  constructor(private readonly lists: ShoppingListRepository) {}

  async execute(input: { readonly listId: string }): Promise<Result<ShoppingListView>> {
    const list = await this.lists.findById(input.listId);

    if (list === null) return err(ShoppingErrors.listaNoEncontrada());
    return ok(toShoppingListView(list));
  }
}
