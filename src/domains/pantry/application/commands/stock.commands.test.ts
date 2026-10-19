import { describe, expect, it } from "vitest";
import type { Clock } from "@/shared/kernel/clock";
import {
  AHORA,
  ARMARIO_ID,
  CONGELADOR_ID,
  LECHE_BASE_ID,
  LINEA_ID,
  OTRA_LINEA_ID,
  USUARIO_ID,
  cantidad,
  dia,
  idN,
  linea,
  ubicacionesPorDefecto,
} from "../../testing/builders";
import { InMemoryPantryRepository } from "../../testing/in-memory-pantry-repository";
import { MAX_LINEAS_DESPENSA } from "../../domain/inventory-item";
import { AddStockCommand } from "./add-stock.command";
import { ConsumeStockCommand } from "./consume-stock.command";
import { RemoveStockCommand } from "./remove-stock.command";
import { StoreShoppingCommand } from "./store-shopping.command";
import { UpdateStockCommand } from "./update-stock.command";

const reloj: Clock = { now: () => AHORA };
const repoCon = (lineas = [linea()]) =>
  new InMemoryPantryRepository({ ubicaciones: ubicacionesPorDefecto(), lineas });
const arroz = {
  nombre: "Arroz",
  categoria: "despensa",
  cantidad: { valor: 1, unidad: "kg" },
  usuarioId: USUARIO_ID,
};

describe("AddStockCommand", () => {
  it("execute_SinUbicacion_ProponeLaDeSuTipo", async () => {
    const repo = repoCon([]);
    const add = new AddStockCommand(repo, reloj);

    const congelado = await add.execute({ ...arroz, nombre: "Guisantes", categoria: "congelados" });
    const ambiente = await add.execute(arroz);

    expect(congelado.ok && congelado.value?.ubicacionId).toBe(CONGELADOR_ID);
    expect(ambiente.ok && ambiente.value?.ubicacionId).toBe(ARMARIO_ID);
  });

  it("execute_MismoProductoSinFecha_SumaEnLaMismaLinea", async () => {
    const repo = repoCon([]);
    const add = new AddStockCommand(repo, reloj);

    await add.execute(arroz);
    const r = await add.execute({
      ...arroz,
      nombre: "ARROZ",
      cantidad: { valor: 500, unidad: "g" },
    });

    expect(r.ok && r.value?.cantidad).toEqual({ valor: 1.5, unidad: "kg" });
    expect(await repo.listarLineas()).toHaveLength(1);
    expect(repo.movimientos.size).toBe(2);
  });

  it("execute_OtraFecha_LineaAparte", async () => {
    const repo = repoCon([]);
    const add = new AddStockCommand(repo, reloj);

    await add.execute({ ...arroz, caducaEl: "2026-11-03" });
    await add.execute({ ...arroz, caducaEl: "2026-11-10" });
    await add.execute(arroz);

    expect(await repo.listarLineas()).toHaveLength(3);
  });

  it("execute_MismoMovimientoDosVeces_SoloSumaUna", async () => {
    const repo = repoCon([]);
    const add = new AddStockCommand(repo, reloj);

    await add.execute({ ...arroz, movimientoId: idN(1) });
    const segunda = await add.execute({ ...arroz, movimientoId: idN(1) });

    expect(segunda).toEqual({ ok: true, value: null });
    expect((await repo.listarLineas())[0]?.cantidad.valor).toBe(1);
  });

  it.each([
    [{ categoria: "juguetes" }, "CATEGORIA_NO_VALIDA"],
    [{ caducaEl: "31/12/2026" }, "FECHA_NO_VALIDA"],
    [{ ubicacionId: idN(99) }, "UBICACION_NO_ENCONTRADA"],
    [{ cantidad: { valor: 0, unidad: "kg" } }, "CANTIDAD_NO_VALIDA"],
  ] as const)("execute_DatosNoValidos_%#", async (cambio, code) => {
    const repo = repoCon([]);

    const r = await new AddStockCommand(repo, reloj).execute({ ...arroz, ...cambio });

    expect(r).toMatchObject({ ok: false, error: { code } });
    expect(repo.guardados).toBe(0);
  });

  it("execute_SinUbicacionesEnElHogar_UbicacionNoEncontrada", async () => {
    const r = await new AddStockCommand(new InMemoryPantryRepository(), reloj).execute(arroz);
    expect(r).toMatchObject({ ok: false, error: { code: "UBICACION_NO_ENCONTRADA" } });
  });

  it("execute_DespensaLlena_DespensaLlena", async () => {
    const lineas = Array.from({ length: MAX_LINEAS_DESPENSA }, (_, i) =>
      linea({ id: idN(i + 1), nombre: `Producto ${i}` }),
    );

    const r = await new AddStockCommand(repoCon(lineas), reloj).execute(arroz);

    expect(r).toMatchObject({ ok: false, error: { code: "DESPENSA_LLENA" } });
  });
});

