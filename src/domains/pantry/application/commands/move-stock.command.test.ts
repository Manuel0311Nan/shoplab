import { describe, expect, it } from "vitest";
import type { Clock } from "@/shared/kernel/clock";
import {
  AHORA,
  ARMARIO_ID,
  LINEA_ID,
  NEVERA_ID,
  OTRA_LINEA_ID,
  USUARIO_ID,
  cantidad,
  dia,
  idN,
  linea,
  ubicacionesPorDefecto,
} from "../../testing/builders";
import { InMemoryPantryRepository } from "../../testing/in-memory-pantry-repository";
import { MoveStockCommand } from "./move-stock.command";
import { StoreShoppingCommand } from "./store-shopping.command";
import { UpdateStockCommand } from "./update-stock.command";

const reloj: Clock = { now: () => AHORA };
const avena = (cambios = {}) =>
  linea({
    nombre: "Leche de avena",
    ubicacionId: ARMARIO_ID,
    cantidad: cantidad(6, "unidad"),
    caducaEl: dia("2026-12-01"),
    ...cambios,
  });
const repoCon = (lineas = [avena()]) =>
  new InMemoryPantryRepository({ ubicaciones: ubicacionesPorDefecto(), lineas });

describe("MoveStockCommand", () => {
  it("execute_UnaParte_SeparaUnaLineaEnElDestinoYDejaElResto", async () => {
    const repo = repoCon();
    const mover = new MoveStockCommand(repo, reloj);

    const r = await mover.execute({
      itemId: LINEA_ID,
      ubicacionId: NEVERA_ID,
      cantidad: { valor: 1, unidad: "unidad" },
      lineaNuevaId: idN(50),
      usuarioId: USUARIO_ID,
    });

    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.movida).toMatchObject({
      id: idN(50),
      ubicacionId: NEVERA_ID,
      cantidad: { valor: 1, unidad: "unidad" },
      caducaEl: "2026-12-01",
    });
    expect(r.value.resto).toMatchObject({ id: LINEA_ID, cantidad: { valor: 5 } });
    const lineas = await repo.listarLineas();
    expect(lineas).toHaveLength(2);
    // Mover no es comprar ni gastar: dos ajustes.
    expect([...repo.movimientos.values()].map((m) => m.tipo)).toEqual(["ajuste", "ajuste"]);
  });

  it("execute_UnaParteConLineaIgualEnElDestino_SeSumaEnElla", async () => {
    const enNevera = avena({
      id: OTRA_LINEA_ID,
      ubicacionId: NEVERA_ID,
      cantidad: cantidad(1, "unidad"),
    });
    const repo = repoCon([avena(), enNevera]);

    const r = await new MoveStockCommand(repo, reloj).execute({
      itemId: LINEA_ID,
      ubicacionId: NEVERA_ID,
      cantidad: { valor: 2, unidad: "unidad" },
      usuarioId: USUARIO_ID,
    });

    expect(r.ok && r.value.movida).toMatchObject({ id: OTRA_LINEA_ID, cantidad: { valor: 3 } });
    expect(r.ok && r.value.resto?.cantidad.valor).toBe(4);
    expect(await repo.listarLineas()).toHaveLength(2);
  });

  it("execute_EnGramos_LlevaParteYConvierte", async () => {
    const repo = repoCon([
      linea({ nombre: "Arroz", ubicacionId: ARMARIO_ID, cantidad: cantidad(1, "kg") }),
    ]);

    const r = await new MoveStockCommand(repo, reloj).execute({
      itemId: LINEA_ID,
      ubicacionId: NEVERA_ID,
      cantidad: { valor: 250, unidad: "g" },
      usuarioId: USUARIO_ID,
    });

    expect(r.ok && r.value.movida.cantidad).toEqual({ valor: 0.25, unidad: "kg" });
    expect(r.ok && r.value.resto?.cantidad).toEqual({ valor: 0.75, unidad: "kg" });
  });

  it("execute_Todo_MueveLaLineaYRecuerdaElSitio", async () => {
    const repo = repoCon();

    const r = await new MoveStockCommand(repo, reloj).execute({
      itemId: LINEA_ID,
      ubicacionId: NEVERA_ID,
      cantidad: { valor: 6, unidad: "unidad" },
      usuarioId: USUARIO_ID,
    });

    expect(r.ok && r.value).toMatchObject({
      movida: { id: LINEA_ID, ubicacionId: NEVERA_ID },
      resto: null,
    });
    expect((await repo.ubicacionesRecordadas()).get("leche de avena")).toBe(NEVERA_ID);
  });

  it("execute_MasDeLoQueHay_Error", async () => {
    const r = await new MoveStockCommand(repoCon(), reloj).execute({
      itemId: LINEA_ID,
      ubicacionId: NEVERA_ID,
      cantidad: { valor: 7, unidad: "unidad" },
      usuarioId: USUARIO_ID,
    });

    expect(r.ok).toBe(false);
  });

  it("execute_UbicacionQueNoExiste_Error", async () => {
    const r = await new MoveStockCommand(repoCon(), reloj).execute({
      itemId: LINEA_ID,
      ubicacionId: idN(99),
      usuarioId: USUARIO_ID,
    });

    expect(!r.ok && r.error.code).toBe("UBICACION_NO_ENCONTRADA");
  });

  it("execute_Reintento_NoSeparaOtraVez", async () => {
    const repo = repoCon();
    const mover = new MoveStockCommand(repo, reloj);
    const input = {
      itemId: LINEA_ID,
      ubicacionId: NEVERA_ID,
      cantidad: { valor: 1, unidad: "unidad" },
      lineaNuevaId: idN(50),
      usuarioId: USUARIO_ID,
    };

    await mover.execute(input);
    const otra = await mover.execute(input);

    expect(otra.ok && otra.value.resto?.cantidad.valor).toBe(5);
    expect(await repo.listarLineas()).toHaveLength(2);
  });
});

