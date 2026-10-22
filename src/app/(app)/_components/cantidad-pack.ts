import type { PacksRecordados } from "@/contracts/memoria";
import { type UnidadDto, unidadSchema } from "@/contracts/shopping";
import { normalizarNombre } from "@/shared/kernel/texto";

/** En los selectores: las unidades de verdad y «pack» (que se guarda en unidades). */
export type UnidadElegida = UnidadDto | "pack";

export const ETIQUETA_UNIDAD: Readonly<Record<UnidadElegida, string>> = {
  unidad: "ud.",
  g: "g",
  kg: "kg",
  ml: "ml",
  l: "l",
  pack: "pack",
};
export const UNIDADES_ELEGIBLES: readonly UnidadElegida[] = [...unidadSchema.options, "pack"];
export const POR_PACK_INICIAL = 4;

export type CantidadDeLista =
  | {
      readonly ok: true;
      readonly cantidad: { readonly valor: number; readonly unidad: UnidadDto };
      readonly unidadesPorPack: number | null;
    }
  | { readonly ok: false; readonly mensaje: string };

/** De lo que se escribe en el formulario a lo que guarda la lista: packs → unidades. */
export function aCantidadDeLista(
  valor: number,
  unidad: UnidadElegida,
  porPack: string,
): CantidadDeLista {
  if (!Number.isFinite(valor) || valor <= 0) {
    return { ok: false, mensaje: "Indica una cantidad mayor que 0" };
  }
  if (unidad !== "pack") return { ok: true, cantidad: { valor, unidad }, unidadesPorPack: null };

  const n = Number(porPack);
  if (!Number.isInteger(n) || n < 2 || n > 100) {
    return { ok: false, mensaje: "Un pack tiene entre 2 y 100 unidades" };
  }
  if (!Number.isInteger(valor))
    return { ok: false, mensaje: "Indica cuántos packs, sin decimales" };
  return { ok: true, cantidad: { valor: valor * n, unidad: "unidad" }, unidadesPorPack: n };
}

/**
 * Qué proponer al elegir un producto: «pack» con su tamaño si la última vez se compró
 * así; si no, su unidad, con el tamaño recordado listo por si se cambia a «pack».
 */
export function propuestaDeUnidad(
  packs: PacksRecordados,
  nombre: string,
  unidad: UnidadDto,
): { readonly unidad: UnidadElegida; readonly porPack: string } {
  const pack = packs[normalizarNombre(nombre)];
  if (pack?.enPack === true) return { unidad: "pack", porPack: String(pack.unidadesPorPack) };
  return { unidad, porPack: String(pack?.unidadesPorPack ?? POR_PACK_INICIAL) };
}
