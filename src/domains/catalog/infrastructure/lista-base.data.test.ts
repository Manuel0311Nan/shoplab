import { describe, expect, it } from "vitest";
import { CATEGORIAS } from "@/shared/kernel/categoria";
import { normalizarNombre } from "@/shared/kernel/texto";
import { UNIDADES } from "@/shared/kernel/unidad";
import { LISTA_BASE } from "./lista-base.data";

describe("LISTA_BASE", () => {
  it("tieneAlMenos200Productos", () => {
    expect(LISTA_BASE.length).toBeGreaterThanOrEqual(200);
  });

  it("nombresUnicosUnaVezNormalizados (el seed hace upsert por nombre normalizado)", () => {
    const normalizados = LISTA_BASE.map(([nombre]) => normalizarNombre(nombre));

    expect(new Set(normalizados).size).toBe(normalizados.length);
  });

  it("categoriasYUnidadesValidas_YTodasLasCategoriasConProductos", () => {
    for (const [nombre, categoria, unidad] of LISTA_BASE) {
      expect(nombre.trim()).toBe(nombre);
      expect(CATEGORIAS).toContain(categoria);
      expect(UNIDADES).toContain(unidad);
    }
    // Todas menos "otros", que es para lo que no se sabe clasificar.
    expect(new Set(LISTA_BASE.map(([, c]) => c)).size).toBe(CATEGORIAS.length - 1);
  });
});
