import { describe, expect, it } from "vitest";
import type { LineaDespensaResponse, UbicacionResponse } from "@/contracts/pantry";
import {
  agruparDespensa,
  agruparEnProductos,
  esUrgente,
  estadoCasilla,
  textoAbierto,
  textoAvisos,
  textoCaducidad,
} from "./vista-despensa";

const NEVERA = "0199c000-0000-7000-8000-0000000000e1";
const ARMARIO = "0199c000-0000-7000-8000-0000000000e3";
const ubicaciones: UbicacionResponse[] = [
  { id: ARMARIO, nombre: "Armario", tipo: "ambiente", orden: 2 },
  { id: NEVERA, nombre: "Nevera", tipo: "frio", orden: 1 },
];

let n = 0;
function linea(
  nombre: string,
  cambios: Partial<LineaDespensaResponse> & { dias?: number | null } = {},
): LineaDespensaResponse {
  const { dias = null, ...resto } = cambios;
  n += 1;
  return {
    id: `0199c000-0000-7000-8000-${String(n).padStart(12, "0")}`,
    nombre,
    productoBaseId: null,
    categoria: "despensa",
    ubicacionId: ARMARIO,
    cantidad: { valor: 1, unidad: "unidad" },
    caducaEl: dias === null ? null : "2026-10-20",
    caducidad: {
      estado: dias === null ? "sin_fecha" : dias < 0 ? "caducado" : dias <= 7 ? "pronto" : "ok",
      dias,
    },
    quedaPoco: false,
    porOrganizar: false,
    updatedAt: "2026-10-20T10:00:00.000Z",
    ...resto,
    abierto: resto.abierto ?? null,
  };
}

describe("agruparEnProductos", () => {
  it("juntaLotesDelMismoProductoYUbicacion_SumaYMandaElQueAntesCaduca", () => {
    const productos = agruparEnProductos([
      linea("Yogur", { dias: 10, cantidad: { valor: 4, unidad: "unidad" } }),
      linea("yogur", { dias: 3, cantidad: { valor: 2, unidad: "unidad" } }),
      linea("Yogur", { ubicacionId: NEVERA }),
    ]);

    expect(productos).toHaveLength(2);
    const armario = productos.find((p) => p.ubicacionId === ARMARIO);
    expect(armario?.total).toEqual({ valor: 6, unidad: "unidad" });
    expect(armario?.principal.caducidad.dias).toBe(3);
  });

  it("unidadesQueNoSeSuman_SinTotal", () => {
    const [p] = agruparEnProductos([
      linea("Leche", { cantidad: { valor: 1, unidad: "l" }, dias: 2 }),
      linea("Leche", { cantidad: { valor: 2, unidad: "unidad" }, dias: 5 }),
    ]);
    expect(p?.total).toBeNull();
  });
});

describe("agruparDespensa", () => {
  const lineas = [
    linea("Lejía", { categoria: "limpieza" }),
    linea("Leche", { categoria: "lacteos_huevos", ubicacionId: NEVERA, dias: 2 }),
    linea("Arroz", { categoria: "despensa", dias: 30 }),
    linea("Pasta", { categoria: "despensa" }),
  ];

  it("porUbicacion_OrdenDelHogarYCategoriasDentro", () => {
    const grupos = agruparDespensa(ubicaciones, lineas, "ubicacion");

    expect(grupos.map((g) => g.titulo)).toEqual(["Nevera", "Armario"]);
    expect(grupos[1]?.subgrupos.map((s) => [s.titulo, s.productos.map((p) => p.nombre)])).toEqual([
      ["Despensa", ["Arroz", "Pasta"]],
      ["Limpieza", ["Lejía"]],
    ]);
  });

  it("porCategoria_OrdenDelSuper", () => {
    const grupos = agruparDespensa(ubicaciones, lineas, "categoria");
    expect(grupos.map((g) => g.titulo)).toEqual(["Lácteos y huevos", "Despensa", "Limpieza"]);
  });

  it("filtros_UbicacionYUrgentes", () => {
    expect(
      agruparDespensa(ubicaciones, lineas, "ubicacion", { ubicacionId: NEVERA }).map(
        (g) => g.titulo,
      ),
    ).toEqual(["Nevera"]);
    const urgentes = agruparDespensa(ubicaciones, lineas, "categoria", { urgentes: true });
    expect(
      urgentes.flatMap((g) => g.subgrupos.flatMap((s) => s.productos.map((p) => p.nombre))),
    ).toEqual(["Leche"]);
  });
});

describe("textoCaducidad", () => {
  it.each([
    [null, null],
    [-3, "Caducó hace 3 días"],
    [-1, "Caducó ayer"],
    [0, "Caduca hoy"],
    [1, "Caduca mañana"],
    [6, "Caduca en 6 días"],
  ])("%s → %s", (dias, texto) => {
    expect(textoCaducidad({ estado: "ok", dias })).toBe(texto);
  });
});

