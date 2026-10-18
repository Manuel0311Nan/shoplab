import { describe, expect, it } from "vitest";
import { listaCon, listaId, minutos } from "../../testing/builders";
import { InMemoryShoppingListRepository } from "../../testing/in-memory-shopping-list-repository";
import { ListShoppingListsQuery } from "./list-shopping-lists.query";

const archivadas = (n: number) =>
  Array.from({ length: n }, (_, i) =>
    listaCon({ id: listaId(i + 1), nombre: `L${i + 1}`, archivadaAt: minutos(i + 1) }),
  );

const crear = (listas = archivadas(0)) =>
  new ListShoppingListsQuery(
    new InMemoryShoppingListRepository(listas, { now: () => minutos(60) }),
  );

describe("ListShoppingListsQuery", () => {
  it("execute_Activas_DevuelveTodasSinCursor", async () => {
    const query = crear([listaCon(), ...archivadas(2)]);

    const result = await query.execute({ estado: "activas" });

    expect(result).toMatchObject({
      ok: true,
      value: { items: [{ nombre: "Semana", caducaEl: null }], nextCursor: null },
    });
  });

  it("execute_SinListas_DevuelveVacio", async () => {
    expect(await crear().execute({ estado: "activas" })).toEqual({
      ok: true,
      value: { items: [], nextCursor: null },
    });
  });

  it("execute_Archivadas_IncluyeFechaDeBorradoA15Dias", async () => {
    const result = await crear(archivadas(1)).execute({ estado: "archivadas" });

    expect(result.ok && result.value.items[0]?.caducaEl).toEqual(
      new Date(minutos(1).getTime() + 15 * 24 * 60 * 60_000),
    );
  });

  it("execute_ArchivadasConVariasPaginas_RecorreTodasConElCursor", async () => {
    const query = crear(archivadas(5));

    const primera = await query.execute({ estado: "archivadas", limite: 2 });
    const cursor1 = primera.ok ? primera.value.nextCursor : null;
    const segunda = await query.execute({ estado: "archivadas", limite: 2, cursor: cursor1 ?? "" });
    const cursor2 = segunda.ok ? segunda.value.nextCursor : null;
    const tercera = await query.execute({ estado: "archivadas", limite: 2, cursor: cursor2 ?? "" });

    const nombres = [primera, segunda, tercera].flatMap((r) =>
      r.ok ? r.value.items.map((l) => l.nombre) : [],
    );
    expect(nombres).toEqual(["L5", "L4", "L3", "L2", "L1"]);
    expect(tercera.ok && tercera.value.nextCursor).toBeNull();
  });

  it("execute_PaginaExacta_NoDevuelveCursor", async () => {
    const result = await crear(archivadas(2)).execute({ estado: "archivadas", limite: 2 });

    expect(result.ok && result.value.nextCursor).toBeNull();
  });

  it("execute_CursorNoValido_DevuelveErrorDeValidacion", async () => {
    const result = await crear().execute({ estado: "archivadas", cursor: "basura" });

    expect(result).toMatchObject({ ok: false, error: { code: "CURSOR_NO_VALIDO" } });
  });

  it("execute_LimiteFueraDeRango_LoAjusta", async () => {
    const result = await crear(archivadas(3)).execute({ estado: "archivadas", limite: 0 });

    expect(result.ok && result.value.items).toHaveLength(1);
  });
});
