import { ShoppingErrors } from "@/domains/shopping/domain/shopping-errors";
import type { ShoppingItemSnapshot } from "@/domains/shopping/domain/shopping-item";
import type { Clock } from "@/shared/kernel/clock";
import { err, ok, type Result } from "@/shared/kernel/result";
import type { ShoppingListRepository } from "../ports/shopping-list-repository";

export interface SetItemPurchasedInput {
  readonly listId: string;
  readonly itemId: string;
  readonly comprado: boolean;
  readonly usuarioId: string;
}
export class SetItemPurchasedCommand {
  constructor(
    private readonly lists: ShoppingListRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: SetItemPurchasedInput): Promise<Result<ShoppingItemSnapshot>> {
    const list = await this.lists.findById(input.listId);

    if (list === null) return err(ShoppingErrors.listaNoEncontrada());

    const ahora = this.clock.now();

    const item = input.comprado
      ? list.marcarComprado(input.itemId, input.usuarioId, ahora)
      : list.desmarcarComprado(input.itemId, ahora);

    if (!item.ok) return item;

    await this.lists.save(list);

    return ok(item.value.toSnapshot());
  }
}
