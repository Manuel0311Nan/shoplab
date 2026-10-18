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

/** Cambios parciales de un ítem. Los campos ausentes no se tocan. */
export interface CambiosItem {
  readonly cantidad?: Cantidad;
  readonly comprado?: boolean;
}

/**
 * Qué hacer con los ítems pendientes al terminar la compra: `vaciar` los quita
 * también; `conservarPendientes` los deja en la lista para la próxima vez.
 */
export type ModoTerminarCompra = "vaciar" | "conservarPendientes";

export const MAX_ITEMS_POR_LISTA = 200;
export const MAX_NOMBRE_LISTA = 80;

export interface NewShoppingList {
  readonly id: string;
  readonly nombre: string;
}

export class ShoppingList {
  private readonly modificados = new Set<string>();

  private constructor(
    private state: ShoppingListSnapshot,
    private readonly items: Map<string, ShoppingItem>,
  ) {}

  /** Lista nueva y vacía. El nombre se recorta y debe tener entre 1 y 80 caracteres. */
  static create(input: NewShoppingList, ahora: Date): Result<ShoppingList> {
    const nombre = input.nombre.trim();
    if (nombre.length === 0 || nombre.length > MAX_NOMBRE_LISTA) {
      return err(ShoppingErrors.nombreNoValido(MAX_NOMBRE_LISTA));
    }
    return ok(
      new ShoppingList(
        { id: input.id, nombre, archivadaAt: null, createdAt: ahora, updatedAt: ahora },
        new Map(),
      ),
    );
  }

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

  /**
   * Aplica varios cambios a un ítem como una sola operación: se valida una vez
   * (lista no archivada, ítem existente) y se aplican todos o ninguno.
   */
  actualizarItem(
    itemId: string,
    cambios: CambiosItem,
    usuarioId: string,
    ahora: Date,
  ): Result<ShoppingItem> {
    return this.modificarItem(itemId, ahora, (item) => {
      if (cambios.cantidad !== undefined) item.cambiarCantidad(cambios.cantidad, ahora);
      if (cambios.comprado === true) item.marcarComprado(usuarioId, ahora);
      if (cambios.comprado === false) item.desmarcarComprado(ahora);
    });
  }

  quitarItem(itemId: string, ahora: Date): Result<ShoppingItem> {
    return this.modificarItem(itemId, ahora, (item) => item.quitar(ahora));
  }

  /** Cierra la compra: quita los ítems comprados y, según el modo, también los pendientes. */
  terminarCompra(modo: ModoTerminarCompra, ahora: Date): Result<void> {
    if (this.estaArchivada) return err(ShoppingErrors.listaArchivada());

    for (const item of this.itemsActivos()) {
      if (modo === "vaciar" || item.estaComprado) {
        item.quitar(ahora);
        this.registrarCambio(item.id, ahora);
      }
    }
    return ok(undefined);
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
