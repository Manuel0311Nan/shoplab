import { ShoppingErrors } from "@/domains/shopping/domain/shopping-errors";
import type { ModoTerminarCompra, ShoppingList } from "@/domains/shopping/domain/shopping-list";
import type { Clock } from "@/shared/kernel/clock";
import { err, ok, type Result } from "@/shared/kernel/result";
import type { ShoppingListRepository } from "../ports/shopping-list-repository";
import {
  type ShoppingListView,
  toShoppingListView,
  vistaGeneral,
} from "../queries/get-shopping-list.query";

export interface FinishShoppingInput {
  readonly listId: string;
  readonly modo: ModoTerminarCompra;
}

/**
 * Termina la compra: quita lo comprado (y lo pendiente, si se pide vaciar) y
 * devuelve cómo queda la lista. Repetirla no tiene efecto: no queda nada que quitar.
 *
 * En la lista general, quita lo comprado de todas las listas activas a la vez (en una
 * transacción) y nunca vacía: lo pendiente de cada lista es de esa lista.
 */
export class FinishShoppingCommand {
  constructor(
    private readonly lists: ShoppingListRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: FinishShoppingInput): Promise<Result<ShoppingListView>> {
    const list = await this.lists.findById(input.listId);
    if (list === null) return err(ShoppingErrors.listaNoEncontrada());

    if (list.esGeneral) return this.terminarEnTodas(list);

    const result = list.terminarCompra(input.modo, this.clock.now());
    if (!result.ok) return result;

    if (list.itemsModificados().length > 0) await this.lists.save(list);
    return ok(toShoppingListView(list));
  }

  private async terminarEnTodas(general: ShoppingList): Promise<Result<ShoppingListView>> {
    const ahora = this.clock.now();
    const todas = await this.lists.listarActivasConItems();
    const conGeneral = todas.some((l) => l.id === general.id) ? todas : [general, ...todas];
    for (const list of conGeneral) list.terminarCompra("conservarPendientes", ahora);

    const cambiadas = conGeneral.filter((l) => l.itemsModificados().length > 0);
    if (cambiadas.length > 0) await this.lists.guardarVarias(cambiadas);
    const actual = conGeneral.find((l) => l.id === general.id) ?? general;
    return ok(vistaGeneral(actual, conGeneral));
  }
}
