import { describe, expect, it } from "vitest";
import { LECHE, LECHE_ID, PLATANO, PLATANO_ID, recordado } from "../../testing/builders";
import { InMemoryProductoBaseRepository } from "../../testing/in-memory-producto-base-repository";
import { InMemoryProductoRecordadoRepository } from "../../testing/in-memory-producto-recordado-repository";
import { ResolverProductoQuery } from "./resolver-producto.query";

const crear = (recordados = [recordado()]) =>
  new ResolverProductoQuery(
    new InMemoryProductoBaseRepository([PLATANO, LECHE]),
    new InMemoryProductoRecordadoRepository(recordados),
  );

describe("ResolverProductoQuery", () => {
  it("execute_ElegidoEnElAutocompletado_UsaEseProducto", async () => {
    expect(await crear().execute({ nombre: "lo que sea", productoBaseId: LECHE_ID })).toEqual({
      ok: true,
      value: { productoBaseId: LECHE_ID, categoria: "lacteos_huevos", unidad: "l" },
    });
  });

  it("execute_EscritoAManoComoLaListaBase_LoVincula", async () => {
    const result = await crear().execute({ nombre: "  LECHE entera " });

    expect(result.ok && result.value.productoBaseId).toBe(LECHE_ID);
  });

  it("execute_Sinonimo_LoVincula", async () => {
    const result = await crear().execute({ nombre: "Banana" });

    expect(result).toMatchObject({
      ok: true,
      value: { productoBaseId: PLATANO_ID, categoria: "frutas" },
    });
  });

  it("execute_TextoRecordado_UsaLaMemoriaDelHogar", async () => {
    expect(await crear().execute({ nombre: "tarta de la ABUELA" })).toEqual({
      ok: true,
      value: { productoBaseId: null, categoria: "panaderia", unidad: "unidad" },
    });
  });

  it("execute_MemoriaSobreListaBase_MandaLaDelHogar", async () => {
    const query = crear([recordado({ nombreNormalizado: "leche entera", categoria: "bebidas" })]);

    const result = await query.execute({ nombre: "Leche entera" });

    expect(result).toMatchObject({
      ok: true,
      value: { productoBaseId: LECHE_ID, categoria: "bebidas" },
    });
  });

  it("execute_Desconocido_Otros", async () => {
    expect(await crear([]).execute({ nombre: "Pilas AA" })).toEqual({
      ok: true,
      value: { productoBaseId: null, categoria: "otros", unidad: null },
    });
  });

  it("execute_IdElegidoQueNoExiste_BuscaPorNombre", async () => {
    const result = await crear().execute({
      nombre: "leche entera",
      productoBaseId: "0199c000-0000-7000-8000-0000000000ff",
    });

    expect(result.ok && result.value.productoBaseId).toBe(LECHE_ID);
  });
});
