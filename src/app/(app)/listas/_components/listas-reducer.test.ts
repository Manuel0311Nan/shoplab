import { describe, expect, it } from "vitest";
import type { ShoppingListSummary } from "@/contracts/shopping";
import { aplicarAccionListas } from "./listas-reducer";

const tarjeta = (id: string, nombre: string): ShoppingListSummary => ({
  id,
  nombre,
  archivada: false,
  archivadaAt: null,
  caducaEl: null,
  pendientes: 0,
  total: 0,
  updatedAt: "2026-10-10T10:00:00.000Z",
});

describe("aplicarAccionListas", () => {
  const listas = [tarjeta("a", "Semana"), tarjeta("b", "Fiesta")];

  it("renombrar_CambiaSoloEsaListaSinMutar", () => {
    const resultado = aplicarAccionListas(listas, { tipo: "renombrar", id: "b", nombre: "Cumple" });

    expect(resultado.map((l) => l.nombre)).toEqual(["Semana", "Cumple"]);
    expect(listas[1]?.nombre).toBe("Fiesta");
  });

  it("quitar_LaSacaDeLaPestaña", () => {
    expect(aplicarAccionListas(listas, { tipo: "quitar", id: "a" }).map((l) => l.id)).toEqual([
      "b",
    ]);
  });
});
