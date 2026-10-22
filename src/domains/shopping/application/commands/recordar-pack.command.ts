import { type AltaParaRecordar, packTrasAlta } from "@/domains/shopping/domain/pack-recordado";
import { ok, type Result } from "@/shared/kernel/result";
import { normalizarNombre } from "@/shared/kernel/texto";
import type { PackRecordadoRepository } from "../ports/pack-recordado-repository";

/** Tras añadir a una lista: apunta (o actualiza) cómo se compra ese producto por packs. */
export class RecordarPackCommand {
  constructor(private readonly packs: PackRecordadoRepository) {}

  async execute(alta: AltaParaRecordar): Promise<Result<void>> {
    const actual = await this.packs.buscar(normalizarNombre(alta.nombre));
    const nuevo = packTrasAlta(actual, alta);
    if (nuevo !== null) await this.packs.guardar(nuevo);
    return ok(undefined);
  }
}
