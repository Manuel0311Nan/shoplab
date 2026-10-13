import { ShoppingErrors } from "@/domains/shopping/domain/shopping-errors";
import type { Clock } from "@/shared/kernel/clock";
import { err, ok, type Result } from "@/shared/kernel/result";
import type { ShoppingListRepository } from "../ports/shopping-list-repository";

export interface RemoveItemInput {
  readonly listId: string;
  readonly itemId: string;
}
export class RemoveItemCommand {
  constructor(
    private readonly lists: ShoppingListRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: RemoveItemInput): Promise<Result<void>> {
    const list = await this.lists.findById(input.listId);
    if (list === null) return err(ShoppingErrors.listaNoEncontrada());

    const result = list.quitarItem(input.itemId, this.clock.now());
    if (!result.ok) return result;

    await this.lists.save(list);
    return ok(undefined);
  }
}
