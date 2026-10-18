import { describe, expect, it } from "vitest";
import type { ProductoBaseResponse } from "@/contracts/catalog";
import { filtrarProductos, indexarProductos } from "./filtrar-productos";

let n = 0;
const p = (nombre: string): ProductoBaseResponse => ({
  id: `0199c000-0000-7000-8000-${String(++n).padStart(12, "0")}`,
  nombre,
  categoria: "despensa",
  unidadPorDefecto: "unidad",
});

const indice = indexarProductos([
  p("Pechuga de pollo"),
  p("Pollo entero"),
  p("Caldo de pollo"),
  p("Repollo"),
  p("Plátano"),
  p("Piña"),
]);
const nombres = (texto: string, max?: number) =>
  filtrarProductos(indice, texto, max).map((x) => x.nombre);

describe("filtrarProductos", () => {
  it("ordenaPorEmpiezaPalabraYContiene", () => {
    expect(nombres("pollo")).toEqual([
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
