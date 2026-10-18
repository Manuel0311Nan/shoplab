import { describe, expect, it } from "vitest";
import { createHouseholdRequestSchema } from "./households";

describe("createHouseholdRequestSchema", () => {
  it("parse_NombreConEspacios_LoRecorta", () => {
    expect(createHouseholdRequestSchema.parse({ nombre: "  Casa  " })).toEqual({ nombre: "Casa" });
  });

  it.each([{ nombre: "" }, { nombre: "x".repeat(61) }, { nombre: "Casa", id: "no-uuid" }])(
    "safeParse_DatosNoValidos_Falla (%#)",
    (datos) => {
      expect(createHouseholdRequestSchema.safeParse(datos).success).toBe(false);
    },
  );
});
