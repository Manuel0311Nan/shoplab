import type { ShoppingListSummary } from "@/contracts/shopping";

export type AccionListas =
  | { readonly tipo: "renombrar"; readonly id: string; readonly nombre: string }
  /** Archivar, desarchivar o borrar: en cualquier caso sale de la pestaña actual. */
  | { readonly tipo: "quitar"; readonly id: string };

/** Cambio optimista de Mis listas (useOptimistic). Puro: no muta `listas`. */
export function aplicarAccionListas(
  listas: readonly ShoppingListSummary[],
  accion: AccionListas,
): ShoppingListSummary[] {
  switch (accion.tipo) {
    case "renombrar":
      return listas.map((l) => (l.id === accion.id ? { ...l, nombre: accion.nombre } : l));
    case "quitar":
      return listas.filter((l) => l.id !== accion.id);
  }
}
