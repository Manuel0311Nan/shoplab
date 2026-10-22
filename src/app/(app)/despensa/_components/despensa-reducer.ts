import type { LineaDespensaResponse } from "@/contracts/pantry";

export type AccionDespensa =
  /** Gastar o tirar: sin cantidad, la línea entera. */
  | { readonly tipo: "consumir"; readonly lineaId: string; readonly valor?: number }
  | { readonly tipo: "quitar"; readonly lineaId: string }
  /** Deshacer un gasto: la línea vuelve a estar como antes. */
  | { readonly tipo: "reponer"; readonly linea: LineaDespensaResponse };

/** Cambio optimista de la despensa (useOptimistic). Puro. */
export function aplicarAccionDespensa(
  lineas: readonly LineaDespensaResponse[],
  accion: AccionDespensa,
): LineaDespensaResponse[] {
  switch (accion.tipo) {
    case "quitar":
      return lineas.filter((l) => l.id !== accion.lineaId);
    case "reponer":
      return lineas.some((l) => l.id === accion.linea.id)
        ? lineas.map((l) => (l.id === accion.linea.id ? accion.linea : l))
        : [...lineas, accion.linea];
    case "consumir":
      return lineas.flatMap((l) => {
        if (l.id !== accion.lineaId) return [l];
        if (accion.valor === undefined) return [];
        const resto = Math.round((l.cantidad.valor - accion.valor) * 1000) / 1000;
        return resto <= 0 ? [] : [{ ...l, cantidad: { ...l.cantidad, valor: resto } }];
      });
  }
}