describe("Por organizar", () => {
  const compra = (porOrganizar: boolean) => ({
    listaId: idN(70),
    usuarioId: USUARIO_ID,
    productos: [
      {
        id: idN(71),
        nombre: "Leche de avena",
        categoria: "lacteos_huevos",
        ubicacionId: ARMARIO_ID,
        cantidad: { valor: 6, unidad: "unidad" },
        porOrganizar,
      },
    ],
  });

  it("storeShopping_PorOrganizar_VaALaPropuestaMarcadoYSinRecordar", async () => {
    const repo = repoCon([]);

    const r = await new StoreShoppingCommand(repo, reloj).execute(compra(true));

    expect(r.ok && r.value.lineas[0]).toMatchObject({ porOrganizar: true, ubicacionId: NEVERA_ID });
    expect((await repo.ubicacionesRecordadas()).size).toBe(0);
  });

  it("storeShopping_PorOrganizar_NoSeMezclaConLoYaColocado", async () => {
    const repo = repoCon([linea({ nombre: "Leche de avena", cantidad: cantidad(2, "unidad") })]);

    await new StoreShoppingCommand(repo, reloj).execute(compra(true));

    expect(await repo.listarLineas()).toHaveLength(2);
  });

  it("updateStock_ALaMismaUbicacion_LaDaPorOrganizadaYSeJunta", async () => {
    const colocada = linea({ nombre: "Leche de avena", cantidad: cantidad(2, "unidad") });
    const pendiente = linea({
      id: OTRA_LINEA_ID,
      nombre: "Leche de avena",
      cantidad: cantidad(6, "unidad"),
      porOrganizar: true,
    });
    const repo = repoCon([colocada, pendiente]);

    const r = await new UpdateStockCommand(repo, reloj).execute({
      itemId: OTRA_LINEA_ID,
      ubicacionId: NEVERA_ID,
      usuarioId: USUARIO_ID,
    });

    expect(r.ok && r.value).toMatchObject({
      id: LINEA_ID,
      porOrganizar: false,
      cantidad: { valor: 8 },
    });
  });

  it("moveStock_UnaParteDeLoPorOrganizar_LaParteQuedaOrganizada", async () => {
    const repo = repoCon([avena({ porOrganizar: true })]);

    const r = await new MoveStockCommand(repo, reloj).execute({
      itemId: LINEA_ID,
      ubicacionId: NEVERA_ID,
      cantidad: { valor: 1, unidad: "unidad" },
      usuarioId: USUARIO_ID,
    });

    expect(r.ok && r.value.movida.porOrganizar).toBe(false);
    expect(r.ok && r.value.resto?.porOrganizar).toBe(true);
  });
});
