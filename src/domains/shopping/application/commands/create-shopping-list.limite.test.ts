import { describe, expect, it } from "vitest";
import { MAX_LISTAS_ACTIVAS } from "@/domains/shopping/domain/shopping-list";
import type { Clock } from "@/shared/kernel/clock";
import { DESPUES, LISTA_ID, listaCon, listaId, minutos } from "../../testing/builders";
import { InMemoryShoppingListRepository } from "../../testing/in-memory-shopping-list-repository";
import { CreateShoppingListCommand } from "./create-shopping-list.command";
import { DeleteShoppingListCommand } from "./delete-shopping-list.command";
import { UpdateShoppingListCommand } from "./update-shopping-list.command";

const reloj: Clock = { now: () => DESPUES };
const activas = (n: number) =>
  Array.from({ length: n }, (_, i) =>
    listaCon({ id: listaId(i + 1), nombre: `L${i + 1}`, updatedAt: minutos(-i) }),
  );

describe("Límite de 15 listas activas", () => {
  it("crear_Con14Activas_LaCrea", async () => {
    const repo = new InMemoryShoppingListRepository(activas(MAX_LISTAS_ACTIVAS - 1));

    const result = await new CreateShoppingListCommand(repo, reloj).execute({ nombre: "Nueva" });

    expect(result.ok).toBe(true);
    expect(await repo.contarActivas()).toBe(MAX_LISTAS_ACTIVAS);
  });

  it("crear_Con15Activas_DevuelveLimiteConLasActivasSinGuardar", async () => {
    const repo = new InMemoryShoppingListRepository(activas(MAX_LISTAS_ACTIVAS));

    const result = await new CreateShoppingListCommand(repo, reloj).execute({ nombre: "Nueva" });

    expect(result).toMatchObject({
      ok: false,
      error: { type: "conflict", code: "LIMITE_DE_LISTAS", details: { max: 15 } },
    });
    expect(!result.ok && result.error.details?.activas).toHaveLength(15);
    expect(repo.saveCount).toBe(0);
  });

  it("crear_Con15ActivasEligiendoUna_ArchivaEsaYCreaLaNuevaEnUnaTransaccion", async () => {
    const repo = new InMemoryShoppingListRepository(activas(MAX_LISTAS_ACTIVAS));

    const result = await new CreateShoppingListCommand(repo, reloj).execute({
      listId: LISTA_ID,
      nombre: "Nueva",
      archivarListaId: listaId(3),
    });

    expect(result.ok).toBe(true);
    expect(repo.saveCount).toBe(1);
    expect((await repo.listarArchivadas({ limite: 5 })).map((l) => l.id)).toEqual([listaId(3)]);
    expect((await repo.listarActivas()).at(0)?.id).toBe(LISTA_ID);
  });

  it("crear_EligiendoUnaQueNoEsActiva_DevuelveListaParaArchivarNoValida", async () => {
    const repo = new InMemoryShoppingListRepository(activas(MAX_LISTAS_ACTIVAS));

    const result = await new CreateShoppingListCommand(repo, reloj).execute({
      nombre: "Nueva",
      archivarListaId: LISTA_ID,
    });

    expect(result).toMatchObject({ ok: false, error: { code: "LISTA_PARA_ARCHIVAR_NO_VALIDA" } });
  });

  it("desarchivar_Con15Activas_PideElegirYLuegoIntercambia", async () => {
    const archivada = listaCon({ id: LISTA_ID, nombre: "Vieja", archivadaAt: minutos(-60) });
    const repo = new InMemoryShoppingListRepository([...activas(15), archivada]);
    const command = new UpdateShoppingListCommand(repo, reloj);

    const sinElegir = await command.execute({ listId: LISTA_ID, archivada: false });
    const eligiendo = await command.execute({
      listId: LISTA_ID,
      archivada: false,
      archivarListaId: listaId(15),
    });

    expect(sinElegir).toMatchObject({ ok: false, error: { code: "LIMITE_DE_LISTAS" } });
    expect(eligiendo).toMatchObject({ ok: true, value: { archivadaAt: null, updatedAt: DESPUES } });
    expect((await repo.listarArchivadas({ limite: 5 })).map((l) => l.id)).toEqual([listaId(15)]);
    expect(await repo.contarActivas()).toBe(15);
  });
});

describe("UpdateShoppingListCommand", () => {
  const repoConUna = () => new InMemoryShoppingListRepository([listaCon()]);

  it("execute_SinCambios_DevuelveSinCambios", async () => {
    const result = await new UpdateShoppingListCommand(repoConUna(), reloj).execute({
      listId: LISTA_ID,
    });

    expect(result).toMatchObject({ ok: false, error: { code: "SIN_CAMBIOS" } });
  });

  it("execute_ListaInexistente_DevuelveListaNoEncontrada", async () => {
    const result = await new UpdateShoppingListCommand(
      new InMemoryShoppingListRepository(),
      reloj,
    ).execute({ listId: LISTA_ID, nombre: "X" });

    expect(result).toMatchObject({ ok: false, error: { code: "LISTA_NO_ENCONTRADA" } });
  });

  it("execute_RenombrarYArchivar_AplicaAmbos", async () => {
    const repo = repoConUna();

    const result = await new UpdateShoppingListCommand(repo, reloj).execute({
      listId: LISTA_ID,
      nombre: "Fiesta",
      archivada: true,
    });

    expect(result).toMatchObject({ ok: true, value: { nombre: "Fiesta", archivadaAt: DESPUES } });
    expect(await repo.contarActivas()).toBe(0);
  });

  it("execute_NombreNoValido_NoGuardaNada", async () => {
    const repo = repoConUna();

    const result = await new UpdateShoppingListCommand(repo, reloj).execute({
      listId: LISTA_ID,
      nombre: " ",
      archivada: true,
    });

    expect(result).toMatchObject({ ok: false, error: { code: "NOMBRE_NO_VALIDO" } });
    expect(repo.saveCount).toBe(0);
  });

  it("execute_DesarchivarConSitio_LaRecupera", async () => {
    const repo = new InMemoryShoppingListRepository([listaCon({ archivadaAt: minutos(-5) })]);

    const result = await new UpdateShoppingListCommand(repo, reloj).execute({
      listId: LISTA_ID,
      archivada: false,
    });

    expect(result).toMatchObject({ ok: true, value: { archivadaAt: null } });
    expect(await repo.contarActivas()).toBe(1);
  });
});

describe("DeleteShoppingListCommand", () => {
  it("execute_ListaExistente_DejaDeExistir", async () => {
    const repo = new InMemoryShoppingListRepository([listaCon()]);

    const result = await new DeleteShoppingListCommand(repo, reloj).execute({ listId: LISTA_ID });

    expect(result).toEqual({ ok: true, value: undefined });
    expect(await repo.findById(LISTA_ID)).toBeNull();
  });

  it("execute_ListaInexistente_DevuelveListaNoEncontrada", async () => {
    const result = await new DeleteShoppingListCommand(
      new InMemoryShoppingListRepository(),
      reloj,
    ).execute({ listId: LISTA_ID });

    expect(result).toMatchObject({ ok: false, error: { code: "LISTA_NO_ENCONTRADA" } });
  });
});