const abierto = (dias: number, color: "verde" | "amarillo" | "rojo") => ({
  el: "2026-10-15",
  dias,
  color,
  aviso: { amarillo: 3, rojo: 5 },
});

describe("abiertos", () => {
  it("textoAbierto dice cuánto lleva y si hay que revisarlo", () => {
    expect(textoAbierto(null)).toBeNull();
    expect(textoAbierto(abierto(0, "verde"))).toBe("Abierto hoy");
    expect(textoAbierto(abierto(1, "verde"))).toBe("Abierto ayer");
    expect(textoAbierto(abierto(4, "amarillo"))).toBe("Abierto hace 4 días · revísalo");
    expect(textoAbierto(abierto(6, "rojo"))).toBe("Abierto hace 6 días · mira si sigue bueno");
  });

  it("los abiertos en amarillo o rojo entran en «ver» y en el aviso", () => {
    const lineas = [
      linea("Jamón york", { abierto: abierto(4, "amarillo") }),
      linea("Leche", { abierto: abierto(1, "verde") }),
      linea("Yogur", { dias: 2 }),
    ];
    expect(lineas.filter(esUrgente).map((l) => l.nombre)).toEqual(["Jamón york", "Yogur"]);
    expect(textoAvisos(lineas)).toBe("1 producto caduca esta semana · 1 abierto para revisar");
    expect(textoAvisos(lineas.slice(1, 2))).toBeNull();
  });

  it("un abierto que se pone rojo antes que otra caducidad va primero", () => {
    const [producto] = agruparEnProductos([
      linea("Tomate frito", { dias: 30 }),
      linea("Tomate frito", { abierto: abierto(4, "amarillo") }),
    ]);
    expect(producto?.principal.abierto?.dias).toBe(4);
  });
});

describe("estadoCasilla", () => {
  const producto = (l: LineaDespensaResponse) => {
    const [p] = agruparEnProductos([l]);
    if (p === undefined) throw new Error("sin producto");
    return p;
  };
  const abierto = (color: "verde" | "amarillo" | "rojo", dias: number) =>
    ({ color, dias, aviso: { amarillo: 3, rojo: 5 }, abiertoEl: "2026-10-16" }) as never;

  it("lo más urgente primero: caducado, caduca pronto, abierto, queda poco", () => {
    expect(estadoCasilla(producto(linea("A", { dias: -2 })))).toEqual({
      texto: "Caducado",
      tono: "rojo",
    });
    expect(estadoCasilla(producto(linea("B", { dias: 0 })))?.texto).toBe("Caduca hoy");
    expect(estadoCasilla(producto(linea("C", { dias: 1 })))?.texto).toBe("Caduca mañana");
    expect(estadoCasilla(producto(linea("D", { dias: 4 })))).toEqual({
      texto: "Caduca en 4 d",
      tono: "ambar",
    });
    expect(estadoCasilla(producto(linea("E", { abierto: abierto("rojo", 6) })))).toEqual({
      texto: "Abierto 6 d",
      tono: "rojo",
    });
    expect(estadoCasilla(producto(linea("F", { abierto: abierto("amarillo", 4) })))?.tono).toBe(
      "ambar",
    );
    expect(estadoCasilla(producto(linea("G", { abierto: abierto("verde", 1) })))?.texto).toBe(
      "Abierto",
    );
    expect(estadoCasilla(producto(linea("H", { quedaPoco: true })))?.texto).toBe("Queda poco");
    expect(estadoCasilla(producto(linea("I", { dias: 20 })))).toBeNull();
  });
});

describe("agruparDespensa con lo por organizar", () => {
  it("agruparDespensa_PorOrganizar_VaEnSuGrupoElPrimeroYNoEnSuUbicacion", () => {
    const lineas = [
      linea("Leche de avena", { ubicacionId: NEVERA, porOrganizar: true }),
      linea("Leche de avena", { ubicacionId: NEVERA }),
      linea("Arroz"),
    ];

    for (const modo of ["ubicacion", "categoria"] as const) {
      const grupos = agruparDespensa(ubicaciones, lineas, modo);
      expect(grupos[0]?.titulo).toBe("Por organizar");
      expect(grupos[0]?.subgrupos[0]?.productos.map((p) => p.nombre)).toEqual(["Leche de avena"]);
      const resto = grupos.slice(1).flatMap((g) => g.subgrupos.flatMap((s) => s.productos));
      expect(resto.map((p) => p.nombre).sort()).toEqual(["Arroz", "Leche de avena"]);
    }
  });

  it("agruparDespensa_SinNadaPorOrganizar_SinEseGrupo", () => {
    const grupos = agruparDespensa(ubicaciones, [linea("Arroz")], "ubicacion");
    expect(grupos.map((g) => g.titulo)).toEqual(["Armario"]);
  });
});
