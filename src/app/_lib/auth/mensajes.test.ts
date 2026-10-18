import { describe, expect, it } from "vitest";
import { mensajeDeErrorAuth } from "./mensajes";

describe("mensajeDeErrorAuth", () => {
  it("mensajeDeErrorAuth_429_PideEsperar", () => {
    expect(mensajeDeErrorAuth({ status: 429 }, "login")).toMatch(/Demasiados intentos/);
  });

  it("mensajeDeErrorAuth_LoginIncorrecto_MensajeUnicoSinRevelarElEmail", () => {
    const sinUsuario = mensajeDeErrorAuth(
      { status: 401, code: "INVALID_EMAIL_OR_PASSWORD" },
      "login",
    );
    const otraForma = mensajeDeErrorAuth({ status: 400, code: "INVALID_EMAIL" }, "login");

    expect(sinUsuario).toBe("Email o contraseña incorrectos.");
    expect(otraForma).toBe(sinUsuario);
  });

  it("mensajeDeErrorAuth_RegistroConEmailExistente_ProponeEntrar", () => {
    const mensaje = mensajeDeErrorAuth(
      { status: 422, code: "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL" },
      "registro",
    );

    expect(mensaje).toMatch(/Ya hay una cuenta/);
  });

  it("mensajeDeErrorAuth_PasswordCorta_LoDice", () => {
    expect(mensajeDeErrorAuth({ status: 400, code: "PASSWORD_TOO_SHORT" }, "registro")).toMatch(
      /demasiado corta/,
    );
  });

  it("mensajeDeErrorAuth_ErrorDesconocido_MensajeGenerico", () => {
    expect(mensajeDeErrorAuth({ status: 500 }, "registro")).toMatch(/Inténtalo de nuevo/);
  });
});
