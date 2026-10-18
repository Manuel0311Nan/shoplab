import { describe, expect, it } from "vitest";
import { CATEGORIAS } from "@/domains/catalog/domain/producto-base";
import { categoriaProductoSchema } from "@/contracts/catalog";

describe("contrato catalog frente al dominio", () => {
  it("categoriaProductoSchema_ComparadoConElDominio_TieneLosMismosValores", () => {
    expect(categoriaProductoSchema.options).toEqual([...CATEGORIAS]);
  });
});
