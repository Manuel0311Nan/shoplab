import { describe, expect, it } from "vitest";
import { normalizarNombre } from "./texto";

describe("normalizarNombre", () => {
  it.each([
    ["  Leche  Ácida ", "leche acida"],
    ["PLÁTANO", "platano"],
    ["Pechuga\tde   pollo", "pechuga de pollo"],
    ["Café", "cafe"],
  ])("normalizarNombre_%s", (entrada, esperado) => {
    expect(normalizarNombre(entrada)).toBe(esperado);
  });

  it("normalizarNombre_ConservaLaEñe", () => {
    // La ñ es una letra propia, no una n con tilde: "pina" y "piña" son distintos.
    expect(normalizarNombre("Piña")).toBe("piña");
  });
});
