import type { GrupoParecidoResponse, MiProductoResponse } from "@/contracts/catalog";

export interface UnionPropuesta {
  /** En qué se unen: el de la lista base o el más usado del grupo. */
  readonly destino: { readonly nombre: string; readonly productoBaseId: string | null };
  /** Los que cambian de nombre (nombres normalizados). */
  readonly desde: readonly string[];
}

/**
 * Cómo unir un grupo de posibles duplicados: en el de la lista base si lo hay; si no, en
 * el más usado (a igualdad, el primero). El destino no se renombra a sí mismo.
 */
export function unionPropuesta(
  grupo: GrupoParecidoResponse,
  productos: readonly MiProductoResponse[],
): UnionPropuesta {
  if (grupo.base !== null) {
    return {
      destino: { nombre: grupo.base.nombre, productoBaseId: grupo.base.id },
      desde: grupo.productos.map((p) => p.nombreNormalizado),
    };
  }
  const usos = new Map(productos.map((p) => [p.nombreNormalizado, p.usos]));
  const [principal] = [...grupo.productos].sort(
    (a, b) => (usos.get(b.nombreNormalizado) ?? 0) - (usos.get(a.nombreNormalizado) ?? 0),
  );
  return {
    destino: { nombre: principal?.nombre ?? "", productoBaseId: null },
    desde: grupo.productos
      .filter((p) => p.nombreNormalizado !== principal?.nombreNormalizado)
      .map((p) => p.nombreNormalizado),
  };
}

/** Filtro del buscador: sin tildes ni mayúsculas, por cualquier parte del nombre. */
export function filtrarProductos(
  productos: readonly MiProductoResponse[],
  texto: string,
): MiProductoResponse[] {
  const q = texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("es-ES")
    .trim();
  if (q === "") return [...productos];
  return productos.filter((p) => p.nombreNormalizado.includes(q));
}
