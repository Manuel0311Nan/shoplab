import { describe, expect, it } from "vitest";
import type { EmojiProductoRepository } from "@/domains/catalog/application/ports/emoji-producto-repository";

export type CrearRepositorioEmojis = (
  iniciales: Readonly<Record<string, string>>,
) => Promise<EmojiProductoRepository>;

/** Lo cumplen el fake en memoria y Prisma. */
export function emojiProductoRepositoryContract(
  nombre: string,
  crear: CrearRepositorioEmojis,
): void {
  describe(`EmojiProductoRepository: ${nombre}`, () => {
    it("guardar_BuscarYListar", async () => {
      const repo = await crear({});

      await repo.guardar("yogur griego", "🥣");
      await repo.guardar("aguacate", "🥑");
      await repo.guardar("yogur griego", "🍶");

      expect(await repo.buscar("yogur griego")).toBe("🍶");
      expect(Object.fromEntries(await repo.listar())).toEqual({
        "yogur griego": "🍶",
        aguacate: "🥑",
      });
    });

    it("borrar_LoQuitaYSiNoEstaNoFalla", async () => {
      const repo = await crear({ aguacate: "🥑" });

      await repo.borrar("aguacate");
      await repo.borrar("nada");

      expect(await repo.buscar("aguacate")).toBeNull();
    });
  });
}
