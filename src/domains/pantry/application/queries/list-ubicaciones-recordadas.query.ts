import type { UbicacionRecordada } from "@/domains/pantry/domain/ubicacion";
import { ok, type Result } from "@/shared/kernel/result";
import type { PantryRepository } from "../ports/pantry-repository";

/**
 * Dónde guardó el hogar cada producto la última vez: los formularios lo proponen. Solo
 * las que apuntan a una ubicación viva (las de una borrada ya se movieron u olvidaron).
 */
export class ListUbicacionesRecordadasQuery {
  constructor(private readonly despensa: PantryRepository) {}

  async execute(): Promise<Result<UbicacionRecordada[]>> {
    const [ubicaciones, recordadas] = await Promise.all([
      this.despensa.listarUbicaciones(),
      this.despensa.ubicacionesRecordadas(),
    ]);
    const vivas = new Set(ubicaciones.map((u) => u.id));
    return ok(
      [...recordadas]
        .filter(([, ubicacionId]) => vivas.has(ubicacionId))
        .map(([nombreNormalizado, ubicacionId]) => ({ nombreNormalizado, ubicacionId })),
    );
  }
}
