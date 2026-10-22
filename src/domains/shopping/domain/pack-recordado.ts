import { normalizarNombre } from "@/shared/kernel/texto";
import { MAX_UNIDADES_POR_PACK, MIN_UNIDADES_POR_PACK } from "./shopping-item";

/**
 * Memoria del hogar: cómo compra un producto por packs. Se recuerda el tamaño aunque
 * la última vez se comprara suelto, para proponerlo si se vuelve a elegir «pack».
 */
export interface PackRecordado {
  /** Clave dentro del hogar: normalizarNombre(nombre). */
  readonly nombreNormalizado: string;
  readonly unidadesPorPack: number;
  /** ¿La última vez que se añadió en unidades fue por packs? */
  readonly enPack: boolean;
}

/** Lo que se acaba de añadir a una lista, tal como lo pidió el usuario. */
export interface AltaParaRecordar {
  readonly nombre: string;
  readonly unidad: string;
  readonly unidadesPorPack: number | null;
}

/**
 * Qué guardar tras un alta (null: nada cambia). Por packs: tamaño y «en pack». Suelto
 * en unidades: si ya había pack, se recuerda que esta vez fue suelto. En otras
 * unidades (kg, l…) no dice nada de packs.
 */
export function packTrasAlta(
  actual: PackRecordado | null,
  alta: AltaParaRecordar,
): PackRecordado | null {
  const nombreNormalizado = normalizarNombre(alta.nombre);
  if (nombreNormalizado === "") return null;
  if (alta.unidadesPorPack !== null) {
    const n = alta.unidadesPorPack;
    if (!Number.isInteger(n) || n < MIN_UNIDADES_POR_PACK || n > MAX_UNIDADES_POR_PACK) {
      return null;
    }
    if (actual?.enPack === true && actual.unidadesPorPack === n) return null;
    return { nombreNormalizado, unidadesPorPack: n, enPack: true };
  }
  if (alta.unidad !== "unidad" || actual === null || !actual.enPack) return null;
  return { ...actual, enPack: false };
}
