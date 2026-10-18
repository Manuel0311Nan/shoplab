import type { Hogar, HogarSnapshot } from "@/domains/households/domain/hogar";

export interface HouseholdRepository {
  /** ¿El usuario es ya miembro de algún hogar? */
  esMiembroDeAlguno(usuarioId: string): Promise<boolean>;

  /**
   * Crea el hogar y a su fundador como primer miembro, todo o nada.
   * Devuelve `false` si ya existía un hogar con ese id (doble envío del formulario).
   */
  crear(hogar: Hogar): Promise<boolean>;

  findById(id: string): Promise<HogarSnapshot | null>;
}
