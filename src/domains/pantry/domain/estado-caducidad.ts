import { type Dia, diasHasta } from "@/shared/kernel/dia";

/** D5: "caduca pronto" es esta semana. */
export const DIAS_CADUCA_PRONTO = 7;

export type EstadoCaducidad = "caducado" | "pronto" | "ok" | "sin_fecha";

export interface Caducidad {
  readonly estado: EstadoCaducidad;
  /** Días que faltan (negativo si ya pasó); null sin fecha. */
  readonly dias: number | null;
}

/** El día de caducidad aún vale: caduca HOY es "pronto", no "caducado". */
export function estadoCaducidad(caducaEl: Dia | null, hoy: Dia): Caducidad {
  if (caducaEl === null) return { estado: "sin_fecha", dias: null };
  const dias = diasHasta(hoy, caducaEl);
  if (dias < 0) return { estado: "caducado", dias };
  return { estado: dias <= DIAS_CADUCA_PRONTO ? "pronto" : "ok", dias };
}
