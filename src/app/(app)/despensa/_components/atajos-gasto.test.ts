import { describe, expect, it } from "vitest";
import { atajosDeGasto } from "./atajos-gasto";

describe("atajosDeGasto", () => {
  it("en unidades no hay atajos: está el «−1»", () => {
    expect(atajosDeGasto({ valor: 6, unidad: "unidad" })).toEqual([]);
  });

  it("¼, ½ y todo de lo que queda", () => {
    expect(atajosDeGasto({ valor: 1, unidad: "kg" }).map((a) => [a.etiqueta, a.valor])).toEqual([
      ["¼", 0.25],
      ["½", 0.5],
      ["Todo", undefined],
    ]);
  });

  it("si queda tan poco que ¼ y ½ no se distinguen, solo «Todo»", () => {
    expect(atajosDeGasto({ valor: 0.001, unidad: "l" }).map((a) => a.etiqueta)).toEqual(["Todo"]);
  });
});
