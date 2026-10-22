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
