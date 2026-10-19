import { describe, expect, it } from "vitest";
import {
  compararCategorias,
  esCategoria,
  NOMBRE_CATEGORIA,
  CATEGORIAS,
  tipoDeUbicacion,
} from "./categoria";

describe("categoria", () => {
  it("otrosVaAlFinal_YTodasTienenNombre", () => {
    expect(CATEGORIAS.at(-1)).toBe("otros");
    for (const c of CATEGORIAS) expect(NOMBRE_CATEGORIA[c]).not.toBe("");
  });

  it("compararCategorias_OrdenDelSuper", () => {
    const desordenadas = ["limpieza", "frutas", "otros", "pescado"] as const;
    expect([...desordenadas].sort(compararCategorias)).toEqual([
      "frutas",
      "pescado",
      "limpieza",
      "otros",
    ]);
  });

  it("esCategoria_ValoresDesconocidos_False", () => {
    expect(esCategoria("frutas")).toBe(true);
    expect(esCategoria("juguetes")).toBe(false);
  });

  it.each([
    ["congelados", "congelado"],
    ["pescado", "frio"],
    ["lacteos_huevos", "frio"],
    ["frutas", "ambiente"],
    ["otros", "ambiente"],
  ] as const)("tipoDeUbicacion_%s_%s", (categoria, tipo) => {
    expect(tipoDeUbicacion(categoria)).toBe(tipo);
  });
});
