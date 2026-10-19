import { describe, expect, it } from "vitest";
import { dia } from "../testing/builders";
import { estadoCaducidad } from "./estado-caducidad";

const hoy = dia("2026-10-20");

describe("estadoCaducidad", () => {
  it.each([
    [null, "sin_fecha", null],
    ["2026-10-19", "caducado", -1],
    ["2026-10-20", "pronto", 0],
    ["2026-10-27", "pronto", 7],
    ["2026-10-28", "ok", 8],
  ] as const)("%s → %s", (fecha, estado, dias) => {
    expect(estadoCaducidad(fecha === null ? null : dia(fecha), hoy)).toEqual({ estado, dias });
  });
});
