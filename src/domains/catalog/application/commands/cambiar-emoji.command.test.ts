import { describe, expect, it } from "vitest";
import { InMemoryEmojiProductoRepository } from "../../testing/in-memory-emoji-producto-repository";
import { CambiarEmojiCommand, ListEmojisQuery } from "./cambiar-emoji.command";

describe("CambiarEmojiCommand", () => {
  it("guarda por nombre normalizado y null lo quita", async () => {
    const repo = new InMemoryEmojiProductoRepository();
    const cambiar = new CambiarEmojiCommand(repo);

    await cambiar.execute({ nombre: " Yogur  Griego ", emoji: " 🥣 " });
    expect(await new ListEmojisQuery(repo).execute()).toEqual({
      ok: true,
      value: new Map([["yogur griego", "🥣"]]),
    });

    await cambiar.execute({ nombre: "yogur griego", emoji: null });
    expect(repo.store.size).toBe(0);
  });

  it.each([
    [{ nombre: "Yogur", emoji: "yogur" }, "EMOJI_NO_VALIDO"],
    [{ nombre: "Yogur", emoji: "🥣🍓" }, "EMOJI_NO_VALIDO"],
    [{ nombre: "  ", emoji: "🥣" }, "NOMBRE_NO_VALIDO"],
  ])("rechaza %o", async (input, code) => {
    const r = await new CambiarEmojiCommand(new InMemoryEmojiProductoRepository()).execute(input);
    expect(r).toMatchObject({ ok: false, error: { code } });
  });
});
