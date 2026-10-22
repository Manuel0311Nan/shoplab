import { describe, expect, it } from "vitest";
import { InMemoryPackRecordadoRepository } from "@/domains/shopping/testing/in-memory-pack-recordado-repository";
import { ListPacksRecordadosQuery } from "../queries/list-packs-recordados.query";
import { RecordarPackCommand } from "./recordar-pack.command";

describe("RecordarPackCommand", () => {
  it("apunta el pack y luego que se compró suelto", async () => {
    const packs = new InMemoryPackRecordadoRepository();
    const recordar = new RecordarPackCommand(packs);

    await recordar.execute({ nombre: "Yogur griego", unidad: "unidad", unidadesPorPack: 4 });
    await recordar.execute({ nombre: "Leche", unidad: "l", unidadesPorPack: null });
    expect(await packs.buscar("yogur griego")).toEqual({
      nombreNormalizado: "yogur griego",
      unidadesPorPack: 4,
      enPack: true,
    });

    await recordar.execute({ nombre: "yogur griego", unidad: "unidad", unidadesPorPack: null });
    const lista = await new ListPacksRecordadosQuery(packs).execute();
    expect(lista).toEqual({
      ok: true,
      value: [{ nombreNormalizado: "yogur griego", unidadesPorPack: 4, enPack: false }],
    });
  });
});
