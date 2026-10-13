import { describe, expect, it } from "vitest";
import type { Clock } from "@/shared/kernel/clock";
import { AHORA, LISTA_ID, listaVacia } from "../../testing/builders";
import { InMemoryShoppingListRepository } from "../../testing/in-memory-shopping-list-repository";
import { AddItemCommand } from "./add-item.command";

const relojFijo: Clock = { now: () => AHORA };

describe("AddItemCommand", () => {
  it("execute_ConDatosValidos_AñadeYGuarda", async () => {
    const repo = new InMemoryShoppingListRepository([listaVacia()]);
    const command = new AddItemCommand(repo, relojFijo);
    const result = await command.execute({
      listId: LISTA_ID,
      nombre: "Leche",
      cantidad: { valor: 2, unidad: "l" },
    });
    expect(result).toMatchObject({ ok: true, value: { nombre: "Leche", createdAt: AHORA } });
    expect(repo.saveCount).toBe(1);
  });

  it("execute_ConListaInexistente_DevuelveListaNoEncontrada", async () => {
    const repo = new InMemoryShoppingListRepository();
    const command = new AddItemCommand(repo, relojFijo);
    const result = await command.execute({
      listId: LISTA_ID,
      nombre: "Leche",
      cantidad: { valor: 2, unidad: "l" },
    });
    expect(result).toMatchObject({ ok: false, error: { code: "LISTA_NO_ENCONTRADA" } });
  });

  it("execute_ConCantidadNoValida_NoGuardaNada", async () => {
    const repo = new InMemoryShoppingListRepository([listaVacia()]);
    const command = new AddItemCommand(repo, relojFijo);
    const result = await command.execute({
      listId: LISTA_ID,
      nombre: "Leche",
      cantidad: { valor: -1, unidad: "l" },
    });
    expect(result.ok).toBe(false);
    expect(repo.saveCount).toBe(0);
  });
});
