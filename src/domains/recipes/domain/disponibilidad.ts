import { type Cantidad, convertirCantidad, sonConvertibles } from "@/shared/kernel/cantidad";
import type { Unidad } from "@/shared/kernel/unidad";
import {
  type IngredienteReceta,
  type ProductoAlternativo,
  RACIONES_MAX,
  type Receta,
} from "./receta";

/**
 * Lo que hay en la despensa del hogar, visto desde Recetas (las dos partes no se
 * importan: el orquestador traduce las líneas de la despensa a esto).
 */
export interface Existencia {
  /** Como se llama en la despensa del hogar («Pechuga de pollo»). */
  readonly nombre: string;
  readonly productoBaseId: string | null;
  readonly nombreNormalizado: string;
  readonly cantidad: Cantidad;
  /** Días hasta la fecha de caducidad (negativo si ya pasó); null sin fecha. */
  readonly caducaEnDias: number | null;
}

/** Cantidad sin validar: lo que viaja en los DTO y lo que recalcula la pantalla. */
export interface Medida {
  readonly valor: number;
  readonly unidad: Unidad;
}

/**
 * - tienes: hay bastante (o no se puede medir, pero hay).
 * - poco: hay, pero menos de lo que piden las raciones elegidas.
 * - falta: no hay nada.
 * - opcional: no hay, pero la receta sale igual.
 * - basico: sal, aceite, agua…: no se comprueba.
 */
export type EstadoIngrediente = "tienes" | "poco" | "falta" | "opcional" | "basico";

export interface IngredienteEvaluado {
  readonly nombre: string;
  readonly nota: string | null;
  readonly basico: boolean;
  readonly opcional: boolean;
  /** El producto que se añadiría a la lista (el primero de los que valen). */
  readonly producto: ProductoAlternativo | null;
  /** Para las raciones de la receta, sin escalar: la pantalla escala al editar. */
  readonly cantidadBase: Medida | null;
  /** Escalada a las raciones elegidas. */
  readonly cantidad: Medida | null;
  /** Lo que hay, en la unidad del ingrediente. null si no hay o no se puede medir (1 ud. frente a g). */
  readonly disponible: Medida | null;
  readonly hay: boolean;
  /** Lo que habría que comprar para las raciones elegidas. */
  readonly falta: Medida | null;
  readonly estado: EstadoIngrediente;
}

export interface Evaluacion {
  readonly receta: Receta;
  /** Raciones enteras que salen con lo que hay; null si nada limita (sin cantidades medibles). */
  readonly racionesPosibles: number | null;
  /** Las de la receta, o menos si algún ingrediente no da para más. */
  readonly racionesSugeridas: number;
  /** Las que se están mirando: las sugeridas o las que pidió el usuario al editar. */
  readonly raciones: number;
  /** Hay todos los ingredientes obligatorios y dan para al menos una ración. */
  readonly sePuedeHacer: boolean;
  /** Ingredientes obligatorios en falta o con poco, a las raciones que se miran. */
  readonly faltan: number;
  /** Lo de la despensa que usa la receta y caduca antes (con fecha). */
  readonly caduca: { readonly nombre: string; readonly dias: number } | null;
  readonly ingredientes: readonly IngredienteEvaluado[];
}

/** Sugerencias de «te falta poco»: como mucho, este número de ingredientes. */
export const MAX_FALTAN_CASI = 2;

const EPSILON = 1e-9;

/**
 * Cruza una receta con la despensa. Las raciones se ajustan al ingrediente que da para
 * menos (sin pasar de las de la receta); con `raciones` se evalúa otra cantidad, la
 * que el usuario pide al editar, y lo que no llega sale como «falta».
 */
export function evaluarReceta(
  receta: Receta,
  existencias: readonly Existencia[],
  raciones?: number,
): Evaluacion {
  const cruces = receta.ingredientes.map((ingrediente) => cruzar(ingrediente, existencias));
  const obligatorios = cruces.filter((c) => !c.ingrediente.basico && !c.ingrediente.opcional);

  const sinStock = obligatorios.filter((c) => !c.hay).length;
  const limites = obligatorios.flatMap(({ ingrediente, disponible }) =>
    ingrediente.cantidad === null || disponible === null
      ? []
      : [Math.floor((disponible.valor * receta.raciones) / ingrediente.cantidad.valor + EPSILON)],
  );
  const racionesPosibles = limites.length === 0 ? null : Math.min(...limites);

  const racionesSugeridas =
    sinStock > 0 || racionesPosibles === null
      ? receta.raciones
      : racionesPosibles >= 1
        ? Math.min(receta.raciones, racionesPosibles)
        : 1;
  const elegidas = limitarRaciones(raciones ?? racionesSugeridas);

  const ingredientes = cruces.map(({ ingrediente: i, hay, disponible }): IngredienteEvaluado => {
    const datos = {
      basico: i.basico,
      opcional: i.opcional,
      cantidadBase: i.cantidad,
      hay,
      disponible,
    };
    return {
      ...datos,
      nombre: i.nombre,
      nota: i.nota,
      producto: i.productos[0] ?? null,
      ...calcularIngrediente(datos, receta.raciones, elegidas),
    };
  });
  let caduca: Evaluacion["caduca"] = null;
  for (const linea of cruces.filter((c) => !c.ingrediente.basico).flatMap((c) => c.lineas)) {
    if (linea.caducaEnDias !== null && (caduca === null || linea.caducaEnDias < caduca.dias)) {
      caduca = { nombre: linea.nombre, dias: linea.caducaEnDias };
    }
  }

  return {
    receta,
    racionesPosibles,
    racionesSugeridas,
    raciones: elegidas,
    sePuedeHacer: sinStock === 0 && (racionesPosibles === null || racionesPosibles >= 1),
    faltan: ingredientes.filter(
      (i) => !i.basico && !i.opcional && (i.estado === "falta" || i.estado === "poco"),
    ).length,
    caduca,
    ingredientes,
  };
}

