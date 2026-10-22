import { nombreDeItem } from "@/domains/shopping/domain/shopping-item";
import type { ShoppingList } from "@/domains/shopping/domain/shopping-list";
import type { Categoria } from "@/shared/kernel/categoria";
import type { Clock } from "@/shared/kernel/clock";
import { ok, type Result } from "@/shared/kernel/result";
import type { ShoppingListRepository } from "../ports/shopping-list-repository";

export interface RenombrarEnListasInput {
  /** Nombre normalizado de lo que se renombra. */
  readonly desde: string;
  readonly nombre: string;
  readonly productoBaseId: string | null;
  readonly categoria: Categoria;
}

/**
 * Estandarizar un producto del hogar: en todas las listas activas, lo que se llama
 * `desde` pasa a llamarse `nombre` (con su vínculo y categoría). Todo en una transacción.
 */
export class RenombrarEnListasCommand {
  constructor(
    private readonly lists: ShoppingListRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: RenombrarEnListasInput): Promise<Result<number>> {
    const nombre = nombreDeItem(input.nombre);
    if (!nombre.ok) return nombre;

    const ahora = this.clock.now();
    const cambiadas: ShoppingList[] = [];
    let total = 0;
    for (const lista of await this.lists.listarActivasConItems()) {
      const r = lista.renombrarProducto(
        input.desde,
        { nombre: nombre.value, productoBaseId: input.productoBaseId, categoria: input.categoria },
        ahora,
      );
      if (!r.ok) return r;
      if (r.value > 0) cambiadas.push(lista);
      total += r.value;
    }
    if (cambiadas.length > 0) await this.lists.guardarVarias(cambiadas);
    return ok(total);
  }
}
