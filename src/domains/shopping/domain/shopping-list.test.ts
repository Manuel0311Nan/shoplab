import { describe, expect, it } from "vitest";
import { AHORA, ITEM_ID, USUARIO_ID, cantidad, listaVacia } from "../testing/builders";

describe("ShoppingList", () => {
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

  it("marcarComprado_DosVeces_ConservaLaPrimeraFecha", () => {
    const lista = listaVacia();
    lista.agregarItem({ id: ITEM_ID, nombre: "Pan", cantidad: cantidad(1, "unidad") }, AHORA);
    const despues = new Date(AHORA.getTime() + 60_000);

    lista.marcarComprado(ITEM_ID, USUARIO_ID, AHORA);
    lista.marcarComprado(ITEM_ID, USUARIO_ID, despues);
    expect(lista.itemsActivos()[0]?.toSnapshot().compradoAt).toEqual(AHORA);
  });

  it("quitarItem_ItemExistente_DejaDeEstarActivoPeroSeGuarda", () => {
    const lista = listaVacia();
    lista.agregarItem({ id: ITEM_ID, nombre: "Pan", cantidad: cantidad(1, "unidad") }, AHORA);
    lista.quitarItem(ITEM_ID, AHORA);
    expect(lista.itemsActivos()).toHaveLength(0);
    expect(lista.itemsModificados()[0]?.deletedAt).toEqual(AHORA);
  });
});
