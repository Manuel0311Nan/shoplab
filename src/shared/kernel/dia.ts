import type { Clock } from "./clock";
import { validationError } from "./errors";
import { err, ok, type Result } from "./result";

declare const diaBrand: unique symbol;

/**
 * Un día del calendario ("2026-11-03"), sin hora. Las caducidades son días, no
 * instantes: guardada como instante en UTC, a las 23:30 de Madrid ya sería "mañana".
 */
export type Dia = string & { readonly [diaBrand]: true };

/** De momento todos los hogares viven en España. <PENDING: zona por hogar> */
export const ZONA_HOGAR = "Europe/Madrid";

const MS_DIA = 86_400_000;
const FORMATO = /^\d{4}-\d{2}-\d{2}$/;

export const Dia = {
  create(texto: string): Result<Dia> {
    if (!FORMATO.test(texto)) return err(fechaNoValida());
    const fecha = new Date(`${texto}T00:00:00.000Z`);
    // Rechaza fechas que no existen (2026-02-30 → 2 de marzo).
    if (Number.isNaN(fecha.getTime()) || fecha.toISOString().slice(0, 10) !== texto) {
      return err(fechaNoValida());
    }
    return ok(texto as Dia);
  },

  /** Una columna @db.Date llega como Date a las 00:00 UTC. */
  desdeFechaBd(fecha: Date): Dia {
    return fecha.toISOString().slice(0, 10) as Dia;
  },

  aFechaBd(dia: Dia): Date {
    return new Date(`${dia}T00:00:00.000Z`);
  },
};

function fechaNoValida() {
  return validationError("FECHA_NO_VALIDA", "La fecha debe ser un día válido (AAAA-MM-DD)");
}

/** El día de hoy en la zona del hogar. */
export function hoyEn(zona: string, clock: Clock): Dia {
  // en-CA formatea como AAAA-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: zona,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(clock.now()) as Dia;
}

/** Días de `desde` a `hasta`: 0 el mismo día, negativo si `hasta` ya pasó. */
export function diasHasta(desde: Dia, hasta: Dia): number {
  return Math.round((Dia.aFechaBd(hasta).getTime() - Dia.aFechaBd(desde).getTime()) / MS_DIA);
}

export function sumarDias(dia: Dia, dias: number): Dia {
  return Dia.desdeFechaBd(new Date(Dia.aFechaBd(dia).getTime() + dias * MS_DIA));
}
