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
import { UpdateItemCommand, type UpdateItemInput } from "./update-item.command";

const relojFijo: Clock = { now: () => DESPUES };
const ids = { listId: LISTA_ID, itemId: ITEM_ID, usuarioId: USUARIO_ID };

function preparar(...listas: Parameters<typeof lista>[]) {
  const repo = new InMemoryShoppingListRepository(listas.map((args) => lista(...args)));
  const command = new UpdateItemCommand(repo, relojFijo);
  const execute = (cambios: Partial<UpdateItemInput>) => command.execute({ ...ids, ...cambios });
  return { repo, execute };
}

describe("UpdateItemCommand", () => {
  it("execute_SoloCantidad_CambiaLaCantidadYGuarda", async () => {
    const { repo, execute } = preparar([[item()]]);

    const result = await execute({ cantidad: { valor: 500, unidad: "g" } });

    expect(result).toMatchObject({
      ok: true,
      value: { cantidad: { valor: 500, unidad: "g" }, compradoAt: null, updatedAt: DESPUES },
    });
    expect(repo.saveCount).toBe(1);
  });

  it("execute_SoloComprado_MarcaConFechaYUsuario", async () => {
    const { execute } = preparar([[item()]]);

    const result = await execute({ comprado: true });

    expect(result).toMatchObject({
      ok: true,
      value: { compradoAt: DESPUES, compradoPorId: USUARIO_ID },
    });
  });

  it("execute_CompradoFalse_DesmarcaYLimpiaElUsuario", async () => {
    const { execute } = preparar([[item({ compradoAt: AHORA, compradoPorId: USUARIO_ID })]]);

    const result = await execute({ comprado: false });

    expect(result).toMatchObject({ ok: true, value: { compradoAt: null, compradoPorId: null } });
  });

  it("execute_YaCompradoPorOtro_ConservaLaFechaYElUsuarioOriginales", async () => {
    const { execute } = preparar([[item({ compradoAt: AHORA, compradoPorId: USUARIO_ID })]]);

    const result = await execute({ comprado: true, usuarioId: OTRO_ID });

    expect(result).toMatchObject({
      ok: true,
      value: { compradoAt: AHORA, compradoPorId: USUARIO_ID },
    });
  });

  it("execute_CantidadYComprado_AplicaAmbosConUnSoloGuardado", async () => {
    const { repo, execute } = preparar([[item()]]);

    const result = await execute({ cantidad: { valor: 2, unidad: "kg" }, comprado: true });

    expect(result).toMatchObject({
      ok: true,
      value: { cantidad: { valor: 2, unidad: "kg" }, compradoAt: DESPUES },
    });
    expect(repo.saveCount).toBe(1);
  });

  it("execute_ConMasDeTresDecimales_GuardaElValorRedondeado", async () => {
    const { execute } = preparar([[item()]]);

    const result = await execute({ cantidad: { valor: 1.23456, unidad: "kg" } });

    expect(result).toMatchObject({ ok: true, value: { cantidad: { valor: 1.235 } } });
  });

  it("execute_SinCambios_DevuelveSinCambiosYNoGuarda", async () => {
    const { repo, execute } = preparar([[item()]]);

    const result = await execute({});

    expect(result).toMatchObject({ ok: false, error: { code: "SIN_CAMBIOS" } });
    expect(repo.saveCount).toBe(0);
  });

  it("execute_CantidadNoValidaConComprado_NoAplicaNingunCambio", async () => {
    const { repo, execute } = preparar([[item()]]);

    const result = await execute({ cantidad: { valor: 0, unidad: "g" }, comprado: true });

    expect(result).toMatchObject({ ok: false, error: { code: "CANTIDAD_NO_VALIDA" } });
    expect(repo.saveCount).toBe(0);
    const guardada = await repo.findById(LISTA_ID);
    expect(guardada?.itemsActivos()[0]?.estaComprado).toBe(false);
  });

  it("execute_ConUnidadDesconocida_DevuelveUnidadNoValida", async () => {
    const { execute } = preparar([[item()]]);

    const result = await execute({ cantidad: { valor: 1, unidad: "docena" } });

    expect(result).toMatchObject({ ok: false, error: { code: "UNIDAD_NO_VALIDA" } });
  });

  it("execute_ConListaInexistente_DevuelveListaNoEncontrada", async () => {
    const { execute } = preparar();

    const result = await execute({ comprado: true });

    expect(result).toMatchObject({ ok: false, error: { code: "LISTA_NO_ENCONTRADA" } });
  });

  it("execute_ConItemInexistente_DevuelveItemNoEncontradoYNoGuarda", async () => {
    const { repo, execute } = preparar([[]]);

    const result = await execute({ comprado: true });

    expect(result).toMatchObject({ ok: false, error: { code: "ITEM_NO_ENCONTRADO" } });
    expect(repo.saveCount).toBe(0);
  });

  it("execute_EnListaArchivada_DevuelveListaArchivadaYNoGuarda", async () => {
    const { repo, execute } = preparar([[item()], { archivada: true }]);

    const result = await execute({ comprado: true });

    expect(result).toMatchObject({ ok: false, error: { code: "LISTA_ARCHIVADA" } });
    expect(repo.saveCount).toBe(0);
  });
});

describe("UpdateItemCommand: categoría", () => {
  it("execute_CategoriaValida_LaGuarda", async () => {
    const repo = new InMemoryShoppingListRepository([lista([item()])]);

    const result = await new UpdateItemCommand(repo, { now: () => AHORA }).execute({
      listId: LISTA_ID,
      itemId: ITEM_ID,
      usuarioId: USUARIO_ID,
      categoria: "frutas",
    });

    expect(result).toMatchObject({ ok: true, value: { categoria: "frutas" } });
  });

  it("execute_CategoriaDesconocida_DevuelveCategoriaNoValida", async () => {
    const repo = new InMemoryShoppingListRepository([lista([item()])]);

    const result = await new UpdateItemCommand(repo, { now: () => AHORA }).execute({
      listId: LISTA_ID,
      itemId: ITEM_ID,
      usuarioId: USUARIO_ID,
      categoria: "juguetes",
    });

    expect(result).toMatchObject({ ok: false, error: { code: "CATEGORIA_NO_VALIDA" } });
    expect(repo.saveCount).toBe(0);
  });
});
