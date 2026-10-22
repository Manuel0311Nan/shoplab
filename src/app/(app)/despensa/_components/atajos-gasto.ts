import type { CantidadDto } from "@/contracts/shopping";
import { formatCantidad } from "../../listas/[listId]/_components/format-cantidad";

export interface AtajoDeGasto {
  readonly etiqueta: string;
  /** Lo que se ve debajo: «250 g». */
  readonly detalle: string;
  /** undefined: todo lo que queda. */
  readonly valor: number | undefined;
}

/** ¼, ½ y todo de lo que queda; solo en g, kg, ml o l (en unidades está el «−1»). */
export function atajosDeGasto(cantidad: CantidadDto): AtajoDeGasto[] {
  if (cantidad.unidad === "unidad") return [];
  const partes: AtajoDeGasto[] = [];
  for (const [etiqueta, fraccion] of [
    ["¼", 0.25],
    ["½", 0.5],
  ] as const) {
    const valor = Math.round(cantidad.valor * fraccion * 1000) / 1000;
    if (valor > 0 && valor < cantidad.valor) {
      partes.push({ etiqueta, valor, detalle: formatCantidad({ valor, unidad: cantidad.unidad }) });
    }
  }
  return [...partes, { etiqueta: "Todo", detalle: formatCantidad(cantidad), valor: undefined }];
}
