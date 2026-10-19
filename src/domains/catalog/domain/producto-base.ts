import { compararCategorias, type Categoria } from "@/shared/kernel/categoria";
import type { Unidad } from "@/shared/kernel/unidad";

/**
 * Producto de la lista base (global, igual para todos los hogares). Solo sirve para
 * autocompletar: al elegirlo, el ítem copia el nombre y la unidad y guarda el id.
 */
export interface ProductoBase {
  readonly id: string;
  readonly nombre: string;
  readonly categoria: Categoria;
  readonly unidadPorDefecto: Unidad;
}

/** Orden de la lista base: por sección del súper y, dentro, alfabético en español. */
export function compararProductos(a: ProductoBase, b: ProductoBase): number {
  return compararCategorias(a.categoria, b.categoria) || a.nombre.localeCompare(b.nombre, "es");
}
