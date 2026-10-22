import "server-only";
import type { EmojiProductoRepository } from "@/domains/catalog/application/ports/emoji-producto-repository";
import { TenantRepository } from "@/shared/kernel/tenant-repository";

export class PrismaEmojiProductoRepository
  extends TenantRepository
  implements EmojiProductoRepository
{
  async buscar(nombreNormalizado: string): Promise<string | null> {
    const fila = await this.db.emojiProducto.findFirst({
      where: { nombreNormalizado },
      select: { emoji: true },
    });
    return fila?.emoji ?? null;
  }

  async listar(): Promise<ReadonlyMap<string, string>> {
    const filas = await this.db.emojiProducto.findMany({
      select: { nombreNormalizado: true, emoji: true },
    });
    return new Map(filas.map((f) => [f.nombreNormalizado, f.emoji]));
  }

  async guardar(nombreNormalizado: string, emoji: string): Promise<void> {
    await this.db.emojiProducto.upsert({
      where: { hogarId_nombreNormalizado: { hogarId: this.hogarId, nombreNormalizado } },
      create: { hogarId: this.hogarId, nombreNormalizado, emoji },
      update: { emoji },
    });
  }

  async borrar(nombreNormalizado: string): Promise<void> {
    await this.db.emojiProducto.deleteMany({ where: { nombreNormalizado } });
  }
}
