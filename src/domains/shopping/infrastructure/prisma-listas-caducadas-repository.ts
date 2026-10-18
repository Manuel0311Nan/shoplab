import "server-only";
import type { ListasCaducadasRepository } from "@/domains/shopping/application/ports/listas-caducadas-repository";
import { prisma } from "@/shared/kernel/prisma";

/**
 * Sin tenant a propósito: el cron limpia todos los hogares. Usa el cliente base,
 * así que solo lo construye `purgaDeListasModule` (no hay AuthContext).
 */
export class PrismaListasCaducadasRepository implements ListasCaducadasRepository {
  async marcarBorradas(limite: Date, ahora: Date): Promise<number> {
    const { count } = await prisma.shoppingList.updateMany({
      where: { deletedAt: null, archivadaAt: { lte: limite } },
      data: { deletedAt: ahora, updatedAt: ahora },
    });
    return count;
  }
}
