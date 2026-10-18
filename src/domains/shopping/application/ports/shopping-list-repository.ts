import type { ShoppingList, ShoppingListSnapshot } from "@/domains/shopping/domain/shopping-list";
import type { Cursor } from "@/shared/kernel/cursor";

/** Lo que muestra una tarjeta de Mis listas. */
export interface ResumenLista extends ShoppingListSnapshot {
  /** Productos sin comprar. */
  readonly pendientes: number;
  /** Productos en la lista (pendientes + en el carro). */
  readonly total: number;
}

/**
 * Listas de un hogar. Para todas las consultas, las listas borradas (deletedAt) y las
 * archivadas hace más de 15 días (caducadas) no existen, aunque la limpieza diaria
 * aún no haya pasado.
 */
export interface ShoppingListRepository {
  findById(id: string): Promise<ShoppingList | null>;
  /** Todas las activas (máximo 15), la última modificada primero. Sin paginar. */
  listarActivas(): Promise<ResumenLista[]>;
  /** Archivadas vigentes, la última archivada primero, a partir del cursor. */
  listarArchivadas(opciones: { despuesDe?: Cursor; limite: number }): Promise<ResumenLista[]>;
  contarActivas(): Promise<number>;
  save(list: ShoppingList): Promise<void>;
  /** Guarda varias listas en una sola transacción: todo o nada (intercambio de D5). */
  guardarVarias(lists: readonly ShoppingList[]): Promise<void>;
}
