import type { Categoria } from "./categoria";
import { type Dia, diasHasta } from "./dia";

/**
 * Paquetes abiertos: no cambian la caducidad, avisan de que conviene revisar si siguen
 * buenos. Verde hasta `amarillo` días abierto, amarillo («revísalo») hasta `rojo`, y rojo
 * («mira si sigue bueno») desde ahí. Son orientativos: el texto nunca dice «tíralo».
 */
export interface AvisoAbierto {
  /** Días abierto a partir de los que se pone amarillo. */
  readonly amarillo: number;
  /** Días abierto a partir de los que se pone rojo. */
  readonly rojo: number;
}

/**
 * Por categoría. null: no se «abre» (fruta, verdura, limpieza, higiene) y la acción no
 * aparece. Las excepciones por producto (el tomate frito dentro de «Despensa», los
 * curados dentro de «Charcutería») viven en la lista base del catálogo.
 */
export const AVISO_ABIERTO_POR_CATEGORIA: Readonly<Record<Categoria, AvisoAbierto | null>> = {
  frutas: null,
  verduras: null,
  vacuno: { amarillo: 1, rojo: 2 },
  pollo_pavo: { amarillo: 1, rojo: 2 },
  cerdo_cordero: { amarillo: 1, rojo: 2 },
  charcuteria: { amarillo: 3, rojo: 5 },
  pescado: { amarillo: 1, rojo: 2 },
  lacteos_huevos: { amarillo: 3, rojo: 5 },
  panaderia: { amarillo: 5, rojo: 8 },
  despensa: { amarillo: 60, rojo: 120 },
  especias: { amarillo: 180, rojo: 365 },
  bebidas: { amarillo: 3, rojo: 7 },
  congelados: { amarillo: 30, rojo: 90 },
  limpieza: null,
  higiene: null,
  otros: { amarillo: 3, rojo: 7 },
};

/** Como mucho dos años: más que eso no es un aviso útil. */
export const MAX_DIAS_AVISO_ABIERTO = 730;

export function sePuedeAbrir(categoria: Categoria): boolean {
  return AVISO_ABIERTO_POR_CATEGORIA[categoria] !== null;
}

export function esAvisoAbiertoValido(aviso: AvisoAbierto): boolean {
  return (
    Number.isInteger(aviso.amarillo) &&
    Number.isInteger(aviso.rojo) &&
    aviso.amarillo >= 1 &&
    aviso.rojo > aviso.amarillo &&
    aviso.rojo <= MAX_DIAS_AVISO_ABIERTO
  );
}

export type ColorAbierto = "verde" | "amarillo" | "rojo";

export interface EstadoAbierto {
  readonly color: ColorAbierto;
  /** Días que lleva abierto (0 = hoy). */
  readonly dias: number;
}

export function estadoAbierto(abiertoEl: Dia, hoy: Dia, aviso: AvisoAbierto): EstadoAbierto {
  const dias = Math.max(0, diasHasta(abiertoEl, hoy));
  const color = dias >= aviso.rojo ? "rojo" : dias >= aviso.amarillo ? "amarillo" : "verde";
  return { color, dias };
}
