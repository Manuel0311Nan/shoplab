import { describe, expect, it } from "vitest";
import { loginRequestSchema, registerRequestSchema } from "./auth";

describe("registerRequestSchema", () => {
  it("parse_DatosValidos_NormalizaNombreYEmail", () => {
    const result = registerRequestSchema.parse({
      name: "  Ana ",
      email: "  Ana@Example.COM ",
      password: "12345678",
    });

    expect(result).toEqual({ name: "Ana", email: "ana@example.com", password: "12345678" });
  });

  it.each([
    { name: "", email: "ana@example.com", password: "12345678" },
    { name: "Ana", email: "no-es-email", password: "12345678" },
    { name: "Ana", email: "ana@example.com", password: "1234567" },
    { name: "Ana", email: "ana@example.com", password: "x".repeat(129) },
  ])("safeParse_DatosNoValidos_Falla (%#)", (datos) => {
    expect(registerRequestSchema.safeParse(datos).success).toBe(false);
  });

  it("safeParse_PasswordConEspacios_NoLaRecorta", () => {
    const result = registerRequestSchema.parse({
      name: "Ana",
      email: "ana@example.com",
      password: " clave segura ",
    });

    expect(result.password).toBe(" clave segura ");
  });
});

describe("loginRequestSchema", () => {
  it("safeParse_SinPassword_DevuelveMensajeEnCastellano", () => {
    const result = loginRequestSchema.safeParse({ email: "ana@example.com", password: "" });

    expect(result.success).toBe(false);
    expect(result.error?.issues.at(0)?.message).toBe("Escribe tu contraseña");
  });
});
