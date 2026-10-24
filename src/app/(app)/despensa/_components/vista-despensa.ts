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

/**
 * Para ordenar: los días hasta la caducidad o, si está abierto, hasta que se pone rojo
 * (lo que antes llegue). Sin ninguno de los dos, al final.
 */
const diasParaOrdenar = (l: LineaDespensaResponse) =>
  Math.min(
    l.caducidad.dias ?? Number.POSITIVE_INFINITY,
    l.abierto === null ? Number.POSITIVE_INFINITY : l.abierto.aviso.rojo - l.abierto.dias,
  );

function compararLineas(a: LineaDespensaResponse, b: LineaDespensaResponse): number {
  return diasParaOrdenar(a) - diasParaOrdenar(b) || a.nombre.localeCompare(b.nombre, "es");
}

export const caducaPronto = (l: LineaDespensaResponse) =>
  l.caducidad.estado === "caducado" || l.caducidad.estado === "pronto";

/** Abierto en amarillo o rojo: conviene mirar si sigue bueno. */
export const abiertoParaRevisar = (l: LineaDespensaResponse) =>
  l.abierto !== null && l.abierto.color !== "verde";

/** Lo que filtra «ver»: lo que caduca esta semana y lo abierto que hay que revisar. */
export const esUrgente = (l: LineaDespensaResponse) => caducaPronto(l) || abiertoParaRevisar(l);

/** «1 producto caduca esta semana · 2 abiertos para revisar». null si no hay nada. */
export function textoAvisos(lineas: readonly LineaDespensaResponse[]): string | null {
  const caducan = lineas.filter(caducaPronto).length;
  const abiertos = lineas.filter(abiertoParaRevisar).length;
  const partes = [
    caducan === 1 && "1 producto caduca esta semana",
    caducan > 1 && `${caducan} productos caducan esta semana`,
    abiertos === 1 && "1 abierto para revisar",
    abiertos > 1 && `${abiertos} abiertos para revisar`,
  ].filter((p): p is string => typeof p === "string");
  return partes.length === 0 ? null : partes.join(" · ");
}

/** «Abierto hoy», «Abierto hace 4 días · revísalo»… null si está cerrado. */
export function textoAbierto(abierto: LineaDespensaResponse["abierto"]): string | null {
  if (abierto === null) return null;
  const cuando =
    abierto.dias === 0
      ? "Abierto hoy"
      : abierto.dias === 1
        ? "Abierto ayer"
        : `Abierto hace ${abierto.dias} días`;
  if (abierto.color === "rojo") return `${cuando} · mira si sigue bueno`;
  if (abierto.color === "amarillo") return `${cuando} · revísalo`;
  return cuando;
}

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

export interface EstadoCasilla {
  readonly texto: string;
  readonly tono: "rojo" | "ambar" | "neutro";
}

/**
 * Lo que la casilla de la cuadrícula dice debajo del nombre, en una línea: lo más
 * urgente primero (caducado, caduca pronto, abierto para revisar, queda poco).
 */
export function estadoCasilla(producto: ProductoDespensa): EstadoCasilla | null {
  const { caducidad, abierto, quedaPoco } = producto.principal;
  if (caducidad.estado === "caducado") return { texto: "Caducado", tono: "rojo" };
  if (caducidad.estado === "pronto" && caducidad.dias !== null) {
    const cuando =
      caducidad.dias === 0
        ? "Caduca hoy"
        : caducidad.dias === 1
          ? "Caduca mañana"
          : `Caduca en ${caducidad.dias} d`;
    return { texto: cuando, tono: "ambar" };
  }
  if (abierto !== null && abierto.color !== "verde") {
    return {
      texto: `Abierto ${abierto.dias} d`,
      tono: abierto.color === "rojo" ? "rojo" : "ambar",
    };
  }
  if (abierto !== null) return { texto: "Abierto", tono: "neutro" };
  if (quedaPoco) return { texto: "Queda poco", tono: "neutro" };
  return null;
}
