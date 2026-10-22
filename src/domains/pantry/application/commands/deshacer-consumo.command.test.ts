import { describe, expect, it } from "vitest";
import type { Clock } from "@/shared/kernel/clock";
import {
  AHORA,
  LINEA_ID,
  OTRA_LINEA_ID,
  USUARIO_ID,
  cantidad,
  idN,
  linea,
  ubicacionesPorDefecto,
} from "../../testing/builders";
import { InMemoryPantryRepository } from "../../testing/in-memory-pantry-repository";
import { ConsumeStockCommand } from "./consume-stock.command";
import { DeshacerConsumoCommand, MINUTOS_PARA_DESHACER } from "./deshacer-consumo.command";

const en = (minutos: number): Clock => ({
  now: () => new Date(AHORA.getTime() + minutos * 60_000),
});
const repoCon = (lineas = [linea({ cantidad: cantidad(4, "unidad") })]) =>
  new InMemoryPantryRepository({ ubicaciones: ubicacionesPorDefecto(), lineas });
const gastar = (
  repo: InMemoryPantryRepository,
  valor?: number,
  motivo: "gastado" | "tirado" = "gastado",
) =>
  new ConsumeStockCommand(repo, en(0)).execute({
    itemId: LINEA_ID,
    motivo,
    usuarioId: USUARIO_ID,
    movimientoId: idN(1),
    ...(valor === undefined ? {} : { cantidad: { valor, unidad: "unidad" } }),
  });
const deshacer = (repo: InMemoryPantryRepository, minutos = 1, id = idN(2)) =>
  new DeshacerConsumoCommand(repo, en(minutos)).execute({
    movimientoId: idN(1),
    id,
    usuarioId: USUARIO_ID,
  });

describe("DeshacerConsumoCommand", () => {
  it("devuelve lo gastado con un ajuste", async () => {
    const repo = repoCon();
    await gastar(repo, 1);

    const r = await deshacer(repo);

    expect(r).toMatchObject({ ok: true, value: { id: LINEA_ID, cantidad: { valor: 4 } } });
    expect(repo.movimientos.get(idN(2))).toMatchObject({ tipo: "ajuste", cantidad: { valor: 4 } });
  });

  it("si se había acabado, la línea vuelve (también al tirar)", async () => {
    const repo = repoCon([linea({ cantidad: cantidad(1, "unidad") })]);
    await gastar(repo, undefined, "tirado");
    expect(await repo.listarLineas()).toHaveLength(0);

    const r = await deshacer(repo);

    expect(r).toMatchObject({ ok: true, value: { cantidad: { valor: 1 }, deletedAt: null } });
    expect(await repo.listarLineas()).toHaveLength(1);
  });

  it("un reintento no devuelve dos veces", async () => {
    const repo = repoCon();
    await gastar(repo, 1);

    await deshacer(repo);
    await deshacer(repo);

    expect((await repo.findLinea(LINEA_ID))?.cantidad.valor).toBe(4);
  });

  it("si al volver coincide con otra igual, se juntan", async () => {
    const repo = repoCon([linea({ cantidad: cantidad(1, "unidad") })]);
    await gastar(repo);
    await repo.guardar({
      lineas: [linea({ id: OTRA_LINEA_ID, cantidad: cantidad(6, "unidad") })],
    });

    const r = await deshacer(repo);

    expect(r).toMatchObject({ ok: true, value: { id: OTRA_LINEA_ID, cantidad: { valor: 7 } } });
    expect(await repo.listarLineas()).toHaveLength(1);
  });

  it("pasado el margen, o si no existe, no se puede", async () => {
    const repo = repoCon();
    await gastar(repo, 1);

    expect(await deshacer(repo, MINUTOS_PARA_DESHACER + 1)).toMatchObject({
      ok: false,
      error: { code: "NO_SE_PUEDE_DESHACER" },
    });
    expect(
      await new DeshacerConsumoCommand(repo, en(0)).execute({
        movimientoId: idN(9),
        id: idN(3),
        usuarioId: USUARIO_ID,
      }),
    ).toMatchObject({ ok: false, error: { code: "MOVIMIENTO_NO_ENCONTRADO" } });
  });

  it("solo se deshacen gastos, y una línea quitada por otro motivo no vuelve", async () => {
    const l = linea({ cantidad: cantidad(2, "unidad") });
    const otro = { id: idN(4), usuarioId: USUARIO_ID };
    const entrada = l.sumar(cantidad(1, "unidad"), otro, AHORA);
    if (!entrada.ok) throw new Error("debería sumar");
    expect(
      l.deshacerConsumo(entrada.value, { id: idN(5), usuarioId: USUARIO_ID }, AHORA),
    ).toMatchObject({
      ok: false,
    });

    const consumo = l.consumir(undefined, "gastado", { id: idN(6), usuarioId: USUARIO_ID }, AHORA);
    if (!consumo.ok) throw new Error("debería consumir");
    const despues = new Date(AHORA.getTime() + 1000);
    const dadaDeBaja = linea({ cantidad: cantidad(3, "unidad"), deletedAt: despues });
    expect(
      dadaDeBaja.deshacerConsumo(
        consumo.value.movimiento,
        { id: idN(7), usuarioId: USUARIO_ID },
        despues,
      ),
    ).toMatchObject({ ok: false, error: { code: "NO_SE_PUEDE_DESHACER" } });
  });
});
