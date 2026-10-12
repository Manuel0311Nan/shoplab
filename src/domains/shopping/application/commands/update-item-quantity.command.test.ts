import { describe, expect, it } from "vitest";
import type { Clock } from "@/shared/kernel/clock";
import { DESPUES, ITEM_ID, LISTA_ID, item, lista } from "../../testing/builders";
import { InMemoryShoppingListRepository } from "../../testing/in-memory-shopping-list-repository";
import { UpdateItemQuantityCommand } from "./update-item-quantity.command";

const relojFijo: Clock = { now: () => DESPUES };

describe("UpdateItemQuantityCommand", () => {
  it("execute_ConCantidadValida_CambiaYGuarda", async () => {
    const repo = new InMemoryShoppingListRepository([lista([item()])]);
    const command = new UpdateItemQuantityCommand(repo, relojFijo);

    const result = await command.execute({
      listId: LISTA_ID,
      itemId: ITEM_ID,
      cantidad: { valor: 500, unidad: "g" },
    });

    expect(result).toMatchObject({
      ok: true,
      value: { cantidad: { valor: 500, unidad: "g" }, updatedAt: DESPUES },
    });
    expect(repo.saveCount).toBe(1);
  });

  it("execute_ConMasDeTresDecimales_GuardaElValorRedondeado", async () => {
    const repo = new InMemoryShoppingListRepository([lista([item()])]);
    const command = new UpdateItemQuantityCommand(repo, relojFijo);

    const result = await command.execute({
      listId: LISTA_ID,
      itemId: ITEM_ID,
      cantidad: { valor: 0.1 + 0.2, unidad: "kg" },
    });

    expect(result).toMatchObject({ ok: true, value: { cantidad: { valor: 0.3 } } });
  });

  it("execute_ConCantidadNoValida_NoGuardaNada", async () => {
    const repo = new InMemoryShoppingListRepository([lista([item()])]);
    const command = new UpdateItemQuantityCommand(repo, relojFijo);

    const result = await command.execute({
      listId: LISTA_ID,
      itemId: ITEM_ID,
      cantidad: { valor: -1, unidad: "g" },
    });

    expect(result).toMatchObject({ ok: false, error: { code: "CANTIDAD_NO_VALIDA" } });
    expect(repo.saveCount).toBe(0);
  });

  it("execute_ConUnidadDesconocida_NoGuardaNada", async () => {
    const repo = new InMemoryShoppingListRepository([lista([item()])]);
    const command = new UpdateItemQuantityCommand(repo, relojFijo);

    const result = await command.execute({
      listId: LISTA_ID,
      itemId: ITEM_ID,
      cantidad: { valor: 2, unidad: "docena" },
    });

    expect(result).toMatchObject({ ok: false, error: { code: "UNIDAD_NO_VALIDA" } });
    expect(repo.saveCount).toBe(0);
  });

  it("execute_ConListaInexistente_DevuelveListaNoEncontrada", async () => {
    const repo = new InMemoryShoppingListRepository();
    const command = new UpdateItemQuantityCommand(repo, relojFijo);

    const result = await command.execute({
      listId: LISTA_ID,
      itemId: ITEM_ID,
      cantidad: { valor: 2, unidad: "unidad" },
    });

    expect(result).toMatchObject({ ok: false, error: { code: "LISTA_NO_ENCONTRADA" } });
  });

  it("execute_ConItemQuitado_DevuelveItemNoEncontradoYNoGuarda", async () => {
    const quitado = item({ deletedAt: DESPUES });
    const repo = new InMemoryShoppingListRepository([lista([quitado])]);
    const command = new UpdateItemQuantityCommand(repo, relojFijo);

    const result = await command.execute({
      listId: LISTA_ID,
      itemId: ITEM_ID,
      cantidad: { valor: 2, unidad: "unidad" },
    });

    expect(result).toMatchObject({ ok: false, error: { code: "ITEM_NO_ENCONTRADO" } });
    expect(repo.saveCount).toBe(0);
  });

  it("execute_EnListaArchivada_DevuelveListaArchivadaYNoGuarda", async () => {
    const repo = new InMemoryShoppingListRepository([lista([item()], { archivada: true })]);
    const command = new UpdateItemQuantityCommand(repo, relojFijo);

    const result = await command.execute({
      listId: LISTA_ID,
      itemId: ITEM_ID,
      cantidad: { valor: 2, unidad: "unidad" },
    });

    expect(result).toMatchObject({ ok: false, error: { code: "LISTA_ARCHIVADA" } });
    expect(repo.saveCount).toBe(0);
  });
});
