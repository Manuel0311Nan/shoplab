import type { HouseholdRepository } from "@/domains/households/application/ports/household-repository";
import type { Hogar, HogarSnapshot } from "@/domains/households/domain/hogar";

/**
 * Fake que imita a Prisma: guarda snapshots y exige que el fundador exista
 * (en la BD hay una clave foránea a Usuario). Cumple la misma suite de contrato.
 */
export class InMemoryHouseholdRepository implements HouseholdRepository {
  private readonly usuarios: Set<string>;
  private readonly hogares = new Map<string, HogarSnapshot>();
  private readonly miembros = new Set<string>();

  constructor(inicial: { usuarios?: readonly string[]; hogares?: readonly Hogar[] } = {}) {
    this.usuarios = new Set(inicial.usuarios);
    for (const h of inicial.hogares ?? []) this.guardar(h.toSnapshot());
  }

  async esMiembroDeAlguno(usuarioId: string): Promise<boolean> {
    return this.miembros.has(usuarioId);
  }

  async crear(hogar: Hogar): Promise<boolean> {
    const snapshot = hogar.toSnapshot();
    if (this.hogares.has(snapshot.id)) return false;
    this.guardar(snapshot);
    return true;
  }

  async findById(id: string): Promise<HogarSnapshot | null> {
    return this.hogares.get(id) ?? null;
  }

  private guardar(snapshot: HogarSnapshot): void {
    if (!this.usuarios.has(snapshot.fundadorId)) {
      throw new Error(`El usuario ${snapshot.fundadorId} no existe (clave foránea)`);
    }
    this.hogares.set(snapshot.id, snapshot);
    this.miembros.add(snapshot.fundadorId);
  }
}
