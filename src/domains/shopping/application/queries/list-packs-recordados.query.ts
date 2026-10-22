import type { PackRecordado } from "@/domains/shopping/domain/pack-recordado";
import { ok, type Result } from "@/shared/kernel/result";
import type { PackRecordadoRepository } from "../ports/pack-recordado-repository";

/** Los packs que recuerda el hogar: los formularios los proponen al elegir un producto. */
export class ListPacksRecordadosQuery {
  constructor(private readonly packs: PackRecordadoRepository) {}

  async execute(): Promise<Result<PackRecordado[]>> {
    return ok(await this.packs.listar());
  }
}
