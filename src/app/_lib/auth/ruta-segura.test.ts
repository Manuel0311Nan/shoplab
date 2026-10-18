import { describe, expect, it } from "vitest";
import { rutaSegura } from "./ruta-segura";

describe("rutaSegura", () => {
  it.each(["/listas/0199b000-0000-7000-8000-000000000003", "/", "/listas?x=1#y"])(
    "rutaSegura_RutaInterna_LaDevuelve (%s)",
    (ruta) => {
      expect(rutaSegura(ruta)).toBe(ruta);
    },
  );

  it.each([
    null,
    undefined,
    "",
    "https://web-falsa.com",
    "//web-falsa.com",
    "/\\web-falsa.com",
    "javascript:alert(1)",
    "listas",
    "/\t/web-falsa.com",
  ])("rutaSegura_RutaPeligrosaOVacia_DevuelveLaPorDefecto (%#)", (ruta) => {
    expect(rutaSegura(ruta)).toBe("/");
  });

  it("rutaSegura_ConOtroDefecto_LoUsa", () => {
    expect(rutaSegura(null, "/bienvenida")).toBe("/bienvenida");
  });
});
