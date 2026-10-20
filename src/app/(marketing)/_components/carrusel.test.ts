import { describe, expect, it } from "vitest";
import { pasoVecino, pasoVisible } from "./carrusel";

describe("pasoVisible", () => {
  it("devuelve el paso más cercano al scroll", () => {
    expect(pasoVisible(0, 400, 4)).toBe(0);
    expect(pasoVisible(390, 400, 4)).toBe(1);
    expect(pasoVisible(610, 400, 4)).toBe(2);
  });

  it("no se sale de los extremos (rebote del scroll en iOS)", () => {
    expect(pasoVisible(-30, 400, 4)).toBe(0);
    expect(pasoVisible(2000, 400, 4)).toBe(3);
  });

  it("sin ancho o sin pasos, el primero", () => {
    expect(pasoVisible(100, 0, 4)).toBe(0);
    expect(pasoVisible(100, 400, 0)).toBe(0);
  });
});

describe("pasoVecino", () => {
  it("avanza y retrocede", () => {
    expect(pasoVecino(1, 1, 4)).toBe(2);
    expect(pasoVecino(1, -1, 4)).toBe(0);
  });

  it("se queda en los extremos", () => {
    expect(pasoVecino(0, -1, 4)).toBe(0);
    expect(pasoVecino(3, 1, 4)).toBe(3);
    expect(pasoVecino(0, 1, 0)).toBe(0);
  });
});
