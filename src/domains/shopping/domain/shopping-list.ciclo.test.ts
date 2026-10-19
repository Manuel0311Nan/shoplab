import { describe, expect, it } from "vitest";
import {
  AHORA,
  DESPUES,
  ITEM_ID,
  OTRO_ID,
  USUARIO_ID,
  cantidad,
  item,
  lista,
  listaCon,
} from "../testing/builders";
import { limiteDeCaducidad } from "./shopping-list";

const DIA = 24 * 60 * 60_000;
const PRODUCTO_BASE = "0199c000-0000-7000-8000-0000000000b1";

describe("ShoppingList: ciclo de vida", () => {
  it("renombrar_NombreValido_LoRecortaYActualizaLaFecha", () => {
    const l = lista();

    expect(l.renombrar("  Fiesta  ", DESPUES)).toEqual({ ok: true, value: undefined });
    expect(l.toSnapshot()).toMatchObject({ nombre: "Fiesta", updatedAt: DESPUES });
  });

  it("renombrar_NombreVacio_DevuelveNombreNoValidoSinCambiar", () => {
    const l = lista();

    expect(l.renombrar("   ", DESPUES)).toMatchObject({
      ok: false,
      error: { code: "NOMBRE_NO_VALIDO" },
    });
    expect(l.nombre).toBe("Semana");
  });

  it("renombrar_ListaArchivada_TambienSePuede", () => {
    const l = lista([], { archivada: true });

    expect(l.renombrar("Vieja", DESPUES).ok).toBe(true);
  });

  it("archivar_ListaActiva_EmpiezaLaCuentaDe15Dias", () => {
    const l = lista();

    l.archivar(AHORA);

    expect(l.estaArchivada).toBe(true);
    expect(l.caducaEl()).toEqual(new Date(AHORA.getTime() + 15 * DIA));
  });

  it("archivar_YaArchivada_NoReiniciaLaCuenta", () => {
    const l = lista([], { archivada: true });

    l.archivar(DESPUES);

    expect(l.toSnapshot().archivadaAt).toEqual(AHORA);
  });

  it("desarchivarYArchivar_ReiniciaLaCuenta", () => {
    const l = lista([], { archivada: true });

    l.desarchivar(DESPUES);
    expect(l.caducaEl()).toBeNull();
    l.archivar(DESPUES);

    expect(l.toSnapshot().archivadaAt).toEqual(DESPUES);
  });

  it("estaCaducada_JustoA15Dias_True", () => {
    const l = lista([], { archivada: true });

    expect(l.estaCaducada(new Date(AHORA.getTime() + 15 * DIA - 1))).toBe(false);
    expect(l.estaCaducada(new Date(AHORA.getTime() + 15 * DIA))).toBe(true);
    expect(lista().estaCaducada(new Date(AHORA.getTime() + 99 * DIA))).toBe(false);
  });

  it("limiteDeCaducidad_Devuelve15DiasAntes", () => {
    expect(limiteDeCaducidad(new Date(AHORA.getTime() + 15 * DIA))).toEqual(AHORA);
  });

  it("eliminar_MarcaDeletedAt", () => {
    const l = lista();

    l.eliminar(DESPUES);

    expect(l.toSnapshot()).toMatchObject({ deletedAt: DESPUES, updatedAt: DESPUES });
  });
});

