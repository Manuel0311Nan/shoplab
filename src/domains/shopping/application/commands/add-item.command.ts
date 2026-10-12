import { ShoppingErrors } from "@/domains/shopping/domain/shopping-errors";
import type { ShoppingItemSnapshot } from "@/domains/shopping/domain/shopping-item";
import { Cantidad } from "@/shared/kernel/cantidad";
import type { Clock } from "@/shared/kernel/clock";
import { newId } from "@/shared/kernel/ids";
import { err, ok, type Result } from "@/shared/kernel/result";
import type { ShoppingListRepository } from "../ports/shopping-list-repository";

export interface AddItemInput {
  readonly listId: string;
  readonly itemId?: string;
  readonly nombre: string;
  readonly cantidad: { readonly valor: number; readonly unidad: string };
  readonly nota?: string | null;
}
export class AddItemCommand {
  constructor(
    private readonly lists: ShoppingListRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: AddItemInput): Promise<Result<ShoppingItemSnapshot>> {
    const cantidad = Cantidad.create(input.cantidad.valor, input.cantidad.unidad);

    if (!cantidad.ok) return cantidad;

    const list = await this.lists.findById(input.listId);

    if (list === null) return err(ShoppingErrors.listaNoEncontrada());

    const item = list.agregarItem(
      {
        id: input.itemId ?? newId(),
        nombre: input.nombre,
        cantidad: cantidad.value,
        nota: input.nota,
      },
      this.clock.now(),
    );

    if (!item.ok) return item;

    await this.lists.save(list);

    return ok(item.value.toSnapshot());
  }
}
