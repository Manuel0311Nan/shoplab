import { validationError } from "./errors";
import { err, ok, type Result } from "./result";
import { esUnidad, type Unidad } from "./unidad";

declare const cantidadBrand: unique symbol;

export type Cantidad = {
  readonly valor: number;
  readonly unidad: Unidad;
  readonly [cantidadBrand]: true;
};

export const CANTIDAD_MAX = 100_000;
const DECIMALES = 3;

export const Cantidad = {
  create(valor: number, unidad: string): Result<Cantidad> {
    if (!esUnidad(unidad)) {
      return err(validationError("UNIDAD_NO_VALIDA", `Unidad desconocida: ${unidad}`));
    }

    const factor = 10 ** DECIMALES;
    const redondeado = Math.round(valor * factor) / factor;
    if (!Number.isFinite(redondeado) || redondeado <= 0 || redondeado > CANTIDAD_MAX) {
      return err(
        validationError(
          "CANTIDAD_NO_VALIDA",
          `La cantidad debe ser mayor que 0 y como máximo ${CANTIDAD_MAX}`,
        ),
      );
    }

    return ok(Object.freeze({ valor: redondeado, unidad }) as Cantidad);
  },
};

/** Unidades que se pueden convertir entre sí sin saber qué producto es. */
type Familia = "unidad" | "masa" | "volumen";

const FAMILIA: Record<Unidad, Familia> = {
  unidad: "unidad",
  g: "masa",
  kg: "masa",
  ml: "volumen",
  l: "volumen",
};
const EN_BASE: Record<Unidad, number> = { unidad: 1, g: 1, kg: 1000, ml: 1, l: 1000 };

/** ¿Se puede pasar de una unidad a otra? Solo dentro de la misma familia (g↔kg, ml↔l). */
export function sonConvertibles(a: Unidad, b: Unidad): boolean {
  return FAMILIA[a] === FAMILIA[b];
}

/**
 * Convierte una cantidad a otra unidad de su familia (500 g → 0,5 kg).
 * Devuelve `null` si no se puede (1 ud. → l necesita saber qué producto es: vista 3).
 */
export function convertirCantidad(cantidad: Cantidad, destino: Unidad): Cantidad | null {
  if (!sonConvertibles(cantidad.unidad, destino)) return null;
  const result = Cantidad.create(
    (cantidad.valor * EN_BASE[cantidad.unidad]) / EN_BASE[destino],
    destino,
  );
  return result.ok ? result.value : null;
}

/**
 * Suma cantidades expresándolas en `destino`. `null` si alguna no se puede convertir
 * o si el total se sale de los límites de `Cantidad`.
 */
export function sumarCantidades(cantidades: readonly Cantidad[], destino: Unidad): Cantidad | null {
  let total = 0;
  for (const cantidad of cantidades) {
    const convertida = convertirCantidad(cantidad, destino);
    if (convertida === null) return null;
    total += convertida.valor;
  }
  const result = Cantidad.create(total, destino);
  return result.ok ? result.value : null;
}
