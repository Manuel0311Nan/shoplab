import { describe, expect, it } from "vitest";
import { CATEGORIAS } from "@/shared/kernel/categoria";
import { categoriaSchema } from "./categoria";

describe("contrato catalog", () => {
  it("categoriaSchema_ComparadoConElKernel_TieneLosMismosValoresEnElMismoOrden", () => {
    expect(categoriaSchema.options).toEqual([...CATEGORIAS]);
  });
});
