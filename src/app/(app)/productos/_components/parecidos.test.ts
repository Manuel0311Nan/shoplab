import { describe, expect, it } from "vitest";
import type { MiProductoResponse } from "@/contracts/catalog";
import { filtrarProductos, unionPropuesta } from "./parecidos";

const producto = (nombre: string, usos: number): MiProductoResponse => ({
  nombreNormalizado: nombre.toLowerCase(),
  nombre,
  categoria: "lacteos_huevos",
  unidad: "unidad",
  usos,
  unidadesPorPack: null,
});

describe("unionPropuesta", () => {
  const a = producto("Yogures proteina natural", 1);
  const b = producto("Yogur proteína natural", 5);
  const ref = (p: MiProductoResponse) => ({
    nombreNormalizado: p.nombreNormalizado,
    nombre: p.nombre,
  });

  it("sin lista base: se une en el más usado", () => {
    expect(unionPropuesta({ productos: [ref(a), ref(b)], base: null }, [a, b])).toEqual({
      destino: { nombre: "Yogur proteína natural", productoBaseId: null },
      desde: ["yogures proteina natural"],
    });
  });

  it("con lista base: todos pasan al de la lista base", () => {
    const base = { id: "0199c000-0000-7000-8000-0000000000c2", nombre: "Leche entera" };
    const c = producto("Leches enteras", 2);
    expect(unionPropuesta({ productos: [ref(c)], base }, [c])).toEqual({
      destino: { nombre: "Leche entera", productoBaseId: base.id },
      desde: ["leches enteras"],
    });
  });
});

describe("filtrarProductos", () => {
  it("busca sin tildes ni mayúsculas", () => {
    const lista = [producto("Yogur proteína natural", 1), producto("Pan de molde", 1)];
    expect(filtrarProductos(lista, "  YOGUR ").map((p) => p.nombre)).toEqual([
      "Yogur proteína natural",
    ]);
    expect(filtrarProductos(lista, "")).toHaveLength(2);
  });
});
