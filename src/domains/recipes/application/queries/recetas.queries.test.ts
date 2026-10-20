import { describe, expect, it } from "vitest";
import {
  existencia,
  ingrediente,
  OTRA_RECETA_ID,
  RECETA_ID,
  receta,
  recetaIdN,
} from "@/domains/recipes/testing/builders";
import { InMemoryRecetaRepository } from "@/domains/recipes/testing/in-memory-receta-repository";
import { GetRecetaQuery } from "./get-receta.query";
import { SugerirRecetasQuery } from "./sugerir-recetas.query";

const tortilla = receta({
  id: OTRA_RECETA_ID,
  slug: "tortilla",
  nombre: "Tortilla de patatas",
  ingredientes: [ingrediente("Huevos", 6, "unidad"), ingrediente("Patatas", 600, "g")],
});
const lejana = receta({
  id: recetaIdN(1),
  slug: "lejana",
  nombre: "Cocido",
  ingredientes: [
    ingrediente("Garbanzos", 300, "g"),
    ingrediente("Morcillo de ternera", 300, "g"),
    ingrediente("Chorizo", 100, "g"),
  ],
});

describe("SugerirRecetasQuery", () => {
  it("separa las que se pueden hacer, las que casi y cuenta el resto", async () => {
    const query = new SugerirRecetasQuery(
      new InMemoryRecetaRepository([lejana, tortilla, receta()]),
    );

    const r = await query.execute({
      existencias: [
        existencia("Huevos", 12, "unidad"),
        existencia("Patatas", 1, "kg"),
        existencia("Arroz redondo", 1, "kg"),
      ],
    });

    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.puedes.map((e) => e.receta.slug)).toEqual(["tortilla"]);
    // Al arroz con pollo le faltan pollo y ajos (2): casi. Al cocido, 3: no se lista.
    expect(r.value.casi.map((e) => e.receta.slug)).toEqual(["arroz-con-pollo"]);
    expect(r.value.masCompra).toBe(1);
  });
});

describe("GetRecetaQuery", () => {
  const query = new GetRecetaQuery(new InMemoryRecetaRepository([receta()]));

  it("evalúa la receta con las raciones pedidas", async () => {
    const r = await query.execute({ recetaId: RECETA_ID, existencias: [], raciones: 2 });

    expect(r.ok && r.value.raciones).toBe(2);
  });

  it("RECETA_NO_ENCONTRADA si no existe", async () => {
    const r = await query.execute({ recetaId: OTRA_RECETA_ID, existencias: [] });

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe("RECETA_NO_ENCONTRADA");
  });
});
