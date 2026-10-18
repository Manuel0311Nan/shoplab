import { ShoppingErrors } from "@/domains/shopping/domain/shopping-errors";
import type { ShoppingItemSnapshot } from "@/domains/shopping/domain/shopping-item";
import type { OpcionesDuplicado } from "@/domains/shopping/domain/shopping-list";
import { Cantidad } from "@/shared/kernel/cantidad";
import type { Clock } from "@/shared/kernel/clock";
import { newId } from "@/shared/kernel/ids";
import { err, ok, type Result } from "@/shared/kernel/result";
import type { ShoppingListRepository } from "../ports/shopping-list-repository";

interface CantidadInput {
  readonly valor: number;
  readonly unidad: string;
}

export interface AddItemInput {
  readonly listId: string;
  readonly itemId?: string;
  readonly nombre: string;
  readonly cantidad: CantidadInput;
  readonly nota?: string | null;
  /** Producto de la lista base elegido al autocompletar. */
  readonly productoBaseId?: string | null;
  /** Respuesta del usuario a POSIBLE_DUPLICADO. */
  readonly duplicado?: "unir" | "separar";
  /** Respuesta a UNIDADES_DISTINTAS: unidad en la que contar el total. */
  readonly unidadFinal?: string;
  /** Respuesta a UNIDADES_DISTINTAS cuando no se pueden convertir: el total exacto. */
  readonly cantidadFinal?: CantidadInput;
}

/**
 * Añade un producto. Si ya hay uno parecido devuelve POSIBLE_DUPLICADO (409) con el
 * existente; el cliente vuelve a llamar con `duplicado`. Al unir unidades distintas
 * puede devolver UNIDADES_DISTINTAS (422) hasta recibir `unidadFinal` o `cantidadFinal`.
 */
export class AddItemCommand {
  constructor(
    private readonly lists: ShoppingListRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: AddItemInput): Promise<Result<ShoppingItemSnapshot>> {
    const cantidad = Cantidad.create(input.cantidad.valor, input.cantidad.unidad);
    if (!cantidad.ok) return cantidad;

    const opciones = construirOpciones(input);
    if (!opciones.ok) return opciones;

    const list = await this.lists.findById(input.listId);
    if (list === null) return err(ShoppingErrors.listaNoEncontrada());

    const item = list.agregarItem(
      {
        id: input.itemId ?? newId(),
        nombre: input.nombre,
        cantidad: cantidad.value,
        nota: input.nota,
        productoBaseId: input.productoBaseId ?? null,
      },
      this.clock.now(),
      opciones.value,
    );
    if (!item.ok) return item;

    await this.lists.save(list);

    return ok(item.value.toSnapshot());
  }
}

function construirOpciones(input: AddItemInput): Result<OpcionesDuplicado> {
  let opciones: OpcionesDuplicado = input.duplicado ? { duplicado: input.duplicado } : {};

  if (input.unidadFinal !== undefined) {
    // Valida la unidad con las mismas reglas que una cantidad.
    const unidad = Cantidad.create(1, input.unidadFinal);
    if (!unidad.ok) return unidad;
    opciones = { ...opciones, unidadFinal: unidad.value.unidad };
  }
  if (input.cantidadFinal !== undefined) {
    const total = Cantidad.create(input.cantidadFinal.valor, input.cantidadFinal.unidad);
    if (!total.ok) return total;
    opciones = { ...opciones, cantidadFinal: total.value };
  }
  return ok(opciones);
}
