import { describe, expect, it } from "vitest";
import { AHORA, HOGAR_ID, USUARIO_ID } from "../testing/builders";
import { Hogar, MAX_NOMBRE_HOGAR } from "./hogar";

describe("Hogar", () => {
  it("create_ConNombreValido_RecortaElNombreYGuardaAlFundador", () => {
    const result = Hogar.create(
      { id: HOGAR_ID, nombre: "  Casa  ", fundadorId: USUARIO_ID },
      AHORA,
    );

    expect(result.ok && result.value.toSnapshot()).toEqual({
      id: HOGAR_ID,
      nombre: "Casa",
      fundadorId: USUARIO_ID,
      createdAt: AHORA,
      updatedAt: AHORA,
    });
  });

  it.each(["", "   ", "x".repeat(MAX_NOMBRE_HOGAR + 1)])(
    "create_ConNombreNoValido_DevuelveNombreNoValido (%#)",
    (nombre) => {
      const result = Hogar.create({ id: HOGAR_ID, nombre, fundadorId: USUARIO_ID }, AHORA);

      expect(result).toMatchObject({ ok: false, error: { code: "NOMBRE_NO_VALIDO" } });
    },
  );

  it("rehydrate_ConSnapshot_DevuelveElMismoEstado", () => {
    const snapshot = {
      id: HOGAR_ID,
      nombre: "Casa",
      fundadorId: USUARIO_ID,
      createdAt: AHORA,
      updatedAt: AHORA,
    };

    expect(Hogar.rehydrate(snapshot).id).toBe(HOGAR_ID);
  });
});
