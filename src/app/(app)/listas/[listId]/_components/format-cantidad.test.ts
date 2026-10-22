import { describe, expect, it } from "vitest";
import { formatCantidadItem } from "./format-cantidad";

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
