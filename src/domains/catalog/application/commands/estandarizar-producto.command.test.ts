import { describe, expect, it } from "vitest";
import type { Clock } from "@/shared/kernel/clock";
import { DESPUES, LECHE, LECHE_ID, PLATANO, recordado } from "../../testing/builders";
import { InMemoryProductoBaseRepository } from "../../testing/in-memory-producto-base-repository";
import { InMemoryEmojiProductoRepository } from "../../testing/in-memory-emoji-producto-repository";
import { InMemoryProductoRecordadoRepository } from "../../testing/in-memory-producto-recordado-repository";
import { MisProductosQuery } from "../queries/mis-productos.query";
import {
  EstandarizarProductoCommand,
  OlvidarProductoCommand,
} from "./estandarizar-producto.command";

const reloj: Clock = { now: () => DESPUES };
const yogures = recordado({
  nombreNormalizado: "yogures proteina",
  nombre: "Yogures proteina",
  categoria: "lacteos_huevos",
  usos: 3,
});
const entrada = { productoBaseId: null, categoria: "lacteos_huevos", unidad: "unidad" } as const;

describe("EstandarizarProductoCommand", () => {
  it("renombrar: el recuerdo pasa al nombre nuevo con sus usos", async () => {
    const repo = new InMemoryProductoRecordadoRepository([yogures]);

    await new EstandarizarProductoCommand(repo, reloj).execute({
      ...entrada,
      desde: "yogures proteina",
      nombre: "  Yogur  proteína ",
    });

    expect(await repo.buscar("yogures proteina")).toBeNull();
    expect(await repo.buscar("yogur proteina")).toMatchObject({
      nombre: "Yogur proteína",
      usos: 3,
      ultimoUso: DESPUES,
    });
  });

  it("unir con otro que ya existe: se suman los usos", async () => {
    const otro = recordado({
      nombreNormalizado: "yogur proteina",
      nombre: "Yogur proteína",
      usos: 2,
    });
    const repo = new InMemoryProductoRecordadoRepository([yogures, otro]);

    await new EstandarizarProductoCommand(repo, reloj).execute({
      ...entrada,
      desde: "yogures proteina",
      nombre: "Yogur proteína",
    });

    expect((await repo.listar(10)).map((p) => [p.nombreNormalizado, p.usos])).toEqual([
      ["yogur proteina", 5],
    ]);
  });

  it("el emoji elegido pasa al nombre nuevo si allí no había otro", async () => {
    const emojis = new InMemoryEmojiProductoRepository({ "yogures proteina": "🥣" });
    const repo = new InMemoryProductoRecordadoRepository([yogures]);
    const estandarizar = new EstandarizarProductoCommand(repo, reloj, emojis);

    await estandarizar.execute({ ...entrada, desde: "yogures proteina", nombre: "Yogur proteína" });
    expect(Object.fromEntries(emojis.store)).toEqual({ "yogur proteina": "🥣" });

    emojis.store.set("otro", "🍓");
    emojis.store.set("yogur", "🥛");
    await estandarizar.execute({ ...entrada, desde: "otro", nombre: "Yogur" });
    expect(Object.fromEntries(emojis.store)).toEqual({ "yogur proteina": "🥣", yogur: "🥛" });
  });

  it("solo cambiar categoría: mismo nombre", async () => {
    const repo = new InMemoryProductoRecordadoRepository([yogures]);

    await new EstandarizarProductoCommand(repo, reloj).execute({
      ...entrada,
      desde: "yogures proteina",
      nombre: "Yogures proteina",
      categoria: "otros",
    });

    expect(await repo.buscar("yogures proteina")).toMatchObject({ categoria: "otros", usos: 3 });
  });

  it("unir con la lista base: el texto libre se olvida", async () => {
    const repo = new InMemoryProductoRecordadoRepository([yogures]);

    await new EstandarizarProductoCommand(repo, reloj).execute({
      ...entrada,
      desde: "yogures proteina",
      nombre: "Leche entera",
      productoBaseId: LECHE_ID,
    });

    expect(await repo.listar(10)).toEqual([]);
  });

  it.each([
    [{ nombre: "  " }, "NOMBRE_NO_VALIDO"],
    [{ nombre: "x".repeat(81) }, "NOMBRE_NO_VALIDO"],
    [{ categoria: "nada" }, "CATEGORIA_NO_VALIDA"],
    [{ unidad: "docena" }, "UNIDAD_NO_VALIDA"],
  ])("rechaza %o", async (cambio, code) => {
    const repo = new InMemoryProductoRecordadoRepository([yogures]);

    const r = await new EstandarizarProductoCommand(repo, reloj).execute({
      ...entrada,
      desde: "yogures proteina",
      nombre: "Yogur",
      ...cambio,
    });

    expect(r).toMatchObject({ ok: false, error: { code } });
    expect(await repo.buscar("yogures proteina")).toEqual(yogures);
  });
});

describe("OlvidarProductoCommand y MisProductosQuery", () => {
  it("lista lo escrito a mano (no los recuerdos de la lista base) con sus parecidos", async () => {
    const repo = new InMemoryProductoRecordadoRepository([
      yogures,
      recordado({ nombreNormalizado: "yogur proteina", nombre: "Yogur proteína" }),
      recordado({ nombreNormalizado: "leche entera", nombre: "Leche entera", categoria: "otros" }),
      recordado({ nombreNormalizado: "leches enteras", nombre: "Leches enteras" }),
    ]);
    const query = new MisProductosQuery(new InMemoryProductoBaseRepository([LECHE, PLATANO]), repo);

    const r = await query.execute();
    if (!r.ok) throw new Error("debería ir bien");
    expect(r.value.productos.map((p) => p.nombre)).toEqual([
      "Leches enteras",
      "Yogur proteína",
      "Yogures proteina",
    ]);
    expect(
      r.value.parecidos.map((g) => [g.productos.map((p) => p.nombre), g.base?.nombre ?? null]),
    ).toEqual([
      [["Leches enteras"], "Leche entera"],
      [["Yogur proteína", "Yogures proteina"], null],
    ]);

    await new OlvidarProductoCommand(repo).execute("leches enteras");
    expect(await repo.buscar("leches enteras")).toBeNull();
  });
});
