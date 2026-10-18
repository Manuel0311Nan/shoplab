import { describe, expect, it } from "vitest";
import type { Clock } from "@/shared/kernel/clock";
import { DESPUES, LISTA_ID, OTRO_ID, item, lista } from "../../testing/builders";
import { InMemoryShoppingListRepository } from "../../testing/in-memory-shopping-list-repository";
import { FinishShoppingCommand } from "./finish-shopping.command";

const relojFijo: Clock = { now: () => DESPUES };

const comprado = () => item({ compradoAt: DESPUES });
const pendiente = () => item({ id: OTRO_ID, nombre: "Leche" });

describe("FinishShoppingCommand", () => {
  it("execute_ConservarPendientes_QuitaSoloLoCompradoYGuarda", async () => {
    const repo = new InMemoryShoppingListRepository([lista([comprado(), pendiente()])]);
    const command = new FinishShoppingCommand(repo, relojFijo);

    const result = await command.execute({ listId: LISTA_ID, modo: "conservarPendientes" });

    expect(result.ok && result.value.items.map((i) => i.id)).toEqual([OTRO_ID]);
    expect(repo.saveCount).toBe(1);
    const guardada = await repo.findById(LISTA_ID);
    expect(guardada?.itemsActivos().map((i) => i.id)).toEqual([OTRO_ID]);
  });

  it("execute_Vaciar_QuitaTodosLosItemsYGuarda", async () => {
    const repo = new InMemoryShoppingListRepository([lista([comprado(), pendiente()])]);
    const command = new FinishShoppingCommand(repo, relojFijo);

    const result = await command.execute({ listId: LISTA_ID, modo: "vaciar" });

    expect(result.ok && result.value.items).toEqual([]);
    const guardada = await repo.findById(LISTA_ID);
    expect(guardada?.itemsActivos()).toEqual([]);
  });

  it("execute_SinNadaQueQuitar_DevuelveLaListaYNoGuarda", async () => {
    const repo = new InMemoryShoppingListRepository([lista([pendiente()])]);
    const command = new FinishShoppingCommand(repo, relojFijo);

    const result = await command.execute({ listId: LISTA_ID, modo: "conservarPendientes" });

    expect(result.ok && result.value.items.map((i) => i.id)).toEqual([OTRO_ID]);
    expect(repo.saveCount).toBe(0);
  });

  it("execute_ConListaInexistente_DevuelveListaNoEncontrada", async () => {
    const repo = new InMemoryShoppingListRepository();
    const command = new FinishShoppingCommand(repo, relojFijo);

    const result = await command.execute({ listId: LISTA_ID, modo: "vaciar" });

    expect(result).toMatchObject({ ok: false, error: { code: "LISTA_NO_ENCONTRADA" } });
  });

  it("execute_EnListaArchivada_DevuelveListaArchivadaYNoGuarda", async () => {
    const repo = new InMemoryShoppingListRepository([lista([item()], { archivada: true })]);
    const command = new FinishShoppingCommand(repo, relojFijo);

    const result = await command.execute({ listId: LISTA_ID, modo: "vaciar" });

    expect(result).toMatchObject({ ok: false, error: { code: "LISTA_ARCHIVADA" } });
    expect(repo.saveCount).toBe(0);
  });
});
