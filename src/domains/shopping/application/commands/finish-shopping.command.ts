import { ShoppingErrors } from "@/domains/shopping/domain/shopping-errors";
import type { ModoTerminarCompra } from "@/domains/shopping/domain/shopping-list";
import type { Clock } from "@/shared/kernel/clock";
import { err, ok, type Result } from "@/shared/kernel/result";
import type { ShoppingListRepository } from "../ports/shopping-list-repository";
import { type ShoppingListView, toShoppingListView } from "../queries/get-shopping-list.query";

export interface FinishShoppingInput {
  readonly listId: string;
  readonly modo: ModoTerminarCompra;
}

/**
 * Termina la compra: quita lo comprado (y lo pendiente, si se pide vaciar) y
 * devuelve cómo queda la lista. Repetirla no tiene efecto: no queda nada que quitar.
 */
export class FinishShoppingCommand {
  constructor(
    private readonly lists: ShoppingListRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: FinishShoppingInput): Promise<Result<ShoppingListView>> {
    const list = await this.lists.findById(input.listId);
    if (list === null) return err(ShoppingErrors.listaNoEncontrada());

    const result = list.terminarCompra(input.modo, this.clock.now());
    if (!result.ok) return result;

    if (list.itemsModificados().length > 0) await this.lists.save(list);
    return ok(toShoppingListView(list));
  }
}
