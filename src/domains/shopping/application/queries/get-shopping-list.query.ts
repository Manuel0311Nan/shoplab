import { ShoppingErrors } from "@/domains/shopping/domain/shopping-errors";
import type { ShoppingItemSnapshot } from "@/domains/shopping/domain/shopping-item";
import type { ShoppingList, ShoppingListSnapshot } from "@/domains/shopping/domain/shopping-list";
import { err, ok, type Result } from "@/shared/kernel/result";
import type { ShoppingListRepository } from "../ports/shopping-list-repository";

/** Un ítem con la lista a la que pertenece (en la general, cada uno viene de la suya). */
export interface ItemDeLista extends ShoppingItemSnapshot {
  readonly listaId: string;
  readonly listaNombre: string;
}

export interface ShoppingListView extends ShoppingListSnapshot {
  readonly items: readonly ItemDeLista[];
}

function itemsDe(list: ShoppingList): ItemDeLista[] {
  return list
    .itemsActivos()
    .map((item) => ({ ...item.toSnapshot(), listaId: list.id, listaNombre: list.nombre }));
}

/** La lista con sus ítems activos, tal como la ven la API y la web. */
export function toShoppingListView(list: ShoppingList): ShoppingListView {
  return { ...list.toSnapshot(), items: itemsDe(list) };
}

/**
 * La lista general: sus propios productos y los de todas las listas activas, en el orden
 * en que se añadieron. Son los mismos ítems (no copias): cambiar uno aquí lo cambia en
 * su lista, y al revés.
 */
export function vistaGeneral(
  general: ShoppingList,
  activas: readonly ShoppingList[],
): ShoppingListView {
  const items = [general, ...activas.filter((l) => l.id !== general.id && !l.esGeneral)]
    .flatMap(itemsDe)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  return { ...general.toSnapshot(), items };
}

export class GetShoppingListQuery {
  constructor(private readonly lists: ShoppingListRepository) {}

  async execute(input: { readonly listId: string }): Promise<Result<ShoppingListView>> {
    const list = await this.lists.findById(input.listId);

    if (list === null) return err(ShoppingErrors.listaNoEncontrada());
    if (list.esGeneral) return ok(vistaGeneral(list, await this.lists.listarActivasConItems()));
    return ok(toShoppingListView(list));
  }
}
