import { describe, expect, it } from "vitest";
import type { Clock } from "@/shared/kernel/clock";
import {
  AHORA,
  LINEA_ID,
  USUARIO_ID,
  cantidad,
  idN,
  linea,
  ubicacionesPorDefecto,
} from "../../testing/builders";
import { InMemoryPantryRepository } from "../../testing/in-memory-pantry-repository";
import { MAX_LINEAS_DESPENSA } from "../../domain/inventory-item";
import { avisosPorCategoria, OpenStockCommand } from "./open-stock.command";
import { UpdateStockCommand } from "./update-stock.command";

// 10:00 UTC del 20 de octubre: en Madrid también es 20.
const reloj: Clock = { now: () => AHORA };
const repoCon = (lineas = [linea()]) =>
  new InMemoryPantryRepository({ ubicaciones: ubicacionesPorDefecto(), lineas });

describe("OpenStockCommand", () => {
  it("sin día, abre hoy con el aviso de la categoría", async () => {
    const repo = repoCon();
    const r = await new OpenStockCommand(repo, reloj, avisosPorCategoria).execute({
      itemId: LINEA_ID,
      usuarioId: USUARIO_ID,
    });

    expect(r.ok).toBe(true);
    // La línea de prueba es de lácteos: 3 y 5 días.
    expect((await repo.findLinea(LINEA_ID))?.toSnapshot()).toMatchObject({
      abiertoEl: "2026-10-20",
      avisoAbierto: { amarillo: 3, rojo: 5 },
    });
  });

  it("usa el aviso que dé el catálogo para el producto", async () => {
    const repo = repoCon();
    const r = await new OpenStockCommand(repo, reloj, {
      para: async () => ({ amarillo: 14, rojo: 28 }),
    }).execute({ itemId: LINEA_ID, abiertoEl: "2026-10-18", usuarioId: USUARIO_ID });

    expect(r.ok && r.value.abierta).toMatchObject({
      abiertoEl: "2026-10-18",
      avisoAbierto: { amarillo: 14, rojo: 28 },
    });
  });

  it("con varias unidades separa una; un reintento con el mismo lineaNuevaId no separa otra", async () => {
    const repo = repoCon([
      linea({ cantidad: cantidad(4, "unidad"), cantidadReferencia: cantidad(4, "unidad") }),
    ]);
    const abrir = new OpenStockCommand(repo, reloj, avisosPorCategoria);
    const input = { itemId: LINEA_ID, lineaNuevaId: idN(90), usuarioId: USUARIO_ID };

    const r = await abrir.execute(input);
    const otra = await abrir.execute(input);

    expect(r.ok && r.value.resto?.cantidad.valor).toBe(3);
    expect(otra.ok && otra.value.abierta.id).toBe(idN(90));
    expect((await repo.listarLineas()).map((l) => l.cantidad.valor).sort()).toEqual([1, 3]);
  });

  it("errores: no existe, no se abre (fruta), ya abierta, día no válido, despensa llena", async () => {
    const abrir = (repo: InMemoryPantryRepository, extra = {}) =>
      new OpenStockCommand(repo, reloj, avisosPorCategoria).execute({
        itemId: LINEA_ID,
        usuarioId: USUARIO_ID,
        ...extra,
      });
    const codigo = async (p: ReturnType<typeof abrir>) => {
      const r = await p;
      return r.ok ? "ok" : r.error.code;
    };

    expect(await codigo(abrir(repoCon([])))).toBe("LINEA_NO_ENCONTRADA");
    expect(await codigo(abrir(repoCon([linea({ categoria: "frutas" })])))).toBe("NO_SE_ABRE");
    const yaAbierta = repoCon();
    await abrir(yaAbierta);
    expect(await codigo(abrir(yaAbierta))).toBe("LINEA_YA_ABIERTA");
    expect(await codigo(abrir(repoCon(), { abiertoEl: "2026-02-30" }))).toBe("FECHA_NO_VALIDA");

    const llenas = Array.from({ length: MAX_LINEAS_DESPENSA }, (_, i) =>
      linea({ id: idN(100 + i), nombre: `Producto ${i}` }),
    );
    const varias = linea({
      cantidad: cantidad(2, "unidad"),
      cantidadReferencia: cantidad(2, "unidad"),
    });
    expect(await codigo(abrir(repoCon([varias, ...llenas.slice(1)])))).toBe("DESPENSA_LLENA");
  });
});

describe("UpdateStockCommand: abiertoEl", () => {
  it("cierra una línea abierta y no abre una cerrada", async () => {
    const repo = repoCon();
    await new OpenStockCommand(repo, reloj, avisosPorCategoria).execute({
      itemId: LINEA_ID,
      usuarioId: USUARIO_ID,
    });
    const update = new UpdateStockCommand(repo, reloj);

    const cerrada = await update.execute({
      itemId: LINEA_ID,
      abiertoEl: null,
      usuarioId: USUARIO_ID,
    });
    const abrirPorPatch = await update.execute({
      itemId: LINEA_ID,
      abiertoEl: "2026-10-19",
      usuarioId: USUARIO_ID,
    });

    expect(cerrada.ok && cerrada.value.abiertoEl).toBeNull();
    expect(abrirPorPatch.ok).toBe(false);
    if (!abrirPorPatch.ok) expect(abrirPorPatch.error.code).toBe("LINEA_NO_ABIERTA");
    expect(
      (await update.execute({ itemId: LINEA_ID, abiertoEl: "x", usuarioId: USUARIO_ID })).ok,
    ).toBe(false);
  });
});
