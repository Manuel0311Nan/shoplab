import { describe, expect, it } from "vitest";
import { LISTA_BASE } from "@/domains/catalog/infrastructure/lista-base.data";
import {
  cargarBiblioteca,
  problemasDeBiblioteca,
} from "@/domains/recipes/infrastructure/biblioteca/biblioteca";

// Aquí y no en Recipes: es el único sitio que puede ver a la vez el catálogo y la
// biblioteca (los contextos no se importan entre sí).
describe("biblioteca de recetas", () => {
  const recetas = cargarBiblioteca();

  it("todos los lotes cumplen el esquema y hay recetas", () => {
    expect(recetas.length).toBeGreaterThan(40);
  });

  it("cada producto nombrado existe en la lista base y no hay slugs repetidos", () => {
    expect(
      problemasDeBiblioteca(
        recetas,
        LISTA_BASE.map(([nombre]) => nombre),
      ),
    ).toEqual([]);
  });

  it("problemasDeBiblioteca detecta productos que no existen y slugs repetidos", () => {
    const [una] = recetas;
    if (una === undefined) throw new Error("biblioteca vacía");
    const rota = {
      ...una,
      ingredientes: [
        {
          ...una.ingredientes[0],
          nombre: "X",
          productos: ["Unicornio"],
          basico: false,
          opcional: false,
        },
      ],
    };
    expect(problemasDeBiblioteca([una, rota], ["Huevos"])).toEqual(
      expect.arrayContaining([
        `${una.slug}: slug repetido`,
        `${una.slug}: «Unicornio» no está en la lista base`,
      ]),
    );
  });
});
