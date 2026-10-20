import { describe, expect, it } from "vitest";
import { formatMedida, textoCaducaReceta, textoRaciones, unirEnFrase } from "./textos";

describe("unirEnFrase", () => {
  it("une con comas y «y»", () => {
    expect(unirEnFrase([])).toBe("");
    expect(unirEnFrase(["cebolla"])).toBe("cebolla");
    expect(unirEnFrase(["cebolla", "ajo"])).toBe("cebolla y ajo");
    expect(unirEnFrase(["cebolla", "ajo", "perejil"])).toBe("cebolla, ajo y perejil");
  });
});

describe("textoCaducaReceta", () => {
  it("solo avisa de lo que caduca esta semana", () => {
    expect(textoCaducaReceta(null)).toBeNull();
    expect(textoCaducaReceta({ nombre: "Leche", dias: 8 })).toBeNull();
    expect(textoCaducaReceta({ nombre: "Leche", dias: 3 })).toBe("Leche caduca en 3 días");
    expect(textoCaducaReceta({ nombre: "Leche", dias: 1 })).toBe("Leche caduca mañana");
    expect(textoCaducaReceta({ nombre: "Leche", dias: 0 })).toBe("Leche caduca hoy");
    expect(textoCaducaReceta({ nombre: "Leche", dias: -2 })).toBe("Leche: ya caducó");
  });
});

describe("textoRaciones", () => {
  it("dice si se ajustó a la despensa", () => {
    expect(textoRaciones(4, 4)).toBe("Para 4 raciones");
    expect(textoRaciones(1, 4)).toBe("Para 1 ración (la receta es para 4)");
  });
});

describe("formatMedida", () => {
  it("pasa a kg y l a partir de mil", () => {
    expect(formatMedida({ valor: 1000, unidad: "g" })).toBe("1 kg");
    expect(formatMedida({ valor: 1500, unidad: "ml" })).toBe("1,5 l");
    expect(formatMedida({ valor: 240, unidad: "g" })).toBe("240 g");
    expect(formatMedida({ valor: 0.5, unidad: "unidad" })).toBe("0,5 ud.");
    expect(formatMedida({ valor: 0.75, unidad: "l" })).toBe("0,75 l");
  });
});
