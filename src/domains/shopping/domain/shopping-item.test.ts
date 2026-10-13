import { describe, expect, it } from "vitest";
import { AHORA, ITEM_ID, cantidad } from "../testing/builders";
import { ShoppingItem } from "./shopping-item";

const crear = (cambios: { nombre?: string; nota?: string | null } = {}) =>
  ShoppingItem.create(
    { id: ITEM_ID, nombre: "Pan", cantidad: cantidad(1, "unidad"), ...cambios },
    AHORA,
  );

describe("ShoppingItem.create", () => {
  it("create_ConNotaConEspacios_LaRecortaYVaciaPasaANull", () => {
    const conNota = crear({ nota: "  integral  " });
    const sinNota = crear({ nota: "   " });

    expect(conNota.ok && conNota.value.toSnapshot().nota).toBe("integral");
    expect(sinNota.ok && sinNota.value.toSnapshot().nota).toBeNull();
  });

  it.each(["", "   ", "x".repeat(81)])(
    "create_ConNombreNoValido_%j_DevuelveNombreNoValido",
    (nombre) => {
      expect(crear({ nombre })).toMatchObject({
        ok: false,
        error: { code: "NOMBRE_NO_VALIDO" },
      });
    },
  );

  it("create_ConNombreDe80Caracteres_EsValido", () => {
    expect(crear({ nombre: "x".repeat(80) }).ok).toBe(true);
  });

  it("create_ConNotaDemasiadoLarga_DevuelveNotaNoValida", () => {
    expect(crear({ nota: "x".repeat(201) })).toMatchObject({
      ok: false,
      error: { code: "NOTA_NO_VALIDA" },
    });
  });
});
