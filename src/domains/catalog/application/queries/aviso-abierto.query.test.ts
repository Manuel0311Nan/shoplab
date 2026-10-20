import { describe, expect, it } from "vitest";
import { LECHE, PLATANO } from "@/domains/catalog/testing/builders";
import { InMemoryProductoBaseRepository } from "@/domains/catalog/testing/in-memory-producto-base-repository";
import { AvisoAbiertoQuery } from "./aviso-abierto.query";

const query = new AvisoAbiertoQuery(
  new InMemoryProductoBaseRepository([
    { ...LECHE, avisoAbierto: { amarillo: 4, rojo: 6 } },
    PLATANO,
  ]),
);

describe("AvisoAbiertoQuery", () => {
  it("usa la excepción del producto si la tiene", async () => {
    const r = await query.execute({ productoBaseId: LECHE.id, categoria: "lacteos_huevos" });
    expect(r.ok && r.value).toEqual({ amarillo: 4, rojo: 6 });
  });

  it("si no, la de su categoría (también para texto libre)", async () => {
    const r = await query.execute({ productoBaseId: null, categoria: "charcuteria" });
    expect(r.ok && r.value).toEqual({ amarillo: 3, rojo: 5 });
  });

  it("null si la categoría no se abre", async () => {
    const r = await query.execute({ productoBaseId: PLATANO.id, categoria: "frutas" });
    expect(r.ok && r.value).toBeNull();
  });
});
