import "server-only";
import type { PackRecordadoRepository } from "@/domains/shopping/application/ports/pack-recordado-repository";
import type { PackRecordado } from "@/domains/shopping/domain/pack-recordado";
import { TenantRepository } from "@/shared/kernel/tenant-repository";

const SELECT = { nombreNormalizado: true, unidadesPorPack: true, enPack: true } as const;

export class PrismaPackRecordadoRepository
  extends TenantRepository
  implements PackRecordadoRepository
{
  async buscar(nombreNormalizado: string): Promise<PackRecordado | null> {
    return this.db.packRecordado.findFirst({ where: { nombreNormalizado }, select: SELECT });
  }

  async listar(): Promise<PackRecordado[]> {
    return this.db.packRecordado.findMany({
      orderBy: { nombreNormalizado: "asc" },
      select: SELECT,
    });
  }

  async borrar(nombreNormalizado: string): Promise<void> {
    await this.db.packRecordado.deleteMany({ where: { nombreNormalizado } });
  }

  async guardar(pack: PackRecordado): Promise<void> {
    const { nombreNormalizado, ...datos } = pack;
    await this.db.packRecordado.upsert({
      where: { hogarId_nombreNormalizado: { hogarId: this.hogarId, nombreNormalizado } },
      create: { ...pack, hogarId: this.hogarId },
      update: datos,
    });
  }
}
