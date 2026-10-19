import { describe, expect, it } from "vitest";
import {
  AHORA,
  ARMARIO_ID,
  DESPUES,
  LECHE_BASE_ID,
  LINEA_ID,
  NEVERA_ID,
  USUARIO_ID,
  cantidad,
  contexto,
  dia,
  idN,
  linea,
} from "../testing/builders";
import { InventoryItem } from "./inventory-item";

describe("InventoryItem", () => {
  it("create_NombreValido_LineaConMovimientoDeEntrada", () => {
    const r = InventoryItem.create(
      {
        id: LINEA_ID,
        nombre: "  Leche   entera ",
        categoria: "lacteos_huevos",
        ubicacionId: NEVERA_ID,
        cantidad: cantidad(2, "l"),
      },
      { ...contexto(), origen: "compra", listaId: idN(50) },
      AHORA,
    );

    expect(r.ok && r.value.item.toSnapshot()).toMatchObject({
      nombre: "Leche entera",
      nombreNormalizado: "leche entera",
      productoBaseId: null,
      caducaEl: null,
      cantidadReferencia: { valor: 2, unidad: "l" },
    });
    expect(r.ok && r.value.movimiento).toEqual({
      id: idN(1),
      inventoryItemId: LINEA_ID,
      tipo: "entrada",
      cantidad: cantidad(2, "l"),
      origen: "compra",
      listaId: idN(50),
      usuarioId: USUARIO_ID,
      createdAt: AHORA,
    });
  });

  it.each(["", "   ", "x".repeat(81)])("create_NombreNoValido_%#", (nombre) => {
    const r = InventoryItem.create(
      {
        id: LINEA_ID,
        nombre,
        categoria: "otros",
        ubicacionId: NEVERA_ID,
        cantidad: cantidad(1, "unidad"),
      },
      contexto(),
      AHORA,
    );
    expect(r).toMatchObject({ ok: false, error: { code: "NOMBRE_NO_VALIDO" } });
  });

  it("sumar_GramosEnLineaDeKilos_ConvierteYActualizaReferencia", () => {
    const l = linea({ nombre: "Arroz", cantidad: cantidad(1, "kg") });

    const r = l.sumar(cantidad(500, "g"), contexto(), DESPUES);

    expect(l.toSnapshot()).toMatchObject({
      cantidad: { valor: 1.5, unidad: "kg" },
      cantidadReferencia: { valor: 1.5, unidad: "kg" },
      updatedAt: DESPUES,
    });
    expect(r.ok && r.value.cantidad).toEqual({ valor: 0.5, unidad: "kg" });
  });

  it("sumar_FamiliaDistinta_CantidadIncompatible", () => {
    expect(linea().sumar(cantidad(1, "unidad"), contexto(), DESPUES)).toMatchObject({
      ok: false,
      error: { code: "CANTIDAD_INCOMPATIBLE" },
    });
  });

  it("consumir_Parte_RestaYRegistraConsumo", () => {
    const l = linea({ nombre: "Yogur", cantidad: cantidad(6, "unidad") });

    const r = l.consumir(cantidad(2, "unidad"), "gastado", contexto(), DESPUES);

    expect(r).toMatchObject({
      ok: true,
      value: { agotada: false, movimiento: { tipo: "consumo" } },
    });
    expect(l.cantidad.valor).toBe(4);
  });

  it("consumir_Todo_SinCantidad_AgotaYDaDeBaja", () => {
    const l = linea();

    const r = l.consumir(undefined, "tirado", contexto(), DESPUES);

    expect(r).toMatchObject({
      ok: true,
      value: {
        agotada: true,
        movimiento: { tipo: "desecho", cantidad: { valor: 2, unidad: "l" } },
      },
    });
    expect(l.toSnapshot().deletedAt).toEqual(DESPUES);
  });

  it("consumir_EnOtraUnidadDeLaFamilia_Convierte", () => {
    const l = linea({ nombre: "Arroz", cantidad: cantidad(1, "kg") });

    l.consumir(cantidad(200, "g"), "gastado", contexto(), DESPUES);

    expect(l.cantidad).toEqual({ valor: 0.8, unidad: "kg" });
  });

  it("consumir_MasDeLoQueHay_CantidadInsuficienteSinCambios", () => {
    const l = linea();

    const r = l.consumir(cantidad(3, "l"), "gastado", contexto(), DESPUES);

    expect(r).toMatchObject({ ok: false, error: { code: "CANTIDAD_INSUFICIENTE" } });
    expect(l.cantidad.valor).toBe(2);
  });

  it("consumir_DecimalesQueSumanExacto_NoFallaPorRedondeo", () => {
    const l = linea({ cantidad: cantidad(0.3, "l") });

    const r = l.consumir(cantidad(0.1, "l"), "gastado", contexto(), DESPUES);
    l.consumir(cantidad(0.2, "l"), "gastado", contexto(2), DESPUES);

    expect(r.ok).toBe(true);
    expect(l.estaDeBaja).toBe(true);
  });

  it("consumir_UnidadIncompatible_Error", () => {
    expect(linea().consumir(cantidad(1, "unidad"), "gastado", contexto(), DESPUES)).toMatchObject({
      ok: false,
      error: { code: "CANTIDAD_INCOMPATIBLE" },
    });
  });

  it("ajustar_CambiaTotalYReferencia", () => {
    const l = linea();

    const m = l.ajustar(cantidad(3, "unidad"), contexto(), DESPUES);

    expect(m).toMatchObject({ tipo: "ajuste", cantidad: { valor: 3, unidad: "unidad" } });
    expect(l.toSnapshot().cantidadReferencia).toEqual({ valor: 3, unidad: "unidad" });
  });

  it("darDeBaja_RegistraLoQueHabia", () => {
    const l = linea();

    expect(l.darDeBaja(contexto(), DESPUES)).toMatchObject({
      tipo: "baja",
      cantidad: { valor: 2 },
    });
    expect(l.estaDeBaja).toBe(true);
  });

  it("moverCaducidadCategoria_CambianYActualizanFecha", () => {
    const l = linea();

    l.mover(ARMARIO_ID, DESPUES);
    l.cambiarCaducidad(dia("2026-11-03"), DESPUES);
    l.cambiarCategoria("bebidas", DESPUES);

    expect(l.toSnapshot()).toMatchObject({
      ubicacionId: ARMARIO_ID,
      caducaEl: "2026-11-03",
      categoria: "bebidas",
      updatedAt: DESPUES,
    });
  });

  it("sinCambiosReales_NoTocaUpdatedAt", () => {
    const l = linea();

    l.mover(NEVERA_ID, DESPUES);
    l.cambiarCaducidad(null, DESPUES);
    l.cambiarCategoria("lacteos_huevos", DESPUES);

    expect(l.toSnapshot().updatedAt).toEqual(AHORA);
  });

  it("esMismaLinea_MismoProductoUbicacionYFecha", () => {
    const l = linea({ caducaEl: dia("2026-11-03") });
    const clave = l.clave();

    expect(l.esMismaLinea({ ...clave, nombreNormalizado: "leche" })).toBe(true);
    expect(l.esMismaLinea({ ...clave, unidad: "ml" })).toBe(true);
    expect(l.esMismaLinea({ ...clave, caducaEl: null })).toBe(false);
    expect(l.esMismaLinea({ ...clave, ubicacionId: ARMARIO_ID })).toBe(false);
    expect(l.esMismaLinea({ ...clave, unidad: "unidad" })).toBe(false);
    expect(l.esMismaLinea({ ...clave, nombreNormalizado: "zumo" })).toBe(false);
  });

  it("esMismoProducto_PorVinculoAunqueSeEscribaDistinto", () => {
    const l = linea({ productoBaseId: LECHE_BASE_ID });

    expect(l.esMismoProducto({ productoBaseId: LECHE_BASE_ID, nombreNormalizado: "otra" })).toBe(
      true,
    );
    expect(l.esMismoProducto({ productoBaseId: null, nombreNormalizado: "leche" })).toBe(true);
    expect(l.esMismoProducto({ productoBaseId: idN(9), nombreNormalizado: "leche" })).toBe(false);
  });

  it.each([
    [cantidad(1, "unidad"), cantidad(6, "unidad"), true],
    [cantidad(2, "unidad"), cantidad(6, "unidad"), false],
    // Recién comprado: 1 ud. de 1 ud. no "queda poco".
    [cantidad(1, "unidad"), cantidad(1, "unidad"), false],
    [cantidad(200, "g"), cantidad(1, "kg"), true],
    [cantidad(300, "g"), cantidad(1, "kg"), false],
  ])("quedaPoco_%#", (actual, referencia, esperado) => {
    const l = linea({ cantidad: actual, cantidadReferencia: referencia });
    expect(l.quedaPoco()).toBe(esperado);
  });
});
