import { describe, expect, it } from "vitest";
import type { Clock } from "@/shared/kernel/clock";
import { AHORA, LISTA_ID, cantidad, item, lista, listaVacia } from "../../testing/builders";
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

describe("AddItemCommand: productos repetidos", () => {
  const conArroz = () =>
    new InMemoryShoppingListRepository([
      lista([item({ nombre: "Arroz", cantidad: cantidad(500, "g") })]),
    ]);
  const arroz = { listId: LISTA_ID, nombre: "arroz", cantidad: { valor: 1, unidad: "kg" } };

  it("execute_Parecido_DevuelvePosibleDuplicadoSinGuardar", async () => {
    const repo = conArroz();

    const result = await new AddItemCommand(repo, relojFijo).execute(arroz);

    expect(result).toMatchObject({ ok: false, error: { code: "POSIBLE_DUPLICADO" } });
    expect(repo.saveCount).toBe(0);
  });

  it("execute_UnirEnGramos_SumaYGuarda", async () => {
    const repo = conArroz();

    const result = await new AddItemCommand(repo, relojFijo).execute({
      ...arroz,
      duplicado: "unir",
      unidadFinal: "g",
    });

    expect(result).toMatchObject({ ok: true, value: { cantidad: { valor: 1500, unidad: "g" } } });
    expect(repo.saveCount).toBe(1);
  });

  it("execute_UnirConCantidadFinal_UsaEsaCantidad", async () => {
    const result = await new AddItemCommand(conArroz(), relojFijo).execute({
      ...arroz,
      duplicado: "unir",
      cantidadFinal: { valor: 2, unidad: "kg" },
    });

    expect(result).toMatchObject({ ok: true, value: { cantidad: { valor: 2, unidad: "kg" } } });
  });

  it.each([{ unidadFinal: "litros" }, { cantidadFinal: { valor: 0, unidad: "kg" } }])(
    "execute_RespuestaNoValida_DevuelveErrorDeValidacion (%#)",
    async (respuesta) => {
      const result = await new AddItemCommand(conArroz(), relojFijo).execute({
        ...arroz,
        duplicado: "unir",
        ...respuesta,
      });

      expect(result).toMatchObject({ ok: false, error: { type: "validation" } });
    },
  );

  it("execute_ConProductoBase_LoGuarda", async () => {
    const productoBaseId = "0199c000-0000-7000-8000-0000000000b1";

    const result = await new AddItemCommand(
      new InMemoryShoppingListRepository([listaVacia()]),
      relojFijo,
    ).execute({ ...arroz, productoBaseId });

    expect(result).toMatchObject({ ok: true, value: { productoBaseId } });
  });
});
