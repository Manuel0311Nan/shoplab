import { describe, expect, it } from "vitest";
import {
  AHORA,
  DESPUES,
  ITEM_ID,
  LISTA_ID,
  OTRO_ID,
  USUARIO_ID,
  cantidad,
  item,
  lista,
  listaVacia,
} from "../testing/builders";
import { MAX_ITEMS_POR_LISTA, MAX_NOMBRE_LISTA, ShoppingList } from "./shopping-list";

describe("ShoppingList", () => {
  it("create_ConNombreValido_CreaUnaListaVaciaConElNombreRecortado", () => {
    const result = ShoppingList.create({ id: LISTA_ID, nombre: "  Semana  " }, AHORA);

    expect(result.ok && result.value.toSnapshot()).toEqual({
      id: LISTA_ID,
      nombre: "Semana",
      archivadaAt: null,
      createdAt: AHORA,
      updatedAt: AHORA,
      deletedAt: null,
    });
    expect(result.ok && result.value.itemsActivos()).toEqual([]);
  });

  it.each(["", "   ", "x".repeat(MAX_NOMBRE_LISTA + 1)])(
    "create_ConNombreNoValido_DevuelveNombreNoValido (%#)",
    (nombre) => {
      const result = ShoppingList.create({ id: LISTA_ID, nombre }, AHORA);

      expect(result).toMatchObject({ ok: false, error: { code: "NOMBRE_NO_VALIDO" } });
    },
  );

  it("agregarItem_ConDatosValidos_AñadeUnItemPendiente", () => {
    const lista = listaVacia();
    const result = lista.agregarItem(
      { id: ITEM_ID, nombre: "  Leche  ", cantidad: cantidad(2, "l") },
      AHORA,
    );
    expect(result.ok).toBe(true);
    expect(lista.itemsActivos()[0]?.toSnapshot()).toMatchObject({
      nombre: "Leche",
      compradoAt: null,
    });
  });
  it("agregarItem_EnListaArchivada_DevuelveListaArchivada", () => {
    const lista = listaVacia({ archivada: true });
    const result = lista.agregarItem(
      { id: ITEM_ID, nombre: "Pan", cantidad: cantidad(1, "unidad") },
      AHORA,
    );
    expect(result).toMatchObject({ ok: false, error: { code: "LISTA_ARCHIVADA" } });
  });
  it("agregarItem_ConIdRepetido_DevuelveItemYaExiste", () => {
    const lista = listaVacia();
    const nuevo = { id: ITEM_ID, nombre: "Pan", cantidad: cantidad(1, "unidad") };

    lista.agregarItem(nuevo, AHORA);

    const result = lista.agregarItem(nuevo, AHORA);
    expect(result).toMatchObject({ ok: false, error: { code: "ITEM_YA_EXISTE" } });
  });

  it("actualizarItem_CompradoDosVeces_ConservaLaPrimeraFecha", () => {
    const lista = listaVacia();
    lista.agregarItem({ id: ITEM_ID, nombre: "Pan", cantidad: cantidad(1, "unidad") }, AHORA);
    const despues = new Date(AHORA.getTime() + 60_000);

    lista.actualizarItem(ITEM_ID, { comprado: true }, USUARIO_ID, AHORA);
    lista.actualizarItem(ITEM_ID, { comprado: true }, USUARIO_ID, despues);
    expect(lista.itemsActivos()[0]?.toSnapshot().compradoAt).toEqual(AHORA);
  });

  it("quitarItem_ItemExistente_DejaDeEstarActivoPeroSeGuarda", () => {
    const lista = listaVacia();
    lista.agregarItem({ id: ITEM_ID, nombre: "Pan", cantidad: cantidad(1, "unidad") }, AHORA);
    lista.quitarItem(ITEM_ID, AHORA);
    expect(lista.itemsActivos()).toHaveLength(0);
    expect(lista.itemsModificados()[0]?.deletedAt).toEqual(AHORA);
  });

  it("actualizarItem_ConCantidadYComprado_AplicaAmbosCambios", () => {
    const lista = listaVacia();
    lista.agregarItem({ id: ITEM_ID, nombre: "Pan", cantidad: cantidad(1, "unidad") }, AHORA);

    const result = lista.actualizarItem(
      ITEM_ID,
      { cantidad: cantidad(3, "unidad"), comprado: true },
      USUARIO_ID,
      AHORA,
    );

    expect(result.ok).toBe(true);
    expect(lista.itemsActivos()[0]?.toSnapshot()).toMatchObject({
      cantidad: { valor: 3, unidad: "unidad" },
      compradoAt: AHORA,
      compradoPorId: USUARIO_ID,
    });
  });

  it("actualizarItem_EnListaArchivada_NoAplicaNingunCambio", () => {
    const lista = listaVacia({ archivada: true });

    const result = lista.actualizarItem(
      ITEM_ID,
      { cantidad: cantidad(3, "unidad"), comprado: true },
      USUARIO_ID,
      AHORA,
    );

    expect(result).toMatchObject({ ok: false, error: { code: "LISTA_ARCHIVADA" } });
    expect(lista.itemsModificados()).toHaveLength(0);
  });

  it("agregarItem_ListaLlena_DevuelveListaLlena", () => {
    const llena = lista(
      Array.from({ length: MAX_ITEMS_POR_LISTA }, (_, i) =>
        item({ id: `0199c000-0000-7000-8000-${String(1000 + i).padStart(12, "0")}` }),
      ),
    );

    const result = llena.agregarItem(
      { id: ITEM_ID, nombre: "Uno más", cantidad: cantidad(1, "unidad") },
      AHORA,
    );

    expect(result).toMatchObject({ ok: false, error: { code: "LISTA_LLENA" } });
  });

  it("actualizarItem_ItemQuitado_DevuelveItemNoEncontrado", () => {
    const conItem = lista([item()]);
    conItem.quitarItem(ITEM_ID, AHORA);

    const result = conItem.actualizarItem(ITEM_ID, { comprado: true }, USUARIO_ID, AHORA);

    expect(result).toMatchObject({ ok: false, error: { code: "ITEM_NO_ENCONTRADO" } });
  });

  it("terminarCompra_ConservarPendientes_QuitaSoloLosComprados", () => {
    const conItems = lista([item({ compradoAt: AHORA }), item({ id: OTRO_ID, nombre: "Leche" })]);

    const result = conItems.terminarCompra("conservarPendientes", DESPUES);

    expect(result.ok).toBe(true);
    expect(conItems.itemsActivos().map((i) => i.id)).toEqual([OTRO_ID]);
    expect(conItems.itemsModificados()).toMatchObject([{ id: ITEM_ID, deletedAt: DESPUES }]);
    expect(conItems.toSnapshot().updatedAt).toEqual(DESPUES);
  });

  it("terminarCompra_Vaciar_QuitaTodosLosItems", () => {
    const conItems = lista([item({ compradoAt: AHORA }), item({ id: OTRO_ID, nombre: "Leche" })]);

    conItems.terminarCompra("vaciar", DESPUES);

    expect(conItems.itemsActivos()).toEqual([]);
    expect(conItems.itemsModificados()).toHaveLength(2);
  });

  it("terminarCompra_EnListaArchivada_DevuelveListaArchivadaSinQuitarNada", () => {
    const archivada = lista([item({ compradoAt: AHORA })], { archivada: true });

    const result = archivada.terminarCompra("vaciar", DESPUES);

    expect(result).toMatchObject({ ok: false, error: { code: "LISTA_ARCHIVADA" } });
    expect(archivada.itemsActivos()).toHaveLength(1);
  });
});
