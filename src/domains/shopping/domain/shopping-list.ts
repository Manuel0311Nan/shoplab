import type { Cantidad } from "@/shared/kernel/cantidad";
import { err, ok, type Result } from "@/shared/kernel/result";
import { ShoppingErrors } from "./shopping-errors";
import { type NewShoppingItem, ShoppingItem, type ShoppingItemSnapshot } from "./shopping-item";

export interface ShoppingListSnapshot {
  readonly id: string;
  readonly nombre: string;
  readonly archivadaAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export const MAX_ITEMS_POR_LISTA = 200;

export class ShoppingList {
  private readonly modificados = new Set<string>();

  private constructor(
    private state: ShoppingListSnapshot,
    private readonly items: Map<string, ShoppingItem>,
  ) {}

  static rehydrate(snapshot: ShoppingListSnapshot, items: readonly ShoppingItem[]): ShoppingList {
    return new ShoppingList(snapshot, new Map(items.map((item) => [item.id, item])));
  }

  get id(): string {
    return this.state.id;
  }

  get estaArchivada(): boolean {
    return this.state.archivadaAt !== null;
  }

  itemsActivos(): ShoppingItem[] {
    return [...this.items.values()].filter((item) => !item.estaQuitado);
  }

  agregarItem(input: NewShoppingItem, ahora: Date): Result<ShoppingItem> {
    if (this.estaArchivada) return err(ShoppingErrors.listaArchivada());
    if (this.items.has(input.id)) return err(ShoppingErrors.itemYaExiste());
    if (this.itemsActivos().length >= MAX_ITEMS_POR_LISTA) {
      return err(ShoppingErrors.listaLlena(MAX_ITEMS_POR_LISTA));
    }
    const item = ShoppingItem.create(input, ahora);

    if (!item.ok) return item;
    this.items.set(item.value.id, item.value);
    this.registrarCambio(item.value.id, ahora);
    return item;
  }

  marcarComprado(itemId: string, usuarioId: string, ahora: Date): Result<ShoppingItem> {
    return this.modificarItem(itemId, ahora, (item) => item.marcarComprado(usuarioId, ahora));
  }

  desmarcarComprado(itemId: string, ahora: Date): Result<ShoppingItem> {
    return this.modificarItem(itemId, ahora, (item) => item.desmarcarComprado(ahora));
  }

  cambiarCantidad(itemId: string, cantidad: Cantidad, ahora: Date): Result<ShoppingItem> {
    return this.modificarItem(itemId, ahora, (item) => item.cambiarCantidad(cantidad, ahora));
  }

  quitarItem(itemId: string, ahora: Date): Result<ShoppingItem> {
    return this.modificarItem(itemId, ahora, (item) => item.quitar(ahora));
  }

  toSnapshot(): ShoppingListSnapshot {
    return this.state;
  }

  /** Ítems creados o cambiados desde que se cargó la lista: los que hay que guardar. */
  itemsModificados(): ShoppingItemSnapshot[] {
    return [...this.modificados]
      .map((id) => this.items.get(id))
      .filter((item): item is ShoppingItem => item !== undefined)
      .map((item) => item.toSnapshot());
  }

  private modificarItem(
    itemId: string,
    ahora: Date,
    cambio: (item: ShoppingItem) => void,
  ): Result<ShoppingItem> {
    if (this.estaArchivada) return err(ShoppingErrors.listaArchivada());

    const item = this.items.get(itemId);

    if (item === undefined || item.estaQuitado) return err(ShoppingErrors.itemNoEncontrado());

    cambio(item);

    this.registrarCambio(itemId, ahora);

    return ok(item);
  }

  private registrarCambio(itemId: string, ahora: Date): void {
    this.modificados.add(itemId);
    this.state = { ...this.state, updatedAt: ahora };
  }
}