describe("StoreShoppingCommand", () => {
  const compra = (ids: number[]) =>
    ids.map((n) => ({ id: idN(n), ...arroz, nombre: `Producto ${n}` }));

  it("execute_VariosProductos_UnaTransaccionConOrigenCompra", async () => {
    const repo = repoCon([]);

    const r = await new StoreShoppingCommand(repo, reloj).execute({
      listaId: idN(50),
      usuarioId: USUARIO_ID,
      productos: compra([1, 2, 3]),
    });

    expect(r).toMatchObject({ ok: true, value: { guardados: 3, repetidos: 0 } });
    expect(repo.guardados).toBe(1);
    expect(
      [...repo.movimientos.values()].every((m) => m.origen === "compra" && m.listaId === idN(50)),
    ).toBe(true);
  });

  it("execute_DobleEnvio_NoDuplica", async () => {
    const repo = repoCon([]);
    const store = new StoreShoppingCommand(repo, reloj);
    const input = { listaId: idN(50), usuarioId: USUARIO_ID, productos: compra([1, 2]) };

    await store.execute(input);
    const r = await store.execute(input);

    expect(r).toMatchObject({ ok: true, value: { guardados: 0, repetidos: 2 } });
    expect(await repo.listarLineas()).toHaveLength(2);
  });

  it("execute_UnoNoValido_NoGuardaNinguno", async () => {
    const repo = repoCon([]);

    const r = await new StoreShoppingCommand(repo, reloj).execute({
      listaId: idN(50),
      usuarioId: USUARIO_ID,
      productos: [...compra([1]), { id: idN(2), ...arroz, categoria: "juguetes" }],
    });

    expect(r.ok).toBe(false);
    expect(repo.guardados).toBe(0);
  });
});

describe("ConsumeStockCommand", () => {
  it("execute_Parte_RestaSinAvisar", async () => {
    const repo = repoCon([linea({ nombre: "Yogur", cantidad: cantidad(6, "unidad") })]);

    const r = await new ConsumeStockCommand(repo, reloj).execute({
      itemId: LINEA_ID,
      cantidad: { valor: 2, unidad: "unidad" },
      motivo: "gastado",
      usuarioId: USUARIO_ID,
    });

    expect(r).toMatchObject({
      ok: true,
      value: { agotada: false, avisarLista: false, linea: { cantidad: { valor: 4 } } },
    });
  });

  it("execute_QuedaUno_AvisaDeLaLista", async () => {
    const repo = repoCon([linea({ nombre: "Yogur", cantidad: cantidad(2, "unidad") })]);

    const r = await new ConsumeStockCommand(repo, reloj).execute({
      itemId: LINEA_ID,
      cantidad: { valor: 1, unidad: "unidad" },
      motivo: "gastado",
      usuarioId: USUARIO_ID,
    });

    expect(r).toMatchObject({ ok: true, value: { agotada: false, avisarLista: true } });
  });

  it("execute_LoUltimo_AvisaYDesaparece", async () => {
    const repo = repoCon();

    const r = await new ConsumeStockCommand(repo, reloj).execute({
      itemId: LINEA_ID,
      motivo: "tirado",
      usuarioId: USUARIO_ID,
    });

    expect(r).toMatchObject({ ok: true, value: { agotada: true, avisarLista: true } });
    expect(await repo.listarLineas()).toEqual([]);
    expect([...repo.movimientos.values()][0]?.tipo).toBe("desecho");
  });

  it("execute_QuedaOtraLineaDelMismoProducto_NoAvisa", async () => {
    const repo = repoCon([
      linea({ productoBaseId: LECHE_BASE_ID }),
      linea({ id: OTRA_LINEA_ID, productoBaseId: LECHE_BASE_ID, caducaEl: dia("2026-11-03") }),
    ]);

    const r = await new ConsumeStockCommand(repo, reloj).execute({
      itemId: LINEA_ID,
      motivo: "gastado",
      usuarioId: USUARIO_ID,
    });

    expect(r).toMatchObject({ ok: true, value: { agotada: true, avisarLista: false } });
  });

  it("execute_LineaInexistenteOCantidadMala_Error", async () => {
    const consume = new ConsumeStockCommand(repoCon(), reloj);

    expect(
      await consume.execute({ itemId: idN(9), motivo: "gastado", usuarioId: USUARIO_ID }),
    ).toMatchObject({
      ok: false,
      error: { code: "LINEA_NO_ENCONTRADA" },
    });
    expect(
      await consume.execute({
        itemId: LINEA_ID,
        cantidad: { valor: -1, unidad: "l" },
        motivo: "gastado",
        usuarioId: USUARIO_ID,
      }),
    ).toMatchObject({ ok: false, error: { code: "CANTIDAD_NO_VALIDA" } });
    expect(
      await consume.execute({
        itemId: LINEA_ID,
        cantidad: { valor: 5, unidad: "l" },
        motivo: "gastado",
        usuarioId: USUARIO_ID,
      }),
    ).toMatchObject({ ok: false, error: { code: "CANTIDAD_INSUFICIENTE" } });
  });
});

