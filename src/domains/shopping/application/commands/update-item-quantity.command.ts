import { ShoppingErrors } from "@/domains/shopping/domain/shopping-errors";
import type { ShoppingItemSnapshot } from "@/domains/shopping/domain/shopping-item";
import { Cantidad } from "@/shared/kernel/cantidad";
import type { Clock } from "@/shared/kernel/clock";
import { err, ok, type Result } from "@/shared/kernel/result";
import type { ShoppingListRepository } from "../ports/shopping-list-repository";

export interface UpdateItemQuantityInput {
  readonly listId: string;
  readonly itemId: string;
  readonly cantidad: { readonly valor: number; readonly unidad: string };
}
export class UpdateItemQuantityCommand {
  constructor(
    private readonly lists: ShoppingListRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: UpdateItemQuantityInput): Promise<Result<ShoppingItemSnapshot>> {
    const cantidad = Cantidad.create(input.cantidad.valor, input.cantidad.unidad);
    if (!cantidad.ok) return cantidad;

    const list = await this.lists.findById(input.listId);
    if (list === null) return err(ShoppingErrors.listaNoEncontrada());

    const item = list.cambiarCantidad(input.itemId, cantidad.value, this.clock.now());
    if (!item.ok) return item;

    await this.lists.save(list);
    return ok(item.value.toSnapshot());
  }
}
