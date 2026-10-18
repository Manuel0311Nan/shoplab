import { describe, expect, it } from "vitest";
import { codificarCursor, decodificarCursor } from "./cursor";

const CURSOR = {
  fecha: new Date("2026-10-19T10:00:00.123Z"),
  id: "0199f000-0000-7000-8000-000000000001",
};

describe("cursor", () => {
  it("decodificarCursor_DeUnCursorCodificado_DevuelveLoMismo", () => {
    expect(decodificarCursor(codificarCursor(CURSOR))).toEqual({ ok: true, value: CURSOR });
  });

  it("codificarCursor_EsOpacoYSeguroEnUrl", () => {
    expect(codificarCursor(CURSOR)).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it.each([
    "no-es-base64-json",
    Buffer.from("{}").toString("base64url"),
    Buffer.from(JSON.stringify({ f: "ayer", i: CURSOR.id })).toString("base64url"),
    Buffer.from(JSON.stringify({ f: CURSOR.fecha.toISOString(), i: "1" })).toString("base64url"),
  ])("decodificarCursor_Manipulado_DevuelveCursorNoValido (%#)", (texto) => {
    expect(decodificarCursor(texto)).toMatchObject({
      ok: false,
      error: { code: "CURSOR_NO_VALIDO", type: "validation" },
    });
  });
});
