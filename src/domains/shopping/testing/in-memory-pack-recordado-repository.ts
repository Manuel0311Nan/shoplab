import type { PackRecordadoRepository } from "@/domains/shopping/application/ports/pack-recordado-repository";
import type { PackRecordado } from "@/domains/shopping/domain/pack-recordado";

export class InMemoryPackRecordadoRepository implements PackRecordadoRepository {
  private readonly store = new Map<string, PackRecordado>();

  constructor(iniciales: readonly PackRecordado[] = []) {
    for (const p of iniciales) this.store.set(p.nombreNormalizado, p);
  }

  async buscar(nombreNormalizado: string): Promise<PackRecordado | null> {
    return this.store.get(nombreNormalizado) ?? null;
  }

  async listar(): Promise<PackRecordado[]> {
    return [...this.store.values()].sort((a, b) =>
      a.nombreNormalizado.localeCompare(b.nombreNormalizado),
    );
  }

  async guardar(pack: PackRecordado): Promise<void> {
    this.store.set(pack.nombreNormalizado, pack);
  }
}