describe("ShoppingList: productos repetidos", () => {
  const nuevo = (nombre: string, valor = 1, unidad = "unidad", productoBaseId?: string) => ({
    id: OTRO_ID,
    nombre,
    cantidad: cantidad(valor, unidad),
    ...(productoBaseId ? { productoBaseId } : {}),
  });

  it("agregarItem_MismoNombreConOtrasTildesYMayusculas_PreguntaSinDecidir", () => {
    const l = lista([item({ nombre: "Plátano", cantidad: cantidad(3, "unidad") })]);

    const result = l.agregarItem(nuevo("  PLATANO "), DESPUES);

    expect(result).toMatchObject({
      ok: false,
      error: {
        code: "POSIBLE_DUPLICADO",
        type: "conflict",
        details: {
          existente: {
            itemId: ITEM_ID,
            nombre: "Plátano",
            cantidad: { valor: 3, unidad: "unidad" },
            comprado: false,
          },
        },
      },
    });
    expect(l.itemsActivos()).toHaveLength(1);
    expect(l.itemsModificados()).toEqual([]);
  });

  it("agregarItem_MismoProductoBaseConOtroNombre_TambienPregunta", () => {
    const l = lista([item({ nombre: "Leche entera", productoBaseId: PRODUCTO_BASE })]);

    const result = l.agregarItem(nuevo("Leche", 1, "unidad", PRODUCTO_BASE), DESPUES);

    expect(result).toMatchObject({ ok: false, error: { code: "POSIBLE_DUPLICADO" } });
  });

  it("agregarItem_Separar_AñadeOtraLinea", () => {
    const l = lista([item()]);

    const result = l.agregarItem(nuevo("Pan"), DESPUES, { duplicado: "separar" });

    expect(result.ok).toBe(true);
    expect(l.itemsActivos().map((i) => i.id)).toEqual([ITEM_ID, OTRO_ID]);
  });

  it("agregarItem_UnirMismaUnidad_SumaEnLaLineaExistente", () => {
    const l = lista([item({ cantidad: cantidad(2, "unidad") })]);

    const result = l.agregarItem(nuevo("pan", 3), DESPUES, { duplicado: "unir" });

    expect(result.ok && result.value.id).toBe(ITEM_ID);
    expect(l.itemsActivos()).toHaveLength(1);
    expect(l.itemsActivos()[0]?.toSnapshot().cantidad).toEqual({ valor: 5, unidad: "unidad" });
    expect(l.toSnapshot().updatedAt).toEqual(DESPUES);
  });

  it("agregarItem_UnirGramosConKilosSinUnidad_PreguntaLaUnidad", () => {
    const l = lista([item({ nombre: "Arroz", cantidad: cantidad(500, "g") })]);

    const result = l.agregarItem(nuevo("Arroz", 1, "kg"), DESPUES, { duplicado: "unir" });

    expect(result).toMatchObject({ ok: false, error: { code: "UNIDADES_DISTINTAS" } });
  });

  it("agregarItem_UnirGramosConKilosEnKg_ConvierteYSuma", () => {
    const l = lista([item({ nombre: "Arroz", cantidad: cantidad(500, "g") })]);

    l.agregarItem(nuevo("Arroz", 1, "kg"), DESPUES, { duplicado: "unir", unidadFinal: "kg" });

    expect(l.itemsActivos()[0]?.toSnapshot().cantidad).toEqual({ valor: 1.5, unidad: "kg" });
  });

  it("agregarItem_UnirFamiliasDistintasSoloConUnidad_PideLaCantidadFinal", () => {
    const l = lista([item({ nombre: "Leche", cantidad: cantidad(2, "unidad") })]);

    const result = l.agregarItem(nuevo("Leche", 1, "l"), DESPUES, {
      duplicado: "unir",
      unidadFinal: "l",
    });

    expect(result).toMatchObject({ ok: false, error: { code: "UNIDADES_DISTINTAS" } });
  });

  it("agregarItem_UnirFamiliasDistintasConCantidadFinal_LaUsaTalCual", () => {
    const l = lista([item({ nombre: "Leche", cantidad: cantidad(2, "unidad") })]);

    l.agregarItem(nuevo("Leche", 1, "l"), DESPUES, {
      duplicado: "unir",
      cantidadFinal: cantidad(3, "l"),
    });

    expect(l.itemsActivos()[0]?.toSnapshot().cantidad).toEqual({ valor: 3, unidad: "l" });
  });

  it("agregarItem_UnirConUnoEnElCarro_VuelveAPorComprarSoloConLoNuevo", () => {
    const l = lista([
      item({ cantidad: cantidad(4, "unidad"), compradoAt: AHORA, compradoPorId: USUARIO_ID }),
    ]);

    l.agregarItem(nuevo("Pan", 2), DESPUES, { duplicado: "unir" });

    expect(l.itemsActivos()[0]?.toSnapshot()).toMatchObject({
      cantidad: { valor: 2, unidad: "unidad" },
      compradoAt: null,
      compradoPorId: null,
    });
  });

  it("agregarItem_HayPendienteYEnElCarro_UneConElPendiente", () => {
    const l = listaCon({}, [
      item({ id: ITEM_ID, compradoAt: AHORA, compradoPorId: USUARIO_ID }),
      item({ id: "0199c000-0000-7000-8000-0000000000c1", cantidad: cantidad(1, "unidad") }),
    ]);

    const result = l.agregarItem(nuevo("Pan"), DESPUES);

    expect(result).toMatchObject({
      ok: false,
      error: { details: { existente: { itemId: "0199c000-0000-7000-8000-0000000000c1" } } },
    });
  });

  it("agregarItem_ProductoQuitado_NoCuentaComoRepetido", () => {
    const l = lista([item({ deletedAt: AHORA })]);

    expect(l.agregarItem(nuevo("Pan"), DESPUES).ok).toBe(true);
  });
});

describe("ShoppingList: categoría", () => {
  it("actualizarItem_ConCategoria_LaCambiaYActualizaFechas", () => {
    const l = lista([item()]);

    const result = l.actualizarItem(ITEM_ID, { categoria: "panaderia" }, USUARIO_ID, DESPUES);

    expect(result.ok && result.value.categoria).toBe("panaderia");
    expect(l.itemsModificados()[0]).toMatchObject({ categoria: "panaderia", updatedAt: DESPUES });
  });

  it("agregarItem_SinCategoria_VaAOtros", () => {
    const l = lista();

    l.agregarItem({ id: OTRO_ID, nombre: "Tarta", cantidad: cantidad(1, "unidad") }, DESPUES);

    expect(l.itemsActivos()[0]?.categoria).toBe("otros");
  });
});
