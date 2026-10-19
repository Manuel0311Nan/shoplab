import type { CategoriaDto } from "@/contracts/categoria";
import type { ShoppingItemResponse } from "@/contracts/shopping";
import { compararCategorias } from "@/shared/kernel/categoria";

/** Grupos por categoría en el orden del súper; dentro, el orden en que llegaron. */
export function agruparPorCategoria(
  items: readonly ShoppingItemResponse[],
): { categoria: CategoriaDto; items: ShoppingItemResponse[] }[] {
  const grupos = new Map<CategoriaDto, ShoppingItemResponse[]>();
  for (const item of items)
    grupos.set(item.categoria, [...(grupos.get(item.categoria) ?? []), item]);
  return [...grupos.entries()]
    .sort(([a], [b]) => compararCategorias(a, b))
    .map(([categoria, delGrupo]) => ({ categoria, items: delGrupo }));
}
