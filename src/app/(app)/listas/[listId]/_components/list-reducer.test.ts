import { describe, expect, it } from "vitest";
import type { ShoppingItemResponse } from "@/contracts/shopping";
import { aplicarAccion } from "./list-reducer";
const leche: ShoppingItemResponse = {
  id: "0199c000-0000-7000-8000-0000000000aa",
  nombre: "Leche",
  cantidad: { valor: 2, unidad: "l" },
  nota: null,
  ingredientId: null,
  productoBaseId: null,
  compradoAt: null,
  updatedAt: "2026-10-10T10:00:00.000Z",
};
describe("aplicarAccion", () => {
  it("aplicarAccion_Comprado_MarcaSoloEseItem", () => {
    const result = aplicarAccion([leche], { tipo: "comprado", itemId: leche.id, comprado: true });
    expect(result[0]?.compradoAt).not.toBeNull();
  });
  it("aplicarAccion_Quitar_EliminaElItem", () => {
    const result = aplicarAccion([leche], { tipo: "quitar", itemId: leche.id });
    expect(result).toHaveLength(0);
  });
  it("aplicarAccion_TerminarConservandoPendientes_QuitaSoloLosComprados", () => {
    const pan = {
      ...leche,
      id: "0199c000-0000-7000-8000-0000000000bb",
      compradoAt: leche.updatedAt,
    };
    const result = aplicarAccion([leche, pan], { tipo: "terminar", modo: "conservarPendientes" });
    expect(result).toEqual([leche]);
  });
  it("aplicarAccion_TerminarVaciando_DejaLaListaVacia", () => {
    const result = aplicarAccion([leche], { tipo: "terminar", modo: "vaciar" });
    expect(result).toEqual([]);
  });
});
