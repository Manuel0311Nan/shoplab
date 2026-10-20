import { describe, expect, it } from "vitest";
import {
  AVISO_ABIERTO_POR_CATEGORIA,
  esAvisoAbiertoValido,
  estadoAbierto,
  sePuedeAbrir,
} from "./abierto";
import { CATEGORIAS } from "./categoria";
import { Dia } from "./dia";

const dia = (texto: string) => {
  const d = Dia.create(texto);
  if (!d.ok) throw new Error(texto);
  return d.value;
};

describe("estadoAbierto", () => {
  const jamonYork = { amarillo: 3, rojo: 5 };

  it("verde, amarillo y rojo según los días que lleva abierto", () => {
    expect(estadoAbierto(dia("2026-10-20"), dia("2026-10-20"), jamonYork)).toEqual({
      color: "verde",
      dias: 0,
    });
    expect(estadoAbierto(dia("2026-10-18"), dia("2026-10-20"), jamonYork).color).toBe("verde");
    expect(estadoAbierto(dia("2026-10-17"), dia("2026-10-20"), jamonYork)).toEqual({
      color: "amarillo",
      dias: 3,
    });
    expect(estadoAbierto(dia("2026-10-15"), dia("2026-10-20"), jamonYork)).toEqual({
      color: "rojo",
      dias: 5,
    });
  });

  it("una fecha de apertura futura cuenta como abierto hoy", () => {
    expect(estadoAbierto(dia("2026-10-22"), dia("2026-10-20"), jamonYork)).toEqual({
      color: "verde",
      dias: 0,
    });
  });
});

describe("aviso por categoría", () => {
  it("cada categoría tiene un aviso válido o no se abre", () => {
    for (const categoria of CATEGORIAS) {
      const aviso = AVISO_ABIERTO_POR_CATEGORIA[categoria];
      if (aviso !== null) expect(esAvisoAbiertoValido(aviso), categoria).toBe(true);
    }
  });

  it("la fruta, la verdura, la limpieza y la higiene no se abren", () => {
    expect(sePuedeAbrir("frutas")).toBe(false);
    expect(sePuedeAbrir("higiene")).toBe(false);
    expect(sePuedeAbrir("charcuteria")).toBe(true);
  });

  it("esAvisoAbiertoValido rechaza rojo antes que amarillo y valores fuera de rango", () => {
    expect(esAvisoAbiertoValido({ amarillo: 3, rojo: 3 })).toBe(false);
    expect(esAvisoAbiertoValido({ amarillo: 0, rojo: 3 })).toBe(false);
    expect(esAvisoAbiertoValido({ amarillo: 1.5, rojo: 3 })).toBe(false);
    expect(esAvisoAbiertoValido({ amarillo: 10, rojo: 800 })).toBe(false);
  });
});
