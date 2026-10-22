import { describe, expect, it } from "vitest";
import { type PackRecordado, packTrasAlta } from "./pack-recordado";

const DE_4: PackRecordado = {
  nombreNormalizado: "yogur natural",
  unidadesPorPack: 4,
  enPack: true,
};

describe("packTrasAlta", () => {
  it("por packs: recuerda el tamaño y que fue en pack", () => {
    expect(
      packTrasAlta(null, { nombre: "Yogur  Natural", unidad: "unidad", unidadesPorPack: 4 }),
    ).toEqual(DE_4);
  });

  it("otro tamaño reemplaza al anterior; el mismo no cambia nada", () => {
    expect(
      packTrasAlta(DE_4, { nombre: "Yogur natural", unidad: "unidad", unidadesPorPack: 8 }),
    ).toEqual({
      ...DE_4,
      unidadesPorPack: 8,
    });
    expect(
      packTrasAlta(DE_4, { nombre: "Yogur natural", unidad: "unidad", unidadesPorPack: 4 }),
    ).toBeNull();
  });

  it("suelto en unidades: guarda el tamaño pero ya no propone pack", () => {
    expect(
      packTrasAlta(DE_4, { nombre: "Yogur natural", unidad: "unidad", unidadesPorPack: null }),
    ).toEqual({
      ...DE_4,
      enPack: false,
    });
    expect(
      packTrasAlta(
        { ...DE_4, enPack: false },
        { nombre: "Yogur natural", unidad: "unidad", unidadesPorPack: null },
      ),
    ).toBeNull();
    expect(
      packTrasAlta(null, { nombre: "Yogur natural", unidad: "unidad", unidadesPorPack: null }),
    ).toBeNull();
  });

  it("en otras unidades, un pack no válido o sin nombre no cambia nada", () => {
    expect(
      packTrasAlta(DE_4, { nombre: "Yogur natural", unidad: "kg", unidadesPorPack: null }),
    ).toBeNull();
    expect(
      packTrasAlta(null, { nombre: "Yogur natural", unidad: "unidad", unidadesPorPack: 1 }),
    ).toBeNull();
    expect(packTrasAlta(null, { nombre: "   ", unidad: "unidad", unidadesPorPack: 4 })).toBeNull();
  });
});
