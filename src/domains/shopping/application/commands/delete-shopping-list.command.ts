import { ShoppingErrors } from "@/domains/shopping/domain/shopping-errors";
import type { Clock } from "@/shared/kernel/clock";
import { err, ok, type Result } from "@/shared/kernel/result";
import type { ShoppingListRepository } from "../ports/shopping-list-repository";

/** Borrado definitivo para el usuario (en BD queda como tombstone con deletedAt). */
export class DeleteShoppingListCommand {
  constructor(
    private readonly lists: ShoppingListRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: { readonly listId: string }): Promise<Result<void>> {
    const list = await this.lists.findById(input.listId);
    if (list === null) return err(ShoppingErrors.listaNoEncontrada());
    if (list.esGeneral) return err(ShoppingErrors.listaGeneral());

    list.eliminar(this.clock.now());
    await this.lists.save(list);
    return ok(undefined);
  }
}
