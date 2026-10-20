import { describe, expect, it } from "vitest";
import { existencia, ingrediente, producto, receta } from "@/domains/recipes/testing/builders";
import {
  compararEvaluaciones,
  escalar,
  calcularIngrediente,
  evaluarReceta,
  limitarRaciones,
} from "./disponibilidad";

const despensaCompleta = [
  existencia("Arroz redondo", 1, "kg"),
  existencia("Pechuga de pollo", 600, "g"),
  existencia("Ajos", 1, "unidad"),
];

describe("evaluarReceta", () => {
  it("con todo de sobra, se puede hacer con las raciones de la receta", () => {
    const e = evaluarReceta(receta(), despensaCompleta);

    expect(e.sePuedeHacer).toBe(true);
    expect(e.racionesSugeridas).toBe(4);
    expect(e.raciones).toBe(4);
    expect(e.faltan).toBe(0);
    expect(e.ingredientes.map((i) => i.estado)).toEqual(["tienes", "tienes", "tienes", "basico"]);
  });

  it("ajusta las raciones al ingrediente que da para menos", () => {
    // 150 g de arroz de 300 g para 4 → 2 raciones; el pollo da para 4.
    const e = evaluarReceta(receta(), [
      existencia("Arroz redondo", 150, "g"),
      existencia("Pechuga de pollo", 1, "kg"),
      existencia("Ajos", 1, "unidad"),
    ]);

    expect(e.racionesPosibles).toBe(2);
    expect(e.racionesSugeridas).toBe(2);
    expect(e.sePuedeHacer).toBe(true);
    expect(e.ingredientes[0]?.cantidad).toEqual({ valor: 150, unidad: "g" });
    expect(e.ingredientes[1]?.cantidad).toEqual({ valor: 250, unidad: "g" });
  });

  it("suma varias líneas del mismo producto y convierte unidades", () => {
    const e = evaluarReceta(receta(), [
      existencia("Arroz redondo", 0.1, "kg"),
      existencia("Arroz redondo", 200, "g"),
      existencia("Pechuga de pollo", 0.5, "kg"),
      existencia("Ajos", 1, "unidad"),
    ]);

    expect(e.ingredientes[0]?.disponible).toEqual({ valor: 300, unidad: "g" });
    expect(e.racionesSugeridas).toBe(4);
  });

  it("si falta un ingrediente obligatorio, no se puede hacer y dice cuánto comprar", () => {
    const e = evaluarReceta(receta(), [existencia("Arroz redondo", 1, "kg")]);

    expect(e.sePuedeHacer).toBe(false);
    expect(e.racionesSugeridas).toBe(4);
    expect(e.faltan).toBe(2);
    expect(e.ingredientes[1]).toMatchObject({
      estado: "falta",
      falta: { valor: 500, unidad: "g" },
    });
    expect(e.ingredientes[2]).toMatchObject({ estado: "falta", falta: null, nota: "2 dientes" });
  });

  it("si no da ni para una ración, propone una y dice lo que falta", () => {
    const e = evaluarReceta(receta(), [
      existencia("Arroz redondo", 50, "g"),
      existencia("Pechuga de pollo", 1, "kg"),
      existencia("Ajos", 1, "unidad"),
    ]);

    expect(e.racionesPosibles).toBe(0);
    expect(e.sePuedeHacer).toBe(false);
    expect(e.racionesSugeridas).toBe(1);
    expect(e.ingredientes[0]).toMatchObject({ estado: "poco", falta: { valor: 25, unidad: "g" } });
    expect(e.faltan).toBe(1);
  });

  it("al pedir más raciones, lo que no llega pasa a «poco» con lo que hay que comprar", () => {
    const e = evaluarReceta(receta(), despensaCompleta, 6);

    expect(e.raciones).toBe(6);
    expect(e.racionesSugeridas).toBe(4);
    expect(e.sePuedeHacer).toBe(true);
    // 750 g de pollo para 6, hay 600.
    expect(e.ingredientes[1]).toMatchObject({
      estado: "poco",
      cantidad: { valor: 750, unidad: "g" },
      falta: { valor: 150, unidad: "g" },
    });
    expect(e.faltan).toBe(1);
  });

  it("los básicos y los opcionales no bloquean", () => {
    const r = receta({
      ingredientes: [
        ingrediente("Arroz redondo", 300, "g"),
        ingrediente("Aceite de oliva", 30, "ml", { basico: true }),
        ingrediente("Perejil fresco", null, "unidad", { opcional: true }),
      ],
    });

    const e = evaluarReceta(r, [existencia("Arroz redondo", 1, "kg")]);

    expect(e.sePuedeHacer).toBe(true);
    expect(e.ingredientes.map((i) => i.estado)).toEqual(["tienes", "basico", "opcional"]);
  });

  it("si una línea no se puede medir (ud. frente a g), cuenta como que hay sin limitar", () => {
    const r = receta({ ingredientes: [ingrediente("Tomate pera", 400, "g")] });

    const e = evaluarReceta(r, [existencia("Tomate pera", 3, "unidad")]);

    expect(e.racionesPosibles).toBeNull();
    expect(e.sePuedeHacer).toBe(true);
    expect(e.ingredientes[0]).toMatchObject({ estado: "tienes", disponible: null, hay: true });
  });

  it("vale cualquiera de los productos alternativos, por id o por nombre", () => {
    const r = receta({
      ingredientes: [
        ingrediente("Tomate", 400, "g", {
          productos: [producto("Tomate pera"), producto("Tomate en rama")],
        }),
      ],
    });

    // Línea de texto libre sin vínculo, pero con el mismo nombre que la alternativa.
    const e = evaluarReceta(r, [
      { ...existencia("Tomate en rama", 1, "kg"), productoBaseId: null },
    ]);

    expect(e.sePuedeHacer).toBe(true);
    expect(e.ingredientes[0]?.producto?.nombre).toBe("Tomate pera");
  });

  it("guarda lo antes que caduca de lo que usa (sin contar básicos)", () => {
    const e = evaluarReceta(receta(), [
      existencia("Arroz redondo", 1, "kg", { caducaEnDias: 90 }),
      existencia("Pechuga de pollo", 1, "kg", { caducaEnDias: 2 }),
      existencia("Ajos", 1, "unidad"),
    ]);

    expect(e.caduca).toEqual({ nombre: "Pechuga de pollo", dias: 2 });
  });

  it("sin cantidades medibles, no hay límite de raciones", () => {
    const r = receta({ ingredientes: [ingrediente("Ajos", null, "unidad")] });
    const e = evaluarReceta(r, [existencia("Ajos", 1, "unidad")]);

    expect(e.racionesPosibles).toBeNull();
    expect(e.racionesSugeridas).toBe(4);
  });
});

