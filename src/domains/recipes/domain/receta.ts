import type { Cantidad } from "@/shared/kernel/cantidad";

/** Producto de la lista base que vale para un ingrediente («Tomate» → pera, en rama…). */
export interface ProductoAlternativo {
  readonly id: string;
  readonly nombre: string;
  readonly nombreNormalizado: string;
}

export interface IngredienteReceta {
  /** Cómo se lee en la receta («Tomate maduro»). */
  readonly nombre: string;
  /** Productos del catálogo que lo cubren; el primero es el que se añade a la lista. */
  readonly productos: readonly ProductoAlternativo[];
  /** Para las raciones de la receta. Sin cantidad («2 dientes», «al gusto») solo se mira si lo hay. */
  readonly cantidad: Cantidad | null;
  readonly nota: string | null;
  /** Sal, aceite, agua, pimienta: se da por hecho que hay y no bloquea. */
  readonly basico: boolean;
  readonly opcional: boolean;
}

/**
 * Receta de la biblioteca (global, igual para todos los hogares). Solo lectura: la
 * biblioteca se siembra desde `infrastructure/biblioteca` (vista 4).
 */
export interface Receta {
  readonly id: string;
  readonly slug: string;
  readonly nombre: string;
  readonly descripcion: string;
  readonly raciones: number;
  readonly minutos: number;
  readonly etiquetas: readonly string[];
  readonly ingredientes: readonly IngredienteReceta[];
  readonly pasos: readonly string[];
}

/** Raciones que se pueden pedir al editar una receta. */
export const RACIONES_MAX = 12;
