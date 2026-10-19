import { describe, expect, it } from "vitest";
import { filtrarSugerencias, indexarSugerencias } from "./filtrar-sugerencias";
import type { Sugerencia } from "./sugerencia";

const s = (nombre: string, usos = 0): Sugerencia => ({
  clave: nombre,
  nombre,
  categoria: "despensa",
  unidad: "unidad",
  productoBaseId: usos === 0 ? nombre : null,
  origen: usos === 0 ? "base" : "hogar",
  usos,
});

const indice = indexarSugerencias([
  s("Pechuga de pollo"),
  s("Pollo entero"),
  s("Caldo de pollo"),
  s("Repollo"),
  s("Plátano"),
  s("Piña"),
  s("Pollo al curry de Ana", 3),
]);
const nombres = (texto: string, max?: number) =>
  filtrarSugerencias(indice, texto, max).map((x) => x.nombre);

describe("filtrarSugerencias", () => {
  it("ordenaPorEmpiezaPalabraYContiene_ConLoDelHogarMasUsadoDelante", () => {
    expect(nombres("pollo")).toEqual([
      "Pollo al curry de Ana",
      "Pollo entero",
      "Caldo de pollo",
      "Pechuga de pollo",
      "Repollo",
    ]);
  });

  it("ignoraTildesYMayusculasPeroNoConfundeLaÑ", () => {
    expect(nombres("PLATANO")).toEqual(["Plátano"]);
    expect(nombres("piña")).toEqual(["Piña"]);
    expect(nombres("pina")).toEqual([]);
  });

  it("textoVacio_NoSugiereNada", () => {
    expect(nombres("   ")).toEqual([]);
  });

  it("respetaElMaximo", () => {
    expect(nombres("o", 2)).toHaveLength(2);
  });
});
