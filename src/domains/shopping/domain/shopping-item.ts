import type { Cantidad } from "@/shared/kernel/cantidad";
import { err, ok, type Result } from "@/shared/kernel/result";
import { ShoppingErrors } from "./shopping-errors";

export interface ShoppingItemSnapshot {
  readonly id: string;
  readonly nombre: string;
  readonly ingredientId: string | null;
  /** Producto de la lista base (Catalog) del que salió, si se eligió al autocompletar. */
  readonly productoBaseId: string | null;
  readonly cantidad: Cantidad;
  readonly nota: string | null;
  readonly compradoAt: Date | null;
  readonly compradoPorId: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt: Date | null;
}
export interface NewShoppingItem {
  readonly id: string;
  readonly nombre: string;
  readonly cantidad: Cantidad;
  readonly nota?: string | null;
  readonly ingredientId?: string | null;
  readonly productoBaseId?: string | null;
}
const NOMBRE_MAX = 80;
const NOTA_MAX = 200;

export class ShoppingItem {
  private constructor(private state: ShoppingItemSnapshot) {}

  static create(input: NewShoppingItem, ahora: Date): Result<ShoppingItem> {
    const nombre = input.nombre.trim();

    if (nombre.length === 0 || nombre.length > NOMBRE_MAX) {
      return err(ShoppingErrors.nombreNoValido(NOMBRE_MAX));
    }

    const nota = input.nota?.trim() || null;

    if (nota !== null && nota.length > NOTA_MAX) {
      return err(ShoppingErrors.notaNoValida(NOTA_MAX));
    }

    return ok(
      new ShoppingItem({
        id: input.id,
        nombre,
        ingredientId: input.ingredientId ?? null,
        productoBaseId: input.productoBaseId ?? null,
        cantidad: input.cantidad,
        nota,
        compradoAt: null,
        compradoPorId: null,
        createdAt: ahora,
        updatedAt: ahora,
        deletedAt: null,
      }),
    );
  }
  /** Reconstruye desde la base de datos: los datos se validaron al crearse. */
  static rehydrate(snapshot: ShoppingItemSnapshot): ShoppingItem {
    return new ShoppingItem(snapshot);
  }
  get id(): string {
    return this.state.id;
  }
  get estaComprado(): boolean {
    return this.state.compradoAt !== null;
  }
  get nombre(): string {
    return this.state.nombre;
  }
  get cantidad(): Cantidad {
    return this.state.cantidad;
  }
  get productoBaseId(): string | null {
    return this.state.productoBaseId;
  }
  get estaQuitado(): boolean {
    return this.state.deletedAt !== null;
  }
  marcarComprado(usuarioId: string, ahora: Date): void {
    if (this.estaComprado) return;
    this.state = { ...this.state, compradoAt: ahora, compradoPorId: usuarioId, updatedAt: ahora };
  }
  desmarcarComprado(ahora: Date): void {
    if (!this.estaComprado) return;
    this.state = { ...this.state, compradoAt: null, compradoPorId: null, updatedAt: ahora };
  }
  cambiarCantidad(cantidad: Cantidad, ahora: Date): void {
    this.state = { ...this.state, cantidad, updatedAt: ahora };
  }
  quitar(ahora: Date): void {
    this.state = { ...this.state, deletedAt: ahora, updatedAt: ahora };
  }
  toSnapshot(): ShoppingItemSnapshot {
    return this.state;
  }
}
