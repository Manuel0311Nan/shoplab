import { describe, expect, it } from "vitest";
import { emojiPorDefecto, esEmoji } from "./emoji";

describe("esEmoji", () => {
  it.each(["🥑", "🌶️", "👍🏽", "👨‍🍳", " 🍎 "])("acepta %s", (e) => {
    expect(esEmoji(e)).toBe(true);
  });

  it.each(["", "a", "🍎🍌", "🍎 manzana", "1", "😀".repeat(9)])("rechaza %s", (e) => {
    expect(esEmoji(e)).toBe(false);
  });
});

describe("emojiPorDefecto", () => {
  it.each([
    ["Plátano de Canarias", "🍌"],
    ["Manzana Granny Smith", "🍏"],
    ["Tomate frito", "🥫"],
    ["Tomates cherry", "🍅"],
    ["Atún en lata", "🥫"],
    ["Yogures proteína", null],
    ["Patatas fritas congeladas", "🍟"],
    ["Patatas", "🥔"],
    ["Pan de barra", "🥖"],
    ["Pan rallado", "🍞"],
    ["Pechuga de pavo en lonchas", "🦃"],
    ["Pechuga de pollo", "🍗"],
    ["Perejil fresco", "🌿"],
    ["Pera Conferencia", "🍐"],
    ["Té", "🍵"],
    ["Tarta de la abuela", null],
    ["Piña", "🍍"],
    ["Champiñones", "🍄"],
    ["Nueces", "🌰"],
  ])("%s → %s", (nombre, emoji) => {
    expect(emojiPorDefecto(nombre)).toBe(emoji);
  });
});
