import { describe, expect, it } from "vitest";
import { Cantidad, convertirCantidad, sonConvertibles, sumarCantidades } from "./cantidad";

function c(valor: number, unidad: string): Cantidad {
  const result = Cantidad.create(valor, unidad);
  if (!result.ok) throw new Error(result.error.code);
  return result.value;
}

describe("Cantidad", () => {
  it.each([
    [0, "kg"],
    [-1, "kg"],
    [100_001, "g"],
  ])("create_FueraDeLimites_DevuelveCantidadNoValida (%s %s)", (valor, unidad) => {
    expect(Cantidad.create(valor, unidad)).toMatchObject({
      ok: false,
      error: { code: "CANTIDAD_NO_VALIDA" },
    });
  });

  it("create_UnidadDesconocida_DevuelveUnidadNoValida", () => {
    expect(Cantidad.create(1, "docena")).toMatchObject({
      ok: false,
      error: { code: "UNIDAD_NO_VALIDA" },
    });
  });

  it("sonConvertibles_SoloDentroDeLaMismaFamilia", () => {
    expect(sonConvertibles("g", "kg")).toBe(true);
    expect(sonConvertibles("ml", "l")).toBe(true);
    expect(sonConvertibles("unidad", "kg")).toBe(false);
    expect(sonConvertibles("g", "l")).toBe(false);
  });

  it("convertirCantidad_GramosAKilos", () => {
    expect(convertirCantidad(c(500, "g"), "kg")).toMatchObject({ valor: 0.5, unidad: "kg" });
  });

  it("convertirCantidad_EntreFamilias_DevuelveNull", () => {
    expect(convertirCantidad(c(1, "unidad"), "l")).toBeNull();
  });

  it("sumarCantidades_500gMas1kg_EnLaUnidadElegida", () => {
    expect(sumarCantidades([c(500, "g"), c(1, "kg")], "kg")).toMatchObject({
      valor: 1.5,
      unidad: "kg",
    });
    expect(sumarCantidades([c(500, "g"), c(1, "kg")], "g")).toMatchObject({
      valor: 1500,
      unidad: "g",
    });
  });

  it("sumarCantidades_ConUnaNoConvertible_DevuelveNull", () => {
    expect(sumarCantidades([c(1, "l"), c(1, "unidad")], "l")).toBeNull();
  });

  it("sumarCantidades_QueSuperaElMaximo_DevuelveNull", () => {
    expect(sumarCantidades([c(100_000, "g"), c(1, "g")], "g")).toBeNull();
  });
});
