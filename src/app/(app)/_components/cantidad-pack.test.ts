import { describe, expect, it } from "vitest";
import { aCantidadDeLista, propuestaDeUnidad } from "./cantidad-pack";

describe("aCantidadDeLista", () => {
  it("packs: pasa a unidades y guarda el tamaño", () => {
    expect(aCantidadDeLista(2, "pack", "4")).toEqual({
      ok: true,
      cantidad: { valor: 8, unidad: "unidad" },
      unidadesPorPack: 4,
    });
  });

  it("otras unidades: tal cual, sin pack", () => {
    expect(aCantidadDeLista(1.5, "kg", "4")).toEqual({
      ok: true,
      cantidad: { valor: 1.5, unidad: "kg" },
      unidadesPorPack: null,
    });
  });

  it.each([
    [0, "unidad", "4", "Indica una cantidad mayor que 0"],
    [Number.NaN, "pack", "4", "Indica una cantidad mayor que 0"],
    [1, "pack", "1", "Un pack tiene entre 2 y 100 unidades"],
    [1, "pack", "abc", "Un pack tiene entre 2 y 100 unidades"],
    [1.5, "pack", "4", "Indica cuántos packs, sin decimales"],
  ] as const)("rechaza %s %s de %s", (valor, unidad, porPack, mensaje) => {
    expect(aCantidadDeLista(valor, unidad, porPack)).toEqual({ ok: false, mensaje });
  });
});

describe("propuestaDeUnidad", () => {
  const packs = {
    "yogur natural": { unidadesPorPack: 6, enPack: true },
    agua: { unidadesPorPack: 8, enPack: false },
  };

  it("la última vez en pack: propone el pack con su tamaño", () => {
    expect(propuestaDeUnidad(packs, "Yogur  Natural", "unidad")).toEqual({
      unidad: "pack",
      porPack: "6",
    });
  });

  it("si no: su unidad, con el tamaño recordado o el de siempre", () => {
    expect(propuestaDeUnidad(packs, "Agua", "l")).toEqual({ unidad: "l", porPack: "8" });
    expect(propuestaDeUnidad(packs, "Pan", "unidad")).toEqual({ unidad: "unidad", porPack: "4" });
  });
});
