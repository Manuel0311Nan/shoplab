import { ShoppingList, type ShoppingListSnapshot } from "@/domains/shopping/domain/shopping-list";
import type { Clock } from "@/shared/kernel/clock";
import { newId } from "@/shared/kernel/ids";
import { ok, type Result } from "@/shared/kernel/result";
import type { ShoppingListRepository } from "../ports/shopping-list-repository";

export interface CreateShoppingListInput {
  /** Generable en el cliente (UUIDv7) para crear listas sin conexión. */
  readonly listId?: string;
  readonly nombre: string;
}

/** Crea una lista vacía en el hogar del AuthContext. La vista 2 la usará también desde la UI. */
export class CreateShoppingListCommand {
  constructor(
    private readonly lists: ShoppingListRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: CreateShoppingListInput): Promise<Result<ShoppingListSnapshot>> {
    const list = ShoppingList.create(
      { id: input.listId ?? newId(), nombre: input.nombre },
      this.clock.now(),
    );
    if (!list.ok) return list;

    await this.lists.save(list.value);

    return ok(list.value.toSnapshot());
  }
}
