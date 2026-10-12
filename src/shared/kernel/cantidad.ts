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
