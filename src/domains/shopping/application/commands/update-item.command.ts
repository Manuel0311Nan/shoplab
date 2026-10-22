import { ShoppingErrors } from "@/domains/shopping/domain/shopping-errors";
import { nombreDeItem, type ShoppingItemSnapshot } from "@/domains/shopping/domain/shopping-item";
import type { CambiosItem } from "@/domains/shopping/domain/shopping-list";
import { Cantidad } from "@/shared/kernel/cantidad";
import { esCategoria } from "@/shared/kernel/categoria";
import type { Clock } from "@/shared/kernel/clock";
import { err, ok, type Result } from "@/shared/kernel/result";
import type { ShoppingListRepository } from "../ports/shopping-list-repository";

export interface UpdateItemInput {
  readonly listId: string;
  readonly itemId: string;
  readonly usuarioId: string;
  readonly cantidad?: { readonly valor: number; readonly unidad: string };
  readonly comprado?: boolean;
  readonly categoria?: string;
  /** Renombrar (corregir el nombre o vincularlo a otro producto de la lista base). */
  readonly producto?: { readonly nombre: string; readonly productoBaseId: string | null };
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
    if (
      input.cantidad === undefined &&
      input.comprado === undefined &&
      input.categoria === undefined &&
      input.producto === undefined
    ) {
      return err(ShoppingErrors.sinCambios());
    }

    let cambios: CambiosItem = input.comprado === undefined ? {} : { comprado: input.comprado };

    if (input.categoria !== undefined) {
      if (!esCategoria(input.categoria)) return err(ShoppingErrors.categoriaNoValida());
      cambios = { ...cambios, categoria: input.categoria };
    }

    if (input.producto !== undefined) {
      const nombre = nombreDeItem(input.producto.nombre);
      if (!nombre.ok) return nombre;
      cambios = {
        ...cambios,
        producto: { nombre: nombre.value, productoBaseId: input.producto.productoBaseId },
      };
    }

    if (input.cantidad !== undefined) {
      const cantidad = Cantidad.create(input.cantidad.valor, input.cantidad.unidad);
      if (!cantidad.ok) return cantidad;
      cambios = { ...cambios, cantidad: cantidad.value };
    }

    return ok(cambios);
  }
}
