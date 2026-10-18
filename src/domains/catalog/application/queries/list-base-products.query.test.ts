import { describe, expect, it } from "vitest";
import { InMemoryProductoBaseRepository } from "../../testing/in-memory-producto-base-repository";
import { ListBaseProductsQuery } from "./list-base-products.query";

describe("ListBaseProductsQuery", () => {
  it("execute_DevuelvePorCategoriaYNombre", async () => {
    const query = new ListBaseProductsQuery(
      new InMemoryProductoBaseRepository([
        { id: "3", nombre: "Lejía", categoria: "limpieza", unidadPorDefecto: "unidad" },
        { id: "2", nombre: "Pera", categoria: "frutas", unidadPorDefecto: "kg" },
        { id: "1", nombre: "Manzana", categoria: "frutas", unidadPorDefecto: "kg" },
      ]),
    );

    const result = await query.execute();

    expect(result.ok && result.value.map((p) => p.nombre)).toEqual(["Manzana", "Pera", "Lejía"]);
  });
});
