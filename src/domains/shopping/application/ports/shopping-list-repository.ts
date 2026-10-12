import type { ShoppingList } from "@/domains/shopping/domain/shopping-list";

export interface ShoppingListRepository {
  findById(id: string): Promise<ShoppingList | null>;
  save(list: ShoppingList): Promise<void>;
}
