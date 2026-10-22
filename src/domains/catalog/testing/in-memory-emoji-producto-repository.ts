import type { EmojiProductoRepository } from "@/domains/catalog/application/ports/emoji-producto-repository";

export class InMemoryEmojiProductoRepository implements EmojiProductoRepository {
  readonly store = new Map<string, string>();

  constructor(iniciales: Readonly<Record<string, string>> = {}) {
    for (const [nombre, emoji] of Object.entries(iniciales)) this.store.set(nombre, emoji);
  }

  async buscar(nombreNormalizado: string): Promise<string | null> {
    return this.store.get(nombreNormalizado) ?? null;
  }

  async listar(): Promise<ReadonlyMap<string, string>> {
    return new Map(this.store);
  }

  async guardar(nombreNormalizado: string, emoji: string): Promise<void> {
    this.store.set(nombreNormalizado, emoji);
  }

  async borrar(nombreNormalizado: string): Promise<void> {
    this.store.delete(nombreNormalizado);
  }
}
