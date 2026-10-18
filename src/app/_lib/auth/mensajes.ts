/** Error tal como lo devuelve el cliente de Better Auth. */
export interface ErrorDeAuth {
  readonly status: number;
  readonly code?: string | undefined;
}

export type OperacionAuth = "login" | "registro";

/**
 * Traduce un error de Better Auth a un mensaje para la pantalla.
 * El login nunca dice si el email existe: el mismo mensaje para email y contraseña.
 */
export function mensajeDeErrorAuth(error: ErrorDeAuth, operacion: OperacionAuth): string {
  if (error.status === 429) return "Demasiados intentos. Espera unos segundos y vuelve a probar.";

  if (operacion === "registro" && error.code?.startsWith("USER_ALREADY_EXISTS") === true) {
    return "Ya hay una cuenta con ese email. Prueba a entrar.";
  }
  if (operacion === "registro" && error.code === "PASSWORD_TOO_SHORT") {
    return "La contraseña es demasiado corta.";
  }
  if (operacion === "login" && (error.status === 401 || error.status === 400)) {
    return "Email o contraseña incorrectos.";
  }
  return "No se ha podido completar. Inténtalo de nuevo en un momento.";
}