describe("escalar", () => {
  it("redondea como se cocina", () => {
    expect(escalar({ valor: 3, unidad: "unidad" }, 4, 2)).toEqual({ valor: 1.5, unidad: "unidad" });
    expect(escalar({ valor: 3, unidad: "unidad" }, 4, 1)).toEqual({ valor: 1, unidad: "unidad" });
    expect(escalar({ valor: 1, unidad: "unidad" }, 4, 1)).toEqual({ valor: 0.5, unidad: "unidad" });
    expect(escalar({ valor: 250, unidad: "g" }, 4, 3)).toEqual({ valor: 188, unidad: "g" });
    expect(escalar({ valor: 2, unidad: "g" }, 4, 1)).toEqual({ valor: 1, unidad: "g" });
    expect(escalar({ valor: 1, unidad: "l" }, 4, 3)).toEqual({ valor: 0.75, unidad: "l" });
  });
});

describe("calcularIngrediente", () => {
  it("redondea lo que falta hacia arriba para comprar", () => {
    const huevos = calcularIngrediente(
      {
        basico: false,
        opcional: false,
        cantidadBase: { valor: 3, unidad: "unidad" },
        hay: true,
        disponible: { valor: 1, unidad: "unidad" },
      },
      4,
      6,
    );
    // 4,5 huevos para 6 raciones, hay 1 → faltan 4 (3,5 hacia arriba).
    expect(huevos).toMatchObject({ estado: "poco", falta: { valor: 4, unidad: "unidad" } });

    const leche = calcularIngrediente(
      {
        basico: false,
        opcional: false,
        cantidadBase: { valor: 0.5, unidad: "l" },
        hay: true,
        disponible: { valor: 0.2, unidad: "l" },
      },
      2,
      2,
    );
    expect(leche.falta).toEqual({ valor: 0.3, unidad: "l" });
  });
});

describe("limitarRaciones", () => {
  it("entre 1 y 12, enteras", () => {
    expect(limitarRaciones(0)).toBe(1);
    expect(limitarRaciones(2.4)).toBe(2);
    expect(limitarRaciones(40)).toBe(12);
    expect(limitarRaciones(Number.NaN)).toBe(1);
  });
});

describe("compararEvaluaciones", () => {
  const conTodo = (nombre: string, caduca: number | null) =>
    evaluarReceta(receta({ nombre }), [
      existencia("Arroz redondo", 1, "kg"),
      existencia("Pechuga de pollo", 1, "kg", { caducaEnDias: caduca }),
      existencia("Ajos", 1, "unidad"),
    ]);

  it("primero las que se pueden hacer, por lo que caduca antes y por nombre", () => {
    const sinPollo = evaluarReceta(receta({ nombre: "A sin pollo" }), [
      existencia("Arroz redondo", 1, "kg"),
      existencia("Ajos", 1, "unidad"),
    ]);
    const sinNada = evaluarReceta(receta({ nombre: "B sin nada" }), []);

    const orden = [
      sinNada,
      conTodo("Zarzuela", null),
      sinPollo,
      conTodo("Paella", 1),
      conTodo("Arroz", null),
    ].sort(compararEvaluaciones);

    expect(orden.map((e) => e.receta.nombre)).toEqual([
      "Paella",
      "Arroz",
      "Zarzuela",
      "A sin pollo",
      "B sin nada",
    ]);
  });
});
