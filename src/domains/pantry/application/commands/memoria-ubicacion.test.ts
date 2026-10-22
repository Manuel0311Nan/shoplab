import { describe, expect, it } from "vitest";
import type { Clock } from "@/shared/kernel/clock";
import {
  AHORA,
  ARMARIO_ID,
  CONGELADOR_ID,
  LINEA_ID,
  NEVERA_ID,
  USUARIO_ID,
  idN,
  linea,
  ubicacion,
  ubicacionesPorDefecto,
} from "../../testing/builders";
import { InMemoryPantryRepository } from "../../testing/in-memory-pantry-repository";
import { ubicacionParaProducto } from "../../domain/ubicacion";
import { ListUbicacionesRecordadasQuery } from "../queries/list-ubicaciones-recordadas.query";
import { AddStockCommand } from "./add-stock.command";
import { StoreShoppingCommand } from "./store-shopping.command";
import { DeleteUbicacionCommand } from "./ubicaciones.commands";
import { UpdateStockCommand } from "./update-stock.command";

const reloj: Clock = { now: () => AHORA };
const repoCon = (lineas = [linea()]) =>
  new InMemoryPantryRepository({ ubicaciones: ubicacionesPorDefecto(), lineas });
const pasta = {
  nombre: "Macarrones",
  categoria: "despensa",
  cantidad: { valor: 500, unidad: "g" },
  usuarioId: USUARIO_ID,
};

describe("Memoria de ubicación del hogar", () => {
  it("alta con ubicación elegida: la próxima sin ubicación va al mismo sitio", async () => {
    const repo = repoCon([]);
    const add = new AddStockCommand(repo, reloj);

    await add.execute({ ...pasta, ubicacionId: CONGELADOR_ID });
    const segunda = await add.execute({ ...pasta, nombre: "MACARRONES", caducaEl: "2026-12-01" });

    expect(repo.recordadas.get("macarrones")).toBe(CONGELADOR_ID);
    expect(segunda.ok && segunda.value?.ubicacionId).toBe(CONGELADOR_ID);
  });

  it("sin elegir no se recuerda nada: manda la categoría", async () => {
    const repo = repoCon([]);

    const r = await new AddStockCommand(repo, reloj).execute(pasta);

    expect(r.ok && r.value?.ubicacionId).toBe(ARMARIO_ID);
    expect(repo.recordadas.size).toBe(0);
  });

  it("guardar la compra recuerda el sitio de cada producto", async () => {
    const repo = repoCon([]);

    await new StoreShoppingCommand(repo, reloj).execute({
      listaId: idN(50),
      usuarioId: USUARIO_ID,
      productos: [
        { id: idN(1), ...pasta, ubicacionId: NEVERA_ID },
        { id: idN(2), ...pasta, nombre: "Arroz", ubicacionId: ARMARIO_ID },
      ],
    });

    expect(Object.fromEntries(repo.recordadas)).toEqual({
      macarrones: NEVERA_ID,
      arroz: ARMARIO_ID,
    });
  });

  it("mover una línea recuerda el sitio nuevo", async () => {
    const repo = repoCon();

    const r = await new UpdateStockCommand(repo, reloj).execute({
      itemId: LINEA_ID,
      ubicacionId: CONGELADOR_ID,
      usuarioId: USUARIO_ID,
    });

    expect(r.ok).toBe(true);
    expect([...repo.recordadas.values()]).toEqual([CONGELADOR_ID]);
  });

  it("borrar la ubicación: lo recordado pasa al destino, o se olvida si estaba vacía", async () => {
    const repo = repoCon([linea({ ubicacionId: CONGELADOR_ID })]);
    repo.recordadas.set("macarrones", CONGELADOR_ID);
    repo.recordadas.set("arroz", ARMARIO_ID);
    repo.recordadas.set("hielo", NEVERA_ID);
    const borrar = new DeleteUbicacionCommand(repo, reloj);

    await borrar.execute({ id: CONGELADOR_ID, destinoId: NEVERA_ID, usuarioId: USUARIO_ID });
    expect(repo.recordadas.get("macarrones")).toBe(NEVERA_ID);

    await borrar.execute({ id: ARMARIO_ID, usuarioId: USUARIO_ID });
    expect(repo.recordadas.has("arroz")).toBe(false);
    expect(repo.recordadas.get("hielo")).toBe(NEVERA_ID);
  });

  it("una ubicación recordada que ya no existe no se usa", () => {
    const ubicaciones = [
      ubicacion({ id: NEVERA_ID, tipo: "frio", orden: 2 }).toSnapshot(),
      ubicacion({ id: ARMARIO_ID, tipo: "ambiente", orden: 1 }).toSnapshot(),
    ];

    expect(ubicacionParaProducto(ubicaciones, NEVERA_ID, "ambiente")?.id).toBe(NEVERA_ID);
    expect(ubicacionParaProducto(ubicaciones, CONGELADOR_ID, "ambiente")?.id).toBe(ARMARIO_ID);
    expect(ubicacionParaProducto(ubicaciones, undefined, "congelado")?.id).toBe(ARMARIO_ID);
  });

  it("la consulta solo devuelve las que apuntan a una ubicación viva", async () => {
    const repo = repoCon([]);
    repo.recordadas.set("macarrones", ARMARIO_ID);
    repo.recordadas.set("fantasma", idN(99));

    expect(await new ListUbicacionesRecordadasQuery(repo).execute()).toEqual({
      ok: true,
      value: [{ nombreNormalizado: "macarrones", ubicacionId: ARMARIO_ID }],
    });
  });
});