describe("UpdateStockCommand", () => {
  const update = (repo: InMemoryPantryRepository) => new UpdateStockCommand(repo, reloj);

  it("execute_SinCambios_SinCambios", async () => {
    expect(
      await update(repoCon()).execute({ itemId: LINEA_ID, usuarioId: USUARIO_ID }),
    ).toMatchObject({
      ok: false,
      error: { code: "SIN_CAMBIOS" },
    });
  });

  it("execute_FechaCategoriaYCantidad_LoAplicaTodo", async () => {
    const repo = repoCon();

    const r = await update(repo).execute({
      itemId: LINEA_ID,
      caducaEl: "2026-11-03",
      categoria: "bebidas",
      cantidad: { valor: 3, unidad: "l" },
      usuarioId: USUARIO_ID,
    });

    expect(r).toMatchObject({
      ok: true,
      value: { caducaEl: "2026-11-03", categoria: "bebidas", cantidad: { valor: 3, unidad: "l" } },
    });
    expect([...repo.movimientos.values()].map((m) => m.tipo)).toEqual(["ajuste"]);
  });

  it("execute_QuitarFecha_LaQuita", async () => {
    const repo = repoCon([linea({ caducaEl: dia("2026-11-03") })]);

    const r = await update(repo).execute({
      itemId: LINEA_ID,
      caducaEl: null,
      usuarioId: USUARIO_ID,
    });

    expect(r.ok && r.value.caducaEl).toBeNull();
  });

  it("execute_MoverDondeHayOtraIgual_LasJunta", async () => {
    const repo = repoCon([
      linea({ cantidad: cantidad(1, "l") }),
      linea({ id: OTRA_LINEA_ID, ubicacionId: ARMARIO_ID, cantidad: cantidad(500, "ml") }),
    ]);

    const r = await update(repo).execute({
      itemId: LINEA_ID,
      ubicacionId: ARMARIO_ID,
      usuarioId: USUARIO_ID,
    });

    expect(r).toMatchObject({
      ok: true,
      value: { id: OTRA_LINEA_ID, cantidad: { valor: 1500, unidad: "ml" } },
    });
    expect((await repo.listarLineas()).map((l) => l.id)).toEqual([OTRA_LINEA_ID]);
    expect([...repo.movimientos.values()].map((m) => m.tipo).sort()).toEqual(["baja", "entrada"]);
  });

  it.each([
    [{ ubicacionId: idN(99) }, "UBICACION_NO_ENCONTRADA"],
    [{ categoria: "juguetes" }, "CATEGORIA_NO_VALIDA"],
    [{ caducaEl: "mañana" }, "FECHA_NO_VALIDA"],
    [{ cantidad: { valor: 0, unidad: "l" } }, "CANTIDAD_NO_VALIDA"],
  ] as const)("execute_DatosNoValidos_%#", async (cambio, code) => {
    const repo = repoCon();
    expect(
      await update(repo).execute({ itemId: LINEA_ID, usuarioId: USUARIO_ID, ...cambio }),
    ).toMatchObject({
      ok: false,
      error: { code },
    });
    expect(repo.guardados).toBe(0);
  });

  it("execute_LineaInexistente_LineaNoEncontrada", async () => {
    expect(
      await update(repoCon()).execute({ itemId: idN(9), caducaEl: null, usuarioId: USUARIO_ID }),
    ).toMatchObject({ ok: false, error: { code: "LINEA_NO_ENCONTRADA" } });
  });
});

describe("RemoveStockCommand", () => {
  it("execute_LaQuitaConMovimientoDeBaja", async () => {
    const repo = repoCon();

    expect(
      await new RemoveStockCommand(repo, reloj).execute({
        itemId: LINEA_ID,
        usuarioId: USUARIO_ID,
      }),
    ).toEqual({
      ok: true,
      value: undefined,
    });
    expect(repo.linea(LINEA_ID)?.deletedAt).toEqual(AHORA);
    expect([...repo.movimientos.values()][0]?.tipo).toBe("baja");
  });

  it("execute_Inexistente_LineaNoEncontrada", async () => {
    expect(
      await new RemoveStockCommand(repoCon([]), reloj).execute({
        itemId: LINEA_ID,
        usuarioId: USUARIO_ID,
      }),
    ).toMatchObject({ ok: false, error: { code: "LINEA_NO_ENCONTRADA" } });
  });
});
