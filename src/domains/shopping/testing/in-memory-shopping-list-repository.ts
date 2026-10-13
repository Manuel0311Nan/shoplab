import type { ShoppingListRepository } from "@/domains/shopping/application/ports/shopping-list-repository";
import type { ShoppingList } from "@/domains/shopping/domain/shopping-list";

export class InMemoryShoppingListRepository implements ShoppingListRepository {
  private readonly store = new Map<string, ShoppingList>();
  saveCount = 0;
  constructor(lists: readonly ShoppingList[] = []) {
    for (const list of lists) this.store.set(list.id, list);
  }
  async findById(id: string): Promise<ShoppingList | null> {
    return this.store.get(id) ?? null;
  }
  async save(list: ShoppingList): Promise<void> {
    this.store.set(list.id, list);
    this.saveCount += 1;
  }
}
