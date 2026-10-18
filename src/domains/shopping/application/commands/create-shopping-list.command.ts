import { ShoppingList, type ShoppingListSnapshot } from "@/domains/shopping/domain/shopping-list";
import type { Clock } from "@/shared/kernel/clock";
import { newId } from "@/shared/kernel/ids";
import { ok, type Result } from "@/shared/kernel/result";
import { hacerSitio } from "../limite-de-listas";
import type { ShoppingListRepository } from "../ports/shopping-list-repository";

export interface CreateShoppingListInput {
  /** Generable en el cliente (UUIDv7) para crear listas sin conexión. */
  readonly listId?: string;
  readonly nombre: string;
  /** Con 15 activas: la lista que el usuario eligió archivar para hacer sitio. */
  readonly archivarListaId?: string;
}

/**
 * Crea una lista vacía en el hogar del AuthContext. Con 15 activas devuelve
 * LIMITE_DE_LISTAS (con las activas, para elegir) salvo que llegue `archivarListaId`:
 * entonces archiva esa y crea la nueva en la misma transacción.
 */
export class CreateShoppingListCommand {
  constructor(
    private readonly lists: ShoppingListRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: CreateShoppingListInput): Promise<Result<ShoppingListSnapshot>> {
    const ahora = this.clock.now();
    const list = ShoppingList.create({ id: input.listId ?? newId(), nombre: input.nombre }, ahora);
    if (!list.ok) return list;

    const archivada = await hacerSitio(this.lists, input.archivarListaId, ahora);
    if (!archivada.ok) return archivada;

    await this.lists.guardarVarias(
      archivada.value === null ? [list.value] : [archivada.value, list.value],
    );

    return ok(list.value.toSnapshot());
  }
}
