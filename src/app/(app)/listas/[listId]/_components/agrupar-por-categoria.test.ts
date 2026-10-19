import { describe, expect, it } from "vitest";
import type { ShoppingItemResponse } from "@/contracts/shopping";
import { agruparPorCategoria } from "./agrupar-por-categoria";

const item = (id: string, categoria: ShoppingItemResponse["categoria"]): ShoppingItemResponse => ({
  id,
  nombre: id,
  cantidad: { valor: 1, unidad: "unidad" },
  nota: null,
  ingredientId: null,
  productoBaseId: null,
  categoria,
  compradoAt: null,
  updatedAt: "2026-10-20T10:00:00.000Z",
});

describe("agruparPorCategoria", () => {
  it("ordenDelSuper_YDentroElDeLlegada", () => {
    const grupos = agruparPorCategoria([
      item("lejia", "limpieza"),
      item("manzana", "frutas"),
      item("tarta", "otros"),
      item("pera", "frutas"),
    ]);

    expect(grupos.map((g) => [g.categoria, g.items.map((i) => i.id)])).toEqual([
      ["frutas", ["manzana", "pera"]],
      ["limpieza", ["lejia"]],
      ["otros", ["tarta"]],
    ]);
  });
});
