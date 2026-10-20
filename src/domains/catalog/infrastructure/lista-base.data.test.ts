import { describe, expect, it } from "vitest";
import { CATEGORIAS } from "@/shared/kernel/categoria";
import { normalizarNombre } from "@/shared/kernel/texto";
import { UNIDADES } from "@/shared/kernel/unidad";
import { esAvisoAbiertoValido, sePuedeAbrir } from "@/shared/kernel/abierto";
import { AVISO_ABIERTO, LISTA_BASE, SINONIMOS } from "./lista-base.data";

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

  it("sinonimos_DeProductosQueExisten_YSinChocarConOtrosNombres", () => {
    const nombres = new Set(LISTA_BASE.map(([nombre]) => nombre));
    const normalizados = new Set(LISTA_BASE.map(([nombre]) => normalizarNombre(nombre)));
    const vistos = new Set<string>();
    for (const [producto, sinonimos] of Object.entries(SINONIMOS)) {
      expect(nombres).toContain(producto);
      for (const sinonimo of sinonimos) {
        const n = normalizarNombre(sinonimo);
        expect(normalizados.has(n), sinonimo).toBe(false);
        expect(vistos.has(n), sinonimo).toBe(false);
        vistos.add(n);
      }
    }
  });

  it("avisoAbierto_DeProductosQueExisten_QueSeAbren_YConDiasValidos", () => {
    const categorias = new Map(LISTA_BASE.map(([nombre, categoria]) => [nombre, categoria]));
    for (const [producto, [amarillo, rojo]] of Object.entries(AVISO_ABIERTO)) {
      const categoria = categorias.get(producto);
      expect(categoria, producto).toBeDefined();
      if (categoria !== undefined) expect(sePuedeAbrir(categoria), producto).toBe(true);
      expect(esAvisoAbiertoValido({ amarillo, rojo }), producto).toBe(true);
    }
  });
});