/** Lo que hace falta saber de un ingrediente para recalcularlo con otras raciones. */
export interface DatosIngrediente {
  readonly basico: boolean;
  readonly opcional: boolean;
  /** Para las raciones de la receta. */
  readonly cantidadBase: Medida | null;
  readonly hay: boolean;
  readonly disponible: Medida | null;
}

export interface CalculoIngrediente {
  readonly cantidad: Medida | null;
  readonly falta: Medida | null;
  readonly estado: EstadoIngrediente;
}

/**
 * Cantidad, lo que falta y estado de un ingrediente para unas raciones. Pura y con
 * datos planos: la usa el dominio y también la pantalla de detalle al cambiar las
 * raciones, sin ir al servidor (los DTO traen `cantidadBase`, `hay` y `disponible`).
 */
export function calcularIngrediente(
  datos: DatosIngrediente,
  racionesBase: number,
  raciones: number,
): CalculoIngrediente {
  const cantidad =
    datos.cantidadBase === null ? null : escalar(datos.cantidadBase, racionesBase, raciones);

  if (datos.basico) return { cantidad, falta: null, estado: "basico" };
  if (!datos.hay) {
    return datos.opcional
      ? { cantidad, falta: null, estado: "opcional" }
      : { cantidad, falta: cantidad, estado: "falta" };
  }
  const { disponible } = datos;
  if (cantidad !== null && disponible !== null && disponible.valor < cantidad.valor - EPSILON) {
    const falta = redondearHaciaArriba(cantidad.valor - disponible.valor, cantidad.unidad);
    return { cantidad, falta: { valor: falta, unidad: cantidad.unidad }, estado: "poco" };
  }
  return { cantidad, falta: null, estado: "tienes" };
}

/** Cantidad de un ingrediente para otras raciones, redondeada como se cocina. */
export function escalar(medida: Medida, racionesBase: number, raciones: number): Medida {
  const valor = (medida.valor * raciones) / racionesBase;
  return { valor: redondearParaCocinar(valor, medida.unidad), unidad: medida.unidad };
}

export function limitarRaciones(raciones: number): number {
  if (!Number.isFinite(raciones)) return 1;
  return Math.min(RACIONES_MAX, Math.max(1, Math.round(raciones)));
}

/**
 * Orden de las sugerencias: primero las que se pueden hacer, y entre ellas las que
 * gastan antes lo que caduca; después las que necesitan menos compra.
 */
export function compararEvaluaciones(a: Evaluacion, b: Evaluacion): number {
  if (a.sePuedeHacer !== b.sePuedeHacer) return a.sePuedeHacer ? -1 : 1;
  if (!a.sePuedeHacer && a.faltan !== b.faltan) return a.faltan - b.faltan;
  const caducidad = (a.caduca?.dias ?? Infinity) - (b.caduca?.dias ?? Infinity);
  if (caducidad !== 0 && !Number.isNaN(caducidad)) return caducidad;
  return a.receta.nombre.localeCompare(b.receta.nombre, "es");
}

interface Cruce {
  readonly ingrediente: IngredienteReceta;
  readonly lineas: readonly Existencia[];
  readonly hay: boolean;
  readonly disponible: Medida | null;
}

function cruzar(ingrediente: IngredienteReceta, existencias: readonly Existencia[]): Cruce {
  const lineas = existencias.filter((e) =>
    ingrediente.productos.some(
      (p) => e.productoBaseId === p.id || e.nombreNormalizado === p.nombreNormalizado,
    ),
  );
  return {
    ingrediente,
    lineas,
    hay: lineas.length > 0,
    disponible: medirDisponible(lineas, ingrediente.cantidad?.unidad ?? null),
  };
}

/**
 * Suma lo que hay en la unidad del ingrediente. Si alguna línea no se puede convertir
 * (3 ud. de tomate frente a 400 g), no se mide: cuenta como que hay.
 */
function medirDisponible(lineas: readonly Existencia[], unidad: Unidad | null): Medida | null {
  if (unidad === null || lineas.length === 0) return null;
  if (!lineas.every((l) => sonConvertibles(l.cantidad.unidad, unidad))) return null;
  let total = 0;
  for (const linea of lineas) total += convertirCantidad(linea.cantidad, unidad)?.valor ?? 0;
  return { valor: Math.round(total * 1000) / 1000, unidad };
}

function redondearParaCocinar(valor: number, unidad: Unidad): number {
  switch (unidad) {
    case "unidad":
      // Medio huevo no, pero media cebolla sí: a medias, hacia arriba.
      return Math.max(0.5, Math.ceil(valor * 2 - EPSILON) / 2);
    case "g":
    case "ml":
      return Math.max(1, Math.round(valor));
    default:
      return Math.max(0.001, Math.round(valor * 1000) / 1000);
  }
}

/** Lo que falta se compra: unidades enteras, gramos y mililitros enteros. */
function redondearHaciaArriba(valor: number, unidad: Unidad): number {
  switch (unidad) {
    case "unidad":
    case "g":
    case "ml":
      return Math.max(1, Math.ceil(valor - EPSILON));
    default:
      return Math.max(0.001, Math.ceil(valor * 1000 - EPSILON) / 1000);
  }
}
