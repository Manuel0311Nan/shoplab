import { describe, expect, it } from "vitest";
import { claveParecida, gruposParecidos } from "./parecidos";

describe("claveParecida", () => {
  it("ignora tildes, mayúsculas, plurales, palabras vacías y orden", () => {
    expect(claveParecida("Yogures proteína natural")).toBe(claveParecida("yogur proteina natural"));
    expect(claveParecida("Tomates")).toBe(claveParecida("tomate"));
    expect(claveParecida("Panes")).toBe(claveParecida("pan"));
    expect(claveParecida("Yogur de fresa")).toBe(claveParecida("fresa yogur"));
  });

  it("distingue lo que es distinto", () => {
    expect(claveParecida("Yogur proteína fresa")).not.toBe(claveParecida("Yogur proteína natural"));
    expect(claveParecida("de la")).toBe("");
  });
});

describe("gruposParecidos", () => {
  const hogar = (nombre: string) => ({ nombreNormalizado: nombre.toLowerCase(), nombre });

  it("agrupa los del hogar que se parecen y los que se parecen a la lista base", () => {
    const grupos = gruposParecidos(
      [
        hogar("Yogures proteina natural"),
        hogar("Yogur proteína natural"),
        hogar("Yogur proteína fresa"),
        hogar("Leches enteras"),
        hogar("   "),
      ],
      [{ id: "b1", nombre: "Leche entera" }],
    );

    expect(grupos).toEqual([
      { productos: [hogar("Leches enteras")], base: { id: "b1", nombre: "Leche entera" } },
      {
        productos: [hogar("Yogures proteina natural"), hogar("Yogur proteína natural")],
        base: null,
      },
    ]);
  });
});
