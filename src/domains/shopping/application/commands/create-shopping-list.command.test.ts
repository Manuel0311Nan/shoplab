import { describe, expect, it } from "vitest";
import type { Clock } from "@/shared/kernel/clock";
import { AHORA, LISTA_ID } from "../../testing/builders";
import { InMemoryShoppingListRepository } from "../../testing/in-memory-shopping-list-repository";
import { CreateShoppingListCommand } from "./create-shopping-list.command";

const relojFijo: Clock = { now: () => AHORA };

describe("CreateShoppingListCommand", () => {
  it("execute_ConNombreValido_CreaYGuardaLaLista", async () => {
    const repo = new InMemoryShoppingListRepository();
    const command = new CreateShoppingListCommand(repo, relojFijo);

    const result = await command.execute({ listId: LISTA_ID, nombre: "Lista de la compra" });

    expect(result).toMatchObject({ ok: true, value: { id: LISTA_ID, createdAt: AHORA } });
    expect((await repo.findById(LISTA_ID))?.toSnapshot().nombre).toBe("Lista de la compra");
  });

  it("execute_SinId_GeneraUnUuid", async () => {
    const command = new CreateShoppingListCommand(new InMemoryShoppingListRepository(), relojFijo);

    const result = await command.execute({ nombre: "Semana" });

    expect(result.ok && result.value.id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("execute_ConNombreVacio_NoGuardaNada", async () => {
    const repo = new InMemoryShoppingListRepository();
    const command = new CreateShoppingListCommand(repo, relojFijo);

    const result = await command.execute({ listId: LISTA_ID, nombre: "  " });

    expect(result).toMatchObject({ ok: false, error: { code: "NOMBRE_NO_VALIDO" } });
    expect(repo.saveCount).toBe(0);
  });
});
