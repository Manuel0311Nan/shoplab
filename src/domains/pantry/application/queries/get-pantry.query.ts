import { type Caducidad, estadoCaducidad } from "@/domains/pantry/domain/estado-caducidad";
import type { InventoryItemSnapshot } from "@/domains/pantry/domain/inventory-item";
import type { UbicacionSnapshot } from "@/domains/pantry/domain/ubicacion";
import { type EstadoAbierto, estadoAbierto } from "@/shared/kernel/abierto";
import type { Clock } from "@/shared/kernel/clock";
import { type Dia, hoyEn, ZONA_HOGAR } from "@/shared/kernel/dia";
import { ok, type Result } from "@/shared/kernel/result";
import type { PantryRepository } from "../ports/pantry-repository";

export type LineaDespensa = InventoryItemSnapshot & {
  readonly caducidad: Caducidad;
  /** D8: queda 1 ud. o el 20 % (en g, kg, ml o l) de lo que entró. */
  readonly quedaPoco: boolean;
  /** Abierto: cuántos días lleva y su color (verde, amarillo «revísalo», rojo). */
  readonly abierto: EstadoAbierto | null;
};

/** Estado de «abierto» de una línea en un día; null si está cerrada. */
export function abiertoDe(s: InventoryItemSnapshot, hoy: Dia): EstadoAbierto | null {
  return s.abiertoEl === null || s.avisoAbierto === null
    ? null
    : estadoAbierto(s.abiertoEl, hoy, s.avisoAbierto);
}

export interface VistaDespensa {
  /** El día con el que se calculó la caducidad: la pantalla no vuelve a calcularlo. */
  readonly hoy: Dia;
  readonly ubicaciones: UbicacionSnapshot[];
  readonly lineas: LineaDespensa[];
}

/**
 * Toda la despensa (como mucho 500 líneas, D9): ubicaciones en orden y líneas con su
 * estado de caducidad calculado en la zona del hogar. El agrupado (por ubicación o
 * categoría) lo hace la pantalla.
 */
export class GetPantryQuery {
  constructor(
    private readonly despensa: PantryRepository,
    private readonly clock: Clock,
  ) {}

  async execute(): Promise<Result<VistaDespensa>> {
    const [ubicaciones, lineas] = await Promise.all([
      this.despensa.listarUbicaciones(),
      this.despensa.listarLineas(),
    ]);
    const hoy = hoyEn(ZONA_HOGAR, this.clock);
    return ok({
      hoy,
      ubicaciones: ubicaciones.map((u) => u.toSnapshot()),
      lineas: lineas.map((l) => {
        const s = l.toSnapshot();
        return {
          ...s,
          caducidad: estadoCaducidad(s.caducaEl, hoy),
          quedaPoco: l.quedaPoco(),
          abierto: abiertoDe(s, hoy),
        };
      }),
    });
  }
}
