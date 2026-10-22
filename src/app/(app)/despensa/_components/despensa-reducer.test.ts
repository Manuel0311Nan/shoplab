import { describe, expect, it } from "vitest";
import type { LineaDespensaResponse } from "@/contracts/pantry";
import { aplicarAccionDespensa } from "./despensa-reducer";

const yogur: LineaDespensaResponse = {
  id: "0199c000-0000-7000-8000-000000000001",
  nombre: "Yogur",
  productoBaseId: null,
  categoria: "lacteos_huevos",
  ubicacionId: "0199c000-0000-7000-8000-0000000000e1",
  cantidad: { valor: 6, unidad: "unidad" },
  caducaEl: null,
  caducidad: { estado: "sin_fecha", dias: null },
  quedaPoco: false,
  abierto: null,
  updatedAt: "2026-10-20T10:00:00.000Z",
};

describe("aplicarAccionDespensa", () => {
  it("reponer_DevuelveLaLineaComoEstabaOLaVuelveAPoner", () => {
    const gastado = { ...yogur, cantidad: { valor: 5, unidad: "unidad" as const } };
    expect(aplicarAccionDespensa([gastado], { tipo: "reponer", linea: yogur })).toEqual([yogur]);
    expect(aplicarAccionDespensa([], { tipo: "reponer", linea: yogur })).toEqual([yogur]);
  });

  it("consumirParte_Resta", () => {
    expect(
      aplicarAccionDespensa([yogur], { tipo: "consumir", lineaId: yogur.id, valor: 2 })[0]?.cantidad
        .valor,
    ).toBe(4);
  });

  it("consumirTodoOSinCantidad_Desaparece", () => {
    expect(
      aplicarAccionDespensa([yogur], { tipo: "consumir", lineaId: yogur.id, valor: 6 }),
    ).toEqual([]);
    expect(aplicarAccionDespensa([yogur], { tipo: "consumir", lineaId: yogur.id })).toEqual([]);
  });

  it("quitar_LaQuita", () => {
    expect(aplicarAccionDespensa([yogur], { tipo: "quitar", lineaId: yogur.id })).toEqual([]);
  });
});
