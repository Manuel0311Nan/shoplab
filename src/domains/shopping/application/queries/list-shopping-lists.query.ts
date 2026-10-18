import type { ShoppingListSnapshot } from "@/domains/shopping/domain/shopping-list";
import { ok, type Result } from "@/shared/kernel/result";
import type { ShoppingListRepository } from "../ports/shopping-list-repository";

export const LIMITE_LISTAS = 50;

/**
 * Listas activas del hogar. Hoy solo la usa la portada para abrir la primera;
 * la vista 2 ("Mis listas") la ampliará con paginación por cursor.
 */
export class ListShoppingListsQuery {
  constructor(private readonly lists: ShoppingListRepository) {}

  async execute(): Promise<Result<ShoppingListSnapshot[]>> {
    return ok(await this.lists.listarActivas(LIMITE_LISTAS));
  }
}
