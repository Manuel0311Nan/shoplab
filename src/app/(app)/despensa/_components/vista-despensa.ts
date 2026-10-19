import type { CategoriaDto } from "@/contracts/categoria";
import type { LineaDespensaResponse, UbicacionResponse } from "@/contracts/pantry";
import type { CantidadDto } from "@/contracts/shopping";
import { Cantidad, sumarCantidades } from "@/shared/kernel/cantidad";
import { compararCategorias, NOMBRE_CATEGORIA } from "@/shared/kernel/categoria";
import { normalizarNombre } from "@/shared/kernel/texto";

export type Agrupar = "ubicacion" | "categoria";

/** Las líneas de un mismo producto en una ubicación: una tarjeta. */
export interface ProductoDespensa {
  readonly clave: string;
  readonly nombre: string;
  readonly categoria: CategoriaDto;
  readonly ubicacionId: string;
  /** Ordenadas por caducidad (la más cercana primero; sin fecha, al final). */
  readonly lineas: readonly LineaDespensaResponse[];
  /** Suma de las líneas si se pueden sumar (g y kg sí; ud. y kg no). */
  readonly total: CantidadDto | null;
  /** La línea que antes caduca: manda en la tarjeta. */
  readonly principal: LineaDespensaResponse;
}

export interface SubgrupoDespensa {
  /** Título (solo agrupando por ubicación: la categoría dentro de cada ubicación). */
  readonly titulo: string | null;
  readonly productos: readonly ProductoDespensa[];
}

export interface GrupoDespensa {
  readonly clave: string;
  readonly titulo: string;
  readonly subgrupos: readonly SubgrupoDespensa[];
}

const diasParaOrdenar = (l: LineaDespensaResponse) => l.caducidad.dias ?? Number.POSITIVE_INFINITY;

function compararLineas(a: LineaDespensaResponse, b: LineaDespensaResponse): number {
  return diasParaOrdenar(a) - diasParaOrdenar(b) || a.nombre.localeCompare(b.nombre, "es");
}

export const esUrgente = (l: LineaDespensaResponse) =>
  l.caducidad.estado === "caducado" || l.caducidad.estado === "pronto";

function claveProducto(l: LineaDespensaResponse): string {
  const producto = l.productoBaseId ?? `n:${normalizarNombre(l.nombre)}`;
  return `${producto}@${l.ubicacionId}`;
}

function sumar(lineas: readonly LineaDespensaResponse[]): CantidadDto | null {
  const primera = lineas.at(0);
  if (primera === undefined) return null;
  const cantidades = lineas.flatMap((l) => {
    const c = Cantidad.create(l.cantidad.valor, l.cantidad.unidad);
    return c.ok ? [c.value] : [];
  });
  const total = sumarCantidades(cantidades, primera.cantidad.unidad);
  return total === null ? null : { valor: total.valor, unidad: total.unidad };
}

/** Junta las líneas en productos (una tarjeta por producto y ubicación). */
export function agruparEnProductos(lineas: readonly LineaDespensaResponse[]): ProductoDespensa[] {
  const porClave = new Map<string, LineaDespensaResponse[]>();
  for (const l of lineas)
    porClave.set(claveProducto(l), [...(porClave.get(claveProducto(l)) ?? []), l]);
  return [...porClave.entries()].flatMap(([clave, delProducto]) => {
    const ordenadas = [...delProducto].sort(compararLineas);
    const principal = ordenadas.at(0);
    if (principal === undefined) return [];
    return [
      {
        clave,
        nombre: principal.nombre,
        categoria: principal.categoria,
        ubicacionId: principal.ubicacionId,
        lineas: ordenadas,
        total: sumar(ordenadas),
        principal,
      },
    ];
  });
}

const compararProductos = (a: ProductoDespensa, b: ProductoDespensa) =>
  compararLineas(a.principal, b.principal);

export interface FiltroDespensa {
  readonly ubicacionId?: string | null;
  /** Solo lo caducado o que caduca esta semana. */
  readonly urgentes?: boolean;
}

/**
 * D4: por ubicación (en el orden del hogar y, dentro, por categoría) o por categoría
 * (en el orden del súper). Dentro de cada grupo, lo que antes caduca primero.
 */
export function agruparDespensa(
  ubicaciones: readonly UbicacionResponse[],
  lineas: readonly LineaDespensaResponse[],
  agrupar: Agrupar,
  filtro: FiltroDespensa = {},
): GrupoDespensa[] {
  const visibles = lineas.filter(
    (l) =>
      (!filtro.ubicacionId || l.ubicacionId === filtro.ubicacionId) &&
      (!filtro.urgentes || esUrgente(l)),
  );
  const productos = agruparEnProductos(visibles);

  if (agrupar === "categoria") {
    const categorias = [...new Set(productos.map((p) => p.categoria))].sort(compararCategorias);
    return categorias.map((categoria) => ({
      clave: categoria,
      titulo: NOMBRE_CATEGORIA[categoria],
      subgrupos: [
        {
          titulo: null,
          productos: productos.filter((p) => p.categoria === categoria).sort(compararProductos),
        },
      ],
    }));
  }

  return [...ubicaciones]
    .sort((a, b) => a.orden - b.orden)
    .flatMap((u) => {
      const dentro = productos.filter((p) => p.ubicacionId === u.id);
      if (dentro.length === 0) return [];
      const categorias = [...new Set(dentro.map((p) => p.categoria))].sort(compararCategorias);
      return [
        {
          clave: u.id,
          titulo: u.nombre,
          subgrupos: categorias.map((categoria) => ({
            titulo: NOMBRE_CATEGORIA[categoria],
            productos: dentro.filter((p) => p.categoria === categoria).sort(compararProductos),
          })),
        },
      ];
    });
}

/** "Caducó ayer", "Caduca hoy", "Caduca en 3 días"… null sin fecha. */
export function textoCaducidad(caducidad: LineaDespensaResponse["caducidad"]): string | null {
  const { dias } = caducidad;
  if (dias === null) return null;
  if (dias < -1) return `Caducó hace ${-dias} días`;
  if (dias === -1) return "Caducó ayer";
  if (dias === 0) return "Caduca hoy";
  if (dias === 1) return "Caduca mañana";
  return `Caduca en ${dias} días`;
}
