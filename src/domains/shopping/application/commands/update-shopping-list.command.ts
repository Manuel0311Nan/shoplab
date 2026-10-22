import { ShoppingErrors } from "@/domains/shopping/domain/shopping-errors";
import type { ShoppingListSnapshot } from "@/domains/shopping/domain/shopping-list";
import type { Clock } from "@/shared/kernel/clock";
import { err, ok, type Result } from "@/shared/kernel/result";
import { hacerSitio } from "../limite-de-listas";
import type { ShoppingListRepository } from "../ports/shopping-list-repository";

export interface UpdateShoppingListInput {
  readonly listId: string;
  readonly nombre?: string;
  /** true archiva (empieza la cuenta de 15 días); false la recupera. */
  readonly archivada?: boolean;
  /** Al desarchivar con 15 activas: la lista que se archiva a cambio. */
  readonly archivarListaId?: string;
}

/** Renombrar, archivar o desarchivar. Los cambios se aplican todos o ninguno. */
export class UpdateShoppingListCommand {
  constructor(
    private readonly lists: ShoppingListRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: UpdateShoppingListInput): Promise<Result<ShoppingListSnapshot>> {
    if (input.nombre === undefined && input.archivada === undefined) {
      return err(ShoppingErrors.sinCambiosLista());
    }
    const ahora = this.clock.now();
    const list = await this.lists.findById(input.listId);
    if (list === null) return err(ShoppingErrors.listaNoEncontrada());

    if (input.nombre !== undefined) {
      const renombrada = list.renombrar(input.nombre, ahora);
      if (!renombrada.ok) return renombrada;
    }

    if (input.archivada === true) {
      if (list.esGeneral) return err(ShoppingErrors.listaGeneral());
      list.archivar(ahora);
    }

    if (input.archivada === false && list.estaArchivada) {
      const otra = await hacerSitio(this.lists, input.archivarListaId, ahora);
      if (!otra.ok) return otra;
      list.desarchivar(ahora);
      await this.lists.guardarVarias(otra.value === null ? [list] : [otra.value, list]);
      return ok(list.toSnapshot());
    }

    await this.lists.save(list);
    return ok(list.toSnapshot());
  }
}
