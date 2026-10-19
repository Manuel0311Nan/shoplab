import { describe, expect, it } from "vitest";
import type { Clock } from "@/shared/kernel/clock";
import {
  AHORA,
  ARMARIO_ID,
  CONGELADOR_ID,
  LINEA_ID,
  NEVERA_ID,
  OTRA_LINEA_ID,
  USUARIO_ID,
  cantidad,
  dia,
  idN,
  linea,
  ubicacion,
  ubicacionesPorDefecto,
} from "../../testing/builders";
import { InMemoryPantryRepository } from "../../testing/in-memory-pantry-repository";
import { MAX_UBICACIONES } from "../../domain/ubicacion";
import { GetPantryQuery } from "../queries/get-pantry.query";
import {
  CreateUbicacionCommand,
  CrearUbicacionesPorDefectoCommand,
  DeleteUbicacionCommand,
  UpdateUbicacionCommand,
} from "./ubicaciones.commands";

const reloj: Clock = { now: () => AHORA };
const repoCon = (lineas = [linea()]) =>
  new InMemoryPantryRepository({ ubicaciones: ubicacionesPorDefecto(), lineas });
const nombres = async (repo: InMemoryPantryRepository) =>
  (await repo.listarUbicaciones()).map((u) => u.nombre);

describe("Ubicaciones", () => {
  it("crear_AlFinal", async () => {
    const repo = repoCon();

    const r = await new CreateUbicacionCommand(repo, reloj).execute({
      nombre: "Bodega",
      tipo: "ambiente",
    });

    expect(r).toMatchObject({ ok: true, value: { orden: 4 } });
    expect(await nombres(repo)).toEqual(["Nevera", "Congelador", "Armario", "Bodega"]);
  });

  it("crear_MismoIdDosVeces_NoDuplica", async () => {
    const repo = repoCon();
    const crear = new CreateUbicacionCommand(repo, reloj);

    await crear.execute({ id: idN(70), nombre: "Bodega", tipo: "ambiente" });
    await crear.execute({ id: idN(70), nombre: "Bodega", tipo: "ambiente" });

    expect(await nombres(repo)).toHaveLength(4);
  });

  it.each([
    [{ nombre: " nevera ", tipo: "frio" }, "UBICACION_REPETIDA"],
    [{ nombre: "Bodega", tipo: "caliente" }, "TIPO_NO_VALIDO"],
    [{ nombre: "", tipo: "frio" }, "NOMBRE_NO_VALIDO"],
  ] as const)("crear_NoValida_%#", async (input, code) => {
    expect(await new CreateUbicacionCommand(repoCon(), reloj).execute(input)).toMatchObject({
      ok: false,
      error: { code },
    });
  });

  it("crear_LaTrece_DemasiadasUbicaciones", async () => {
    const doce = Array.from({ length: MAX_UBICACIONES }, (_, i) =>
      ubicacion({ id: idN(i + 1), nombre: `U${i}`, orden: i + 1 }),
    );
    const repo = new InMemoryPantryRepository({ ubicaciones: doce });

    expect(
      await new CreateUbicacionCommand(repo, reloj).execute({ nombre: "Otra", tipo: "frio" }),
    ).toMatchObject({
      ok: false,
      error: { code: "DEMASIADAS_UBICACIONES" },
    });
  });

  it("actualizar_MoverAlPrincipio_RenumeraTodas", async () => {
    const repo = repoCon();

    const r = await new UpdateUbicacionCommand(repo, reloj).execute({
      id: ARMARIO_ID,
      posicion: 1,
    });

    expect(r.ok).toBe(true);
    expect(await nombres(repo)).toEqual(["Armario", "Nevera", "Congelador"]);
    expect((await repo.listarUbicaciones()).map((u) => u.orden)).toEqual([1, 2, 3]);
  });

  it("actualizar_RenombrarYCambiarTipo", async () => {
    const repo = repoCon();

    const r = await new UpdateUbicacionCommand(repo, reloj).execute({
      id: NEVERA_ID,
      nombre: "Frigo",
      tipo: "ambiente",
    });

    expect(r).toMatchObject({ ok: true, value: { nombre: "Frigo", tipo: "ambiente" } });
  });

  it.each([
    [{ id: NEVERA_ID }, "SIN_CAMBIOS"],
    [{ id: idN(99), nombre: "X" }, "UBICACION_NO_ENCONTRADA"],
    [{ id: NEVERA_ID, nombre: "congelador" }, "UBICACION_REPETIDA"],
    [{ id: NEVERA_ID, tipo: "caliente" }, "TIPO_NO_VALIDO"],
    [{ id: NEVERA_ID, nombre: " " }, "NOMBRE_NO_VALIDO"],
  ] as const)("actualizar_NoValida_%#", async (input, code) => {
    expect(await new UpdateUbicacionCommand(repoCon(), reloj).execute(input)).toMatchObject({
      ok: false,
      error: { code },
    });
  });

  it("borrar_ConProductosSinDestino_PidePorDestino", async () => {
    const r = await new DeleteUbicacionCommand(repoCon(), reloj).execute({
      id: NEVERA_ID,
      usuarioId: USUARIO_ID,
    });
    expect(r).toMatchObject({
      ok: false,
      error: { code: "UBICACION_CON_PRODUCTOS", details: { productos: 1 } },
    });
  });

  it("borrar_ConDestino_MueveJuntaYRenumera", async () => {
    const repo = repoCon([
      linea({ cantidad: cantidad(1, "l") }),
      linea({ id: OTRA_LINEA_ID, ubicacionId: ARMARIO_ID, cantidad: cantidad(1, "l") }),
    ]);

    const r = await new DeleteUbicacionCommand(repo, reloj).execute({
      id: NEVERA_ID,
      destinoId: ARMARIO_ID,
      usuarioId: USUARIO_ID,
    });

    expect(r.ok).toBe(true);
    expect(await nombres(repo)).toEqual(["Congelador", "Armario"]);
    expect((await repo.listarUbicaciones()).map((u) => u.orden)).toEqual([1, 2]);
    const lineas = await repo.listarLineas();
    expect(lineas.map((l) => [l.id, l.cantidad.valor])).toEqual([[OTRA_LINEA_ID, 2]]);
    expect(repo.linea(LINEA_ID)?.deletedAt).not.toBeNull();
  });

  it.each([
    [{ destinoId: NEVERA_ID }, "DESTINO_NO_VALIDO"],
    [{ destinoId: idN(99) }, "DESTINO_NO_VALIDO"],
  ])("borrar_DestinoNoValido_%#", async (input) => {
    expect(
      await new DeleteUbicacionCommand(repoCon(), reloj).execute({
        id: NEVERA_ID,
        usuarioId: USUARIO_ID,
        ...input,
      }),
    ).toMatchObject({ ok: false, error: { code: "DESTINO_NO_VALIDO" } });
  });

  it("borrar_VaciaOLaUltima", async () => {
    const repo = repoCon([]);
    const borrar = new DeleteUbicacionCommand(repo, reloj);

    expect((await borrar.execute({ id: CONGELADOR_ID, usuarioId: USUARIO_ID })).ok).toBe(true);
    expect((await borrar.execute({ id: ARMARIO_ID, usuarioId: USUARIO_ID })).ok).toBe(true);
    expect(await borrar.execute({ id: NEVERA_ID, usuarioId: USUARIO_ID })).toMatchObject({
      ok: false,
      error: { code: "ULTIMA_UBICACION" },
    });
    expect(await borrar.execute({ id: idN(99), usuarioId: USUARIO_ID })).toMatchObject({
      ok: false,
      error: { code: "UBICACION_NO_ENCONTRADA" },
    });
  });

  it("porDefecto_SoloSiNoHayNinguna", async () => {
    const vacio = new InMemoryPantryRepository();
    const crear = new CrearUbicacionesPorDefectoCommand(vacio, reloj);

    await crear.execute();
    await crear.execute();

    expect(await nombres(vacio)).toEqual(["Nevera", "Congelador", "Armario"]);
  });
});

describe("GetPantryQuery", () => {
  it("execute_CalculaCaducidadEnMadrid", async () => {
    const repo = repoCon([linea({ caducaEl: dia("2026-10-21") }), linea({ id: OTRA_LINEA_ID })]);
    // 22:30 UTC del 20 = 00:30 del 21 en Madrid.
    const noche: Clock = { now: () => new Date("2026-10-20T22:30:00.000Z") };

    const r = await new GetPantryQuery(repo, noche).execute();

    expect(r.ok && r.value.hoy).toBe("2026-10-21");
    expect(r.ok && r.value.lineas.map((l) => l.caducidad)).toEqual([
      { estado: "pronto", dias: 0 },
      { estado: "sin_fecha", dias: null },
    ]);
    expect(r.ok && r.value.ubicaciones).toHaveLength(3);
  });
});
