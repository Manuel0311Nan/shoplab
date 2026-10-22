import type { CantidadDto, UnidadDto } from "@/contracts/shopping";

const numero = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 3 });

const ETIQUETA: Record<UnidadDto, string> = { unidad: "ud.", g: "g", kg: "kg", ml: "ml", l: "l" };

const PASO: Record<UnidadDto, number> = { unidad: 1, g: 100, kg: 0.5, ml: 100, l: 0.5 };

export const formatCantidad = (cantidad: CantidadDto): string =>
  `${numero.format(cantidad.valor)} ${ETIQUETA[cantidad.unidad]}`;

export const pasoDe = (unidad: UnidadDto): number => PASO[unidad];

/** «2 packs · 8 ud.» si se añadió por packs; si no, la cantidad normal. */
export function formatCantidadItem(cantidad: CantidadDto, unidadesPorPack: number | null): string {
  if (unidadesPorPack === null || cantidad.unidad !== "unidad") return formatCantidad(cantidad);
  const packs = cantidad.valor / unidadesPorPack;
  if (!Number.isInteger(packs)) return formatCantidad(cantidad);
  return `${packs} ${packs === 1 ? "pack" : "packs"} · ${formatCantidad(cantidad)}`;
}

/**
 * Para la esquina de la vista rápida: nada si es 1 ud. (lo normal); «3», «2×4» por
 * packs, o la cantidad con su unidad («500 g», «1,5 l»).
 */
export function cantidadCorta(
  cantidad: CantidadDto,
  unidadesPorPack: number | null,
): string | null {
  if (cantidad.unidad !== "unidad") return formatCantidad(cantidad);
  if (unidadesPorPack !== null) {
    const packs = cantidad.valor / unidadesPorPack;
    if (Number.isInteger(packs)) return `${packs}×${unidadesPorPack}`;
  }
  return cantidad.valor === 1 ? null : numero.format(cantidad.valor);
}
