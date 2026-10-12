import { describe, expect, it } from "vitest";
import type { Clock } from "@/shared/kernel/clock";
import {
  AHORA,
  DESPUES,
  ITEM_ID,
  LISTA_ID,
  OTRO_ID,
  USUARIO_ID,
  item,
  lista,
} from "../../testing/builders";
import { InMemoryShoppingListRepository } from "../../testing/in-memory-shopping-list-repository";
import { SetItemPurchasedCommand } from "./set-item-purchased.command";

const relojFijo: Clock = { now: () => DESPUES };

describe("SetItemPurchasedCommand", () => {
  it("execute_CompradoTrue_MarcaConFechaYUsuarioYGuarda", async () => {
    const repo = new InMemoryShoppingListRepository([lista([item()])]);
    const command = new SetItemPurchasedCommand(repo, relojFijo);

    const result = await command.execute({
      listId: LISTA_ID,
      itemId: ITEM_ID,
      comprado: true,
      usuarioId: USUARIO_ID,
    });

    expect(result).toMatchObject({
      ok: true,
      value: { compradoAt: DESPUES, compradoPorId: USUARIO_ID, updatedAt: DESPUES },
    });
    expect(repo.saveCount).toBe(1);
  });

  it("execute_CompradoFalse_DesmarcaYLimpiaElUsuario", async () => {
    const yaComprado = item({ compradoAt: AHORA, compradoPorId: USUARIO_ID });
    const repo = new InMemoryShoppingListRepository([lista([yaComprado])]);
    const command = new SetItemPurchasedCommand(repo, relojFijo);

    const result = await command.execute({
      listId: LISTA_ID,
      itemId: ITEM_ID,
      comprado: false,
      usuarioId: USUARIO_ID,
    });

    expect(result).toMatchObject({
      ok: true,
      value: { compradoAt: null, compradoPorId: null, updatedAt: DESPUES },
    });
  });

  it("execute_YaComprado_ConservaLaFechaYElUsuarioOriginales", async () => {
    const yaComprado = item({ compradoAt: AHORA, compradoPorId: USUARIO_ID });
    const repo = new InMemoryShoppingListRepository([lista([yaComprado])]);
    const command = new SetItemPurchasedCommand(repo, relojFijo);

    const result = await command.execute({
      listId: LISTA_ID,
      itemId: ITEM_ID,
      comprado: true,
      usuarioId: OTRO_ID,
    });

    expect(result).toMatchObject({
      ok: true,
      value: { compradoAt: AHORA, compradoPorId: USUARIO_ID },
    });
  });

  it("execute_ConListaInexistente_DevuelveListaNoEncontrada", async () => {
    const repo = new InMemoryShoppingListRepository();
    const command = new SetItemPurchasedCommand(repo, relojFijo);

    const result = await command.execute({
      listId: LISTA_ID,
      itemId: ITEM_ID,
      comprado: true,
      usuarioId: USUARIO_ID,
    });

    expect(result).toMatchObject({ ok: false, error: { code: "LISTA_NO_ENCONTRADA" } });
  });

  it("execute_ConItemInexistente_DevuelveItemNoEncontradoYNoGuarda", async () => {
    const repo = new InMemoryShoppingListRepository([lista()]);
    const command = new SetItemPurchasedCommand(repo, relojFijo);

    const result = await command.execute({
      listId: LISTA_ID,
      itemId: ITEM_ID,
      comprado: true,
      usuarioId: USUARIO_ID,
    });

    expect(result).toMatchObject({ ok: false, error: { code: "ITEM_NO_ENCONTRADO" } });
    expect(repo.saveCount).toBe(0);
  });

  it("execute_EnListaArchivada_DevuelveListaArchivadaYNoGuarda", async () => {
    const repo = new InMemoryShoppingListRepository([lista([item()], { archivada: true })]);
    const command = new SetItemPurchasedCommand(repo, relojFijo);

    const result = await command.execute({
      listId: LISTA_ID,
      itemId: ITEM_ID,
      comprado: true,
      usuarioId: USUARIO_ID,
    });

    expect(result).toMatchObject({ ok: false, error: { code: "LISTA_ARCHIVADA" } });
    expect(repo.saveCount).toBe(0);
  });
});
