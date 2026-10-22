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
  idN,
  linea,
  ubicacionesPorDefecto,
} from "../../testing/builders";
import { InMemoryPantryRepository } from "../../testing/in-memory-pantry-repository";
import { RenombrarEnDespensaCommand } from "./renombrar-en-despensa.command";
import { UpdateStockCommand } from "./update-stock.command";

const reloj: Clock = { now: () => AHORA };
const repoCon = (lineas = [linea()]) =>
  new InMemoryPantryRepository({ ubicaciones: ubicacionesPorDefecto(), lineas });
const BASE_ID = "0199c000-0000-7000-8000-0000000000c9";

describe("UpdateStockCommand: renombrar", () => {
  it("renombra la línea y, si coincide con otra igual, se juntan", async () => {
    const repo = repoCon([
      linea({ nombre: "Yogures proteina", cantidad: cantidad(2, "unidad") }),
      linea({ id: OTRA_LINEA_ID, nombre: "Yogur proteína", cantidad: cantidad(4, "unidad") }),
    ]);

    const r = await new UpdateStockCommand(repo, reloj).execute({
      itemId: LINEA_ID,
      producto: { nombre: "Yogur proteína", productoBaseId: null },
      usuarioId: USUARIO_ID,
    });

    expect(r).toMatchObject({ ok: true, value: { id: OTRA_LINEA_ID, cantidad: { valor: 6 } } });
    expect(await repo.listarLineas()).toHaveLength(1);
  });

  it("un nombre vacío no vale", async () => {
    expect(
      await new UpdateStockCommand(repoCon(), reloj).execute({
        itemId: LINEA_ID,
        producto: { nombre: " ", productoBaseId: null },
        usuarioId: USUARIO_ID,
      }),
    ).toMatchObject({ ok: false, error: { code: "NOMBRE_NO_VALIDO" } });
  });
});

describe("RenombrarEnDespensaCommand", () => {
  it("renombra todas las líneas, con vínculo y categoría, y mueve la ubicación recordada", async () => {
    const repo = repoCon([
      linea({ nombre: "Yogures proteina", ubicacionId: NEVERA_ID }),
      linea({ id: OTRA_LINEA_ID, nombre: "yogures  proteina", ubicacionId: ARMARIO_ID }),
      linea({ id: idN(5), nombre: "Pan" }),
    ]);
    repo.recordadas.set("yogures proteina", NEVERA_ID);

    const r = await new RenombrarEnDespensaCommand(repo, reloj).execute({
      desde: "yogures proteina",
      nombre: "Yogur proteína",
      productoBaseId: BASE_ID,
      categoria: "lacteos_huevos",
      usuarioId: USUARIO_ID,
    });

    expect(r).toEqual({ ok: true, value: 2 });
    const lineas = (await repo.listarLineas()).map((l) => l.toSnapshot());
    expect(lineas.map((l) => [l.nombre, l.productoBaseId, l.categoria])).toEqual([
      ["Yogur proteína", BASE_ID, "lacteos_huevos"],
      ["Yogur proteína", BASE_ID, "lacteos_huevos"],
      ["Pan", null, "lacteos_huevos"],
    ]);
    expect(Object.fromEntries(repo.recordadas)).toEqual({ "yogur proteina": NEVERA_ID });
  });

  it("si el nombre nuevo ya tenía ubicación, se queda la suya", async () => {
    const repo = repoCon([]);
    repo.recordadas.set("yogures proteina", NEVERA_ID);
    repo.recordadas.set("yogur proteina", ARMARIO_ID);

    const r = await new RenombrarEnDespensaCommand(repo, reloj).execute({
      desde: "yogures proteina",
      nombre: "Yogur proteína",
      productoBaseId: null,
      categoria: "lacteos_huevos",
      usuarioId: USUARIO_ID,
    });

    expect(r).toEqual({ ok: true, value: 0 });
    expect(Object.fromEntries(repo.recordadas)).toEqual({ "yogur proteina": ARMARIO_ID });
  });

  it("nombre no válido; nada que cambiar no guarda", async () => {
    const repo = repoCon();
    const renombrar = new RenombrarEnDespensaCommand(repo, reloj);
    const base = { productoBaseId: null, categoria: "otros", usuarioId: USUARIO_ID } as const;

    expect(await renombrar.execute({ ...base, desde: "leche", nombre: "" })).toMatchObject({
      ok: false,
    });
    expect(await renombrar.execute({ ...base, desde: "nada", nombre: "Algo" })).toEqual({
      ok: true,
      value: 0,
    });
    expect(repo.guardados).toBe(0);
  });
});
