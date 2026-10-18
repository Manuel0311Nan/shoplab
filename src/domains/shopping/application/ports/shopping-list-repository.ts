import type { ShoppingList, ShoppingListSnapshot } from "@/domains/shopping/domain/shopping-list";

export interface ShoppingListRepository {
  findById(id: string): Promise<ShoppingList | null>;
  /** Listas sin archivar ni borrar del hogar, de la más antigua a la más reciente. */
  listarActivas(limite: number): Promise<ShoppingListSnapshot[]>;
  save(list: ShoppingList): Promise<void>;
}
