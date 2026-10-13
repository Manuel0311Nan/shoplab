import { describe, expect, it } from "vitest";
import type { Clock } from "@/shared/kernel/clock";
import { DESPUES, ITEM_ID, LISTA_ID, item, lista } from "../../testing/builders";
import { InMemoryShoppingListRepository } from "../../testing/in-memory-shopping-list-repository";
import { RemoveItemCommand } from "./remove-item.command";

const relojFijo: Clock = { now: () => DESPUES };

describe("RemoveItemCommand", () => {
  it("execute_ItemExistente_LoQuitaConSoftDeleteYGuarda", async () => {
    const shoppingList = lista([item()]);
    const repo = new InMemoryShoppingListRepository([shoppingList]);
    const command = new RemoveItemCommand(repo, relojFijo);

    const result = await command.execute({ listId: LISTA_ID, itemId: ITEM_ID });

    expect(result).toEqual({ ok: true, value: undefined });
    expect(repo.saveCount).toBe(1);
    expect(shoppingList.itemsActivos()).toHaveLength(0);
    expect(shoppingList.itemsModificados()[0]?.deletedAt).toEqual(DESPUES);
  });

  it("execute_DosVeces_LaSegundaDevuelveItemNoEncontrado", async () => {
    const repo = new InMemoryShoppingListRepository([lista([item()])]);
    const command = new RemoveItemCommand(repo, relojFijo);
    await command.execute({ listId: LISTA_ID, itemId: ITEM_ID });

    const result = await command.execute({ listId: LISTA_ID, itemId: ITEM_ID });

    expect(result).toMatchObject({ ok: false, error: { code: "ITEM_NO_ENCONTRADO" } });
    expect(repo.saveCount).toBe(1);
  });

  it("execute_ConListaInexistente_DevuelveListaNoEncontrada", async () => {
    const repo = new InMemoryShoppingListRepository();
    const command = new RemoveItemCommand(repo, relojFijo);

    const result = await command.execute({ listId: LISTA_ID, itemId: ITEM_ID });

    expect(result).toMatchObject({ ok: false, error: { code: "LISTA_NO_ENCONTRADA" } });
  });

  it("execute_ConItemInexistente_DevuelveItemNoEncontradoYNoGuarda", async () => {
    const repo = new InMemoryShoppingListRepository([lista()]);
    const command = new RemoveItemCommand(repo, relojFijo);

    const result = await command.execute({ listId: LISTA_ID, itemId: ITEM_ID });

    expect(result).toMatchObject({ ok: false, error: { code: "ITEM_NO_ENCONTRADO" } });
    expect(repo.saveCount).toBe(0);
  });

  it("execute_EnListaArchivada_DevuelveListaArchivadaYNoGuarda", async () => {
    const repo = new InMemoryShoppingListRepository([lista([item()], { archivada: true })]);
    const command = new RemoveItemCommand(repo, relojFijo);

    const result = await command.execute({ listId: LISTA_ID, itemId: ITEM_ID });

    expect(result).toMatchObject({ ok: false, error: { code: "LISTA_ARCHIVADA" } });
    expect(repo.saveCount).toBe(0);
  });
});
