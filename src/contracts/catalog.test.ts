import { describe, expect, it } from "vitest";
import { CATEGORIAS } from "@/shared/kernel/categoria";
import { categoriaProductoSchema } from "./catalog";

describe("contrato catalog", () => {
  it("categoriaProductoSchema_ComparadoConElKernel_TieneLosMismosValores", () => {
    expect(categoriaProductoSchema.options).toEqual([...CATEGORIAS]);
  });
});
