import { describe, expect, it } from "vitest";
import type { Clock } from "@/shared/kernel/clock";
import {
  DESPUES,
  ITEM_ID,
  LISTA_ID,
  OTRO_ID,
  USUARIO_ID,
  item,
  listaCon,
  listaId,
} from "../testing/builders";
import { InMemoryPackRecordadoRepository } from "../testing/in-memory-pack-recordado-repository";
import { InMemoryShoppingListRepository } from "../testing/in-memory-shopping-list-repository";
import { EditarPackCommand } from "./commands/editar-pack.command";
import { RenombrarEnListasCommand } from "./commands/renombrar-en-listas.command";
import { UpdateItemCommand } from "./commands/update-item.command";

const reloj: Clock = { now: () => DESPUES };
const BASE_ID = "0199c000-0000-7000-8000-0000000000c9";

describe("UpdateItemCommand: renombrar", () => {
  it("cambia nombre y vínculo solo de ese ítem", async () => {
    const repo = new InMemoryShoppingListRepository([
      listaCon({}, [
        item({ nombre: "Yogures proteina" }),
        item({ id: OTRO_ID, nombre: "Yogures proteina" }),
      ]),
    ]);

    const r = await new UpdateItemCommand(repo, reloj).execute({
      listId: LISTA_ID,
      itemId: ITEM_ID,
      usuarioId: USUARIO_ID,
      producto: { nombre: "  Yogur proteína ", productoBaseId: BASE_ID },
    });

    expect(r).toMatchObject({
      ok: true,
      value: { nombre: "Yogur proteína", productoBaseId: BASE_ID },
    });
    const lista = await repo.findById(LISTA_ID);
    expect(lista?.itemsActivos().map((i) => i.nombre)).toEqual([
      "Yogur proteína",
      "Yogures proteina",
    ]);
  });

  it("un nombre vacío no vale", async () => {
    const repo = new InMemoryShoppingListRepository([listaCon({}, [item()])]);

    const r = await new UpdateItemCommand(repo, reloj).execute({
      listId: LISTA_ID,
      itemId: ITEM_ID,
      usuarioId: USUARIO_ID,
      producto: { nombre: "   ", productoBaseId: null },
    });

    expect(r).toMatchObject({ ok: false, error: { code: "NOMBRE_NO_VALIDO" } });
  });
});

describe("RenombrarEnListasCommand", () => {
  it("renombra en todas las listas activas, con vínculo y categoría; no toca archivadas", async () => {
    const repo = new InMemoryShoppingListRepository([
      listaCon({ id: listaId(1) }, [
        item({ nombre: "Yogures  Proteina" }),
        item({ id: OTRO_ID, nombre: "Pan" }),
      ]),
      listaCon({ id: listaId(2) }, [item({ id: listaId(70), nombre: "yogures proteina" })]),
      listaCon({ id: listaId(3), archivadaAt: DESPUES }, [
        item({ id: listaId(71), nombre: "Yogures proteina" }),
      ]),
    ]);

    const r = await new RenombrarEnListasCommand(repo, reloj).execute({
      desde: "yogures proteina",
      nombre: "Yogur proteína",
      productoBaseId: null,
      categoria: "lacteos_huevos",
    });

    expect(r).toEqual({ ok: true, value: 2 });
    const [una, otra, archivada] = await Promise.all([
      repo.findById(listaId(1)),
      repo.findById(listaId(2)),
      repo.findById(listaId(3)),
    ]);
    expect(una?.itemsActivos().map((i) => [i.nombre, i.categoria])).toEqual([
      ["Yogur proteína", "lacteos_huevos"],
      ["Pan", "otros"],
    ]);
    expect(otra?.itemsActivos()[0]?.nombre).toBe("Yogur proteína");
    expect(archivada?.itemsActivos()[0]?.nombre).toBe("Yogures proteina");
  });

  it("nombre no válido o nada que renombrar", async () => {
    const repo = new InMemoryShoppingListRepository([listaCon({}, [item()])]);
    const renombrar = new RenombrarEnListasCommand(repo, reloj);
    const base = { desde: "pan", productoBaseId: null, categoria: "panaderia" } as const;

    expect(await renombrar.execute({ ...base, nombre: "" })).toMatchObject({ ok: false });
    expect(await renombrar.execute({ ...base, desde: "nada", nombre: "Pan" })).toEqual({
      ok: true,
      value: 0,
    });
  });
});

describe("EditarPackCommand", () => {
  const yogur = { nombreNormalizado: "yogures proteina", unidadesPorPack: 4, enPack: true };

  it("al renombrar, el pack pasa al nombre nuevo si allí no había", async () => {
    const packs = new InMemoryPackRecordadoRepository([yogur]);

    await new EditarPackCommand(packs).execute({
      desde: "yogures proteina",
      hacia: "yogur proteina",
    });

    expect(await packs.listar()).toEqual([{ ...yogur, nombreNormalizado: "yogur proteina" }]);
  });

  it("si el nombre nuevo ya tenía pack, se queda el suyo", async () => {
    const otro = { nombreNormalizado: "yogur proteina", unidadesPorPack: 6, enPack: false };
    const packs = new InMemoryPackRecordadoRepository([yogur, otro]);

    await new EditarPackCommand(packs).execute({
      desde: "yogures proteina",
      hacia: "yogur proteina",
    });

    expect(await packs.listar()).toEqual([otro]);
  });

  it("fijar, quitar y rechazar un tamaño no válido", async () => {
    const packs = new InMemoryPackRecordadoRepository();
    const editar = new EditarPackCommand(packs);

    await editar.execute({ desde: "agua", hacia: "agua", unidadesPorPack: 6 });
    expect(await packs.buscar("agua")).toEqual({
      nombreNormalizado: "agua",
      unidadesPorPack: 6,
      enPack: true,
    });

    expect(
      await editar.execute({ desde: "agua", hacia: "agua", unidadesPorPack: 1 }),
    ).toMatchObject({
      ok: false,
      error: { code: "PACK_NO_VALIDO" },
    });

    await editar.execute({ desde: "agua", hacia: "agua", unidadesPorPack: null });
    expect(await packs.buscar("agua")).toBeNull();
  });
});
