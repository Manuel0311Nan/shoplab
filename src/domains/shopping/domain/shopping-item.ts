import type { Cantidad } from "@/shared/kernel/cantidad";
import { CATEGORIA_POR_DEFECTO, type Categoria } from "@/shared/kernel/categoria";
import { err, ok, type Result } from "@/shared/kernel/result";
import { ShoppingErrors } from "./shopping-errors";

export interface ShoppingItemSnapshot {
  readonly id: string;
  readonly nombre: string;
  readonly ingredientId: string | null;
  /** Producto de la lista base (Catalog) del que salió, si se eligió al autocompletar. */
  readonly productoBaseId: string | null;
  /** Para agrupar la lista por el recorrido del súper. */
  readonly categoria: Categoria;
  /** Cantidad siempre en su unidad; con packs, en unidades (2 packs de 4 = 8 ud.). */
  readonly cantidad: Cantidad;
  /** Si se añadió por packs: unidades por pack. El stepper suma y resta packs enteros. */
  readonly unidadesPorPack: number | null;
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
  readonly categoria?: Categoria;
  readonly unidadesPorPack?: number | null;
}
const NOMBRE_MAX = 80;
/** Unidades por pack: de 2 (un pack de 1 es una unidad) a 100. */
export const MIN_UNIDADES_POR_PACK = 2;
export const MAX_UNIDADES_POR_PACK = 100;
const NOTA_MAX = 200;

export class ShoppingItem {
  private constructor(private state: ShoppingItemSnapshot) {}

  static create(input: NewShoppingItem, ahora: Date): Result<ShoppingItem> {
    const limpio = nombreDeItem(input.nombre);
    if (!limpio.ok) return limpio;
    const nombre = limpio.value;

    const nota = input.nota?.trim() || null;

    if (nota !== null && nota.length > NOTA_MAX) {
      return err(ShoppingErrors.notaNoValida(NOTA_MAX));
    }

    const unidadesPorPack = input.unidadesPorPack ?? null;
    if (
      unidadesPorPack !== null &&
      (!Number.isInteger(unidadesPorPack) ||
        unidadesPorPack < MIN_UNIDADES_POR_PACK ||
        unidadesPorPack > MAX_UNIDADES_POR_PACK ||
        input.cantidad.unidad !== "unidad")
    ) {
      return err(ShoppingErrors.packNoValido(MIN_UNIDADES_POR_PACK, MAX_UNIDADES_POR_PACK));
    }

    return ok(
      new ShoppingItem({
        id: input.id,
        nombre,
        ingredientId: input.ingredientId ?? null,
        productoBaseId: input.productoBaseId ?? null,
        categoria: input.categoria ?? CATEGORIA_POR_DEFECTO,
        cantidad: input.cantidad,
        unidadesPorPack,
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
  get unidadesPorPack(): number | null {
    return this.state.unidadesPorPack;
  }
  get categoria(): Categoria {
    return this.state.categoria;
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
  /** Si deja de estar en unidades (o ya no es un número entero de packs), deja de ser pack. */
  cambiarCantidad(cantidad: Cantidad, ahora: Date): void {
    const { unidadesPorPack } = this.state;
    const siguePack =
      unidadesPorPack !== null &&
      cantidad.unidad === "unidad" &&
      Number.isInteger(cantidad.valor / unidadesPorPack);
    this.state = {
      ...this.state,
      cantidad,
      unidadesPorPack: siguePack ? unidadesPorPack : null,
      updatedAt: ahora,
    };
  }
  /** Otro nombre (y su vínculo con la lista base): para corregir o estandarizar. */
  renombrar(nombre: string, productoBaseId: string | null, ahora: Date): Result<void> {
    const limpio = nombreDeItem(nombre);
    if (!limpio.ok) return limpio;
    this.state = { ...this.state, nombre: limpio.value, productoBaseId, updatedAt: ahora };
    return ok(undefined);
  }
  cambiarCategoria(categoria: Categoria, ahora: Date): void {
    if (categoria === this.state.categoria) return;
    this.state = { ...this.state, categoria, updatedAt: ahora };
  }
  quitar(ahora: Date): void {
    this.state = { ...this.state, deletedAt: ahora, updatedAt: ahora };
  }
  toSnapshot(): ShoppingItemSnapshot {
    return this.state;
  }
}

/** El nombre de un ítem, sin espacios sobrantes: ni vacío ni más largo de NOMBRE_MAX. */
export function nombreDeItem(nombre: string): Result<string> {
  const limpio = nombre.trim();
  if (limpio.length === 0 || limpio.length > NOMBRE_MAX) {
    return err(ShoppingErrors.nombreNoValido(NOMBRE_MAX));
  }
  return ok(limpio);
}
