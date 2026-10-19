import { describe, expect, it } from "vitest";
import { TIPOS_UBICACION } from "@/shared/kernel/categoria";
import { diaSchema, tipoUbicacionSchema } from "./pantry";

describe("contrato pantry", () => {
  it("tipoUbicacionSchema_ComparadoConElKernel_TieneLosMismosValores", () => {
    expect(tipoUbicacionSchema.options).toEqual([...TIPOS_UBICACION]);
  });

  it("diaSchema_SoloAAAAMMDD", () => {
    expect(diaSchema.safeParse("2026-11-03").success).toBe(true);
    expect(diaSchema.safeParse("3/11/2026").success).toBe(false);
  });
});
