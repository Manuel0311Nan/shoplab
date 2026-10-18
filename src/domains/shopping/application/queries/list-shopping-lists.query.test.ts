import { describe, expect, it } from "vitest";
import { lista } from "../../testing/builders";
import { InMemoryShoppingListRepository } from "../../testing/in-memory-shopping-list-repository";
import { ListShoppingListsQuery } from "./list-shopping-lists.query";

describe("ListShoppingListsQuery", () => {
  it("execute_ConListas_DevuelveLasActivas", async () => {
    const query = new ListShoppingListsQuery(new InMemoryShoppingListRepository([lista()]));

    const result = await query.execute();

    expect(result).toMatchObject({ ok: true, value: [{ nombre: "Semana" }] });
  });

  it("execute_SinListas_DevuelveVacio", async () => {
    const query = new ListShoppingListsQuery(new InMemoryShoppingListRepository());

    expect(await query.execute()).toEqual({ ok: true, value: [] });
  });
});
