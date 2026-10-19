import type { Categoria } from "@/shared/kernel/categoria";
import type { Unidad } from "@/shared/kernel/unidad";

/**
 * Memoria del hogar para el texto libre (D1 de la vista 3): algo que el hogar escribió
 * y no estaba en la lista base, con la categoría y la unidad con que lo usa. También
 * guarda la categoría que el hogar prefiere para un producto de la lista base.
 */
export interface ProductoRecordado {
  /** Clave dentro del hogar: normalizarNombre(nombre). */
  readonly nombreNormalizado: string;
  /** La última forma escrita: así se muestra en las sugerencias. */
  readonly nombre: string;
  readonly categoria: Categoria;
  readonly unidad: Unidad;
  readonly usos: number;
  readonly ultimoUso: Date;
}
