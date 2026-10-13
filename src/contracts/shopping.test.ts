import { describe, expect, it } from "vitest";
import { UNIDADES } from "@/shared/kernel/unidad";
import { unidadSchema } from "./shopping";
describe("contrato shopping", () => {
  it("unidadSchema_ComparadoConElKernel_TieneLosMismosValores", () => {
    expect([...unidadSchema.options].sort()).toEqual([...UNIDADES].sort());
  });
});
