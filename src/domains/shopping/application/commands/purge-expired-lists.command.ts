import { limiteDeCaducidad } from "@/domains/shopping/domain/shopping-list";
import type { Clock } from "@/shared/kernel/clock";
import { ok, type Result } from "@/shared/kernel/result";
import type { ListasCaducadasRepository } from "../ports/listas-caducadas-repository";

/**
 * Borra las listas archivadas hace 15 días o más. Las consultas ya las ocultan desde
 * el momento exacto en que caducan; esto solo consolida el borrado en la BD.
 */
export class PurgeExpiredListsCommand {
  constructor(
    private readonly caducadas: ListasCaducadasRepository,
    private readonly clock: Clock,
  ) {}

  async execute(): Promise<Result<{ borradas: number }>> {
    const ahora = this.clock.now();
    const borradas = await this.caducadas.marcarBorradas(limiteDeCaducidad(ahora), ahora);
    return ok({ borradas });
  }
}
