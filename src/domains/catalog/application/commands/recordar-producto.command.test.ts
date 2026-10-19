import { describe, expect, it } from "vitest";
import { AHORA, DESPUES, recordado } from "../../testing/builders";
import { InMemoryProductoRecordadoRepository } from "../../testing/in-memory-producto-recordado-repository";
import { ListHouseholdProductsQuery } from "../queries/list-household-products.query";
import { RecordarProductoCommand } from "./recordar-producto.command";

const crear = (iniciales = [recordado()]) => {
  const repo = new InMemoryProductoRecordadoRepository(iniciales);
  return { repo, command: new RecordarProductoCommand(repo, { now: () => DESPUES }) };
};

describe("RecordarProductoCommand", () => {
  it("execute_UsoDeAlgoNuevo_LoCreaConUnUso", async () => {
    const { repo, command } = crear([]);

    await command.execute({
      nombre: " Pilas AA ",
      categoria: "otros",
      unidad: "unidad",
      motivo: "uso",
    });

    expect(await repo.buscar("pilas aa")).toEqual({
      nombreNormalizado: "pilas aa",
      nombre: "Pilas AA",
      categoria: "otros",
      unidad: "unidad",
      usos: 1,
      ultimoUso: DESPUES,
    });
  });

  it("execute_UsoDeAlgoConocido_SumaUsoSinCambiarLaCategoria", async () => {
    const { repo, command } = crear();

    await command.execute({
      nombre: "TARTA de la abuela",
      categoria: "otros",
      unidad: "unidad",
      motivo: "uso",
    });

    expect(await repo.buscar("tarta de la abuela")).toMatchObject({
      nombre: "TARTA de la abuela",
      categoria: "panaderia",
      usos: 2,
    });
  });

  it("execute_CambioDeCategoria_MandaLaNueva", async () => {
    const { repo, command } = crear();

    await command.execute({
      nombre: "Tarta de la abuela",
      categoria: "congelados",
      unidad: "unidad",
      motivo: "categoria",
    });

    expect(await repo.buscar("tarta de la abuela")).toMatchObject({
      categoria: "congelados",
      usos: 1,
    });
  });

  it.each([
    [{ nombre: "  ", categoria: "otros", unidad: "unidad" }, "NOMBRE_NO_VALIDO"],
    [{ nombre: "x", categoria: "juguetes", unidad: "unidad" }, "CATEGORIA_NO_VALIDA"],
    [{ nombre: "x", categoria: "otros", unidad: "docena" }, "UNIDAD_NO_VALIDA"],
  ] as const)("execute_DatosNoValidos_%#", async (datos, code) => {
    const { command } = crear([]);

    expect(await command.execute({ ...datos, motivo: "uso" })).toMatchObject({
      ok: false,
      error: { code },
    });
  });

  it("listHouseholdProducts_DevuelveLoRecordado", async () => {
    const { repo } = crear([recordado({ ultimoUso: AHORA })]);

    const result = await new ListHouseholdProductsQuery(repo).execute();

    expect(result.ok && result.value.map((p) => p.nombre)).toEqual(["Tarta de la abuela"]);
  });
});
