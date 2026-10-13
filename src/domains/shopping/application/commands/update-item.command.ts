import { ShoppingErrors } from "@/domains/shopping/domain/shopping-errors";
import type { ShoppingItemSnapshot } from "@/domains/shopping/domain/shopping-item";
import type { CambiosItem } from "@/domains/shopping/domain/shopping-list";
import { Cantidad } from "@/shared/kernel/cantidad";
import type { Clock } from "@/shared/kernel/clock";
import { err, ok, type Result } from "@/shared/kernel/result";
import type { ShoppingListRepository } from "../ports/shopping-list-repository";

export interface UpdateItemInput {
  readonly listId: string;
  readonly itemId: string;
  readonly usuarioId: string;
  readonly cantidad?: { readonly valor: number; readonly unidad: string };
  readonly comprado?: boolean;
}

/**
 * Actualización parcial de un ítem (lo que hace un PATCH).
 * Todos los cambios se aplican al agregado y se guardan con un único `save`:
 * si uno falla, no se persiste ninguno.
 */
export class UpdateItemCommand {
  constructor(
    private readonly lists: ShoppingListRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: UpdateItemInput): Promise<Result<ShoppingItemSnapshot>> {
    const cambios = this.construirCambios(input);
    if (!cambios.ok) return cambios;

    const list = await this.lists.findById(input.listId);
    if (list === null) return err(ShoppingErrors.listaNoEncontrada());

    const item = list.actualizarItem(
      input.itemId,
      cambios.value,
      input.usuarioId,
      this.clock.now(),
    );
    if (!item.ok) return item;

    await this.lists.save(list);
    return ok(item.value.toSnapshot());
  }

  /** Valida la entrada antes de tocar el repositorio. */
  private construirCambios(input: UpdateItemInput): Result<CambiosItem> {
    if (input.cantidad === undefined && input.comprado === undefined) {
      return err(ShoppingErrors.sinCambios());
    }

    if (input.cantidad === undefined) return ok({ comprado: input.comprado });

    const cantidad = Cantidad.create(input.cantidad.valor, input.cantidad.unidad);
    if (!cantidad.ok) return cantidad;

    return ok({ cantidad: cantidad.value, comprado: input.comprado });
  }
}
