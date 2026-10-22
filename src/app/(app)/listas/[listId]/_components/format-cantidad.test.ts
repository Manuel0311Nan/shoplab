import { describe, expect, it } from "vitest";
import { cantidadCorta, formatCantidadItem } from "./format-cantidad";

describe("formatCantidadItem", () => {
  it("por packs dice cuántos packs y cuántas unidades", () => {
    expect(formatCantidadItem({ valor: 8, unidad: "unidad" }, 4)).toBe("2 packs · 8 ud.");
    expect(formatCantidadItem({ valor: 4, unidad: "unidad" }, 4)).toBe("1 pack · 4 ud.");
  });

  it("sin pack, o si no son packs enteros, la cantidad normal", () => {
    expect(formatCantidadItem({ valor: 1.5, unidad: "l" }, null)).toBe("1,5 l");
    expect(formatCantidadItem({ valor: 5, unidad: "unidad" }, 4)).toBe("5 ud.");
  });
});

describe("cantidadCorta", () => {
  it("1 ud. no se marca; varias, el número; packs, «packs×unidades»", () => {
    expect(cantidadCorta({ valor: 1, unidad: "unidad" }, null)).toBeNull();
    expect(cantidadCorta({ valor: 3, unidad: "unidad" }, null)).toBe("3");
    expect(cantidadCorta({ valor: 8, unidad: "unidad" }, 4)).toBe("2×4");
    expect(cantidadCorta({ valor: 6, unidad: "unidad" }, 4)).toBe("6");
  });

  it("en peso o volumen, con su unidad", () => {
    expect(cantidadCorta({ valor: 500, unidad: "g" }, null)).toBe("500 g");
    expect(cantidadCorta({ valor: 1.5, unidad: "l" }, null)).toBe("1,5 l");
  });
});
