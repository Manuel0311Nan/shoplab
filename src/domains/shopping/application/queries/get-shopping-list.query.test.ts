import { describe, expect, it } from "vitest";
import { AHORA, ITEM_ID, LISTA_ID, OTRO_ID, item, lista } from "../../testing/builders";
import { InMemoryShoppingListRepository } from "../../testing/in-memory-shopping-list-repository";
import { GetShoppingListQuery } from "./get-shopping-list.query";

describe("GetShoppingListQuery", () => {
  it("execute_ListaExistente_DevuelveLaListaConSoloLosItemsActivos", async () => {
    const quitado = item({ id: OTRO_ID, nombre: "Huevos", deletedAt: AHORA });
    const repo = new InMemoryShoppingListRepository([lista([item(), quitado])]);
    const query = new GetShoppingListQuery(repo);

    const result = await query.execute({ listId: LISTA_ID });

    expect(result).toMatchObject({ ok: true, value: { id: LISTA_ID, nombre: "Semana" } });
    expect(result.ok && result.value.items.map((i) => i.id)).toEqual([ITEM_ID]);
  });

  it("execute_ListaInexistente_DevuelveListaNoEncontrada", async () => {
    const query = new GetShoppingListQuery(new InMemoryShoppingListRepository());

    const result = await query.execute({ listId: LISTA_ID });

    expect(result).toMatchObject({ ok: false, error: { code: "LISTA_NO_ENCONTRADA" } });
  });
});
