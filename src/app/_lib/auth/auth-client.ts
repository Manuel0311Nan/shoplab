import { createAuthClient } from "better-auth/client";

/**
 * Cliente de Better Auth para el navegador. Llama a `/api/v1/auth/*`, los mismos
 * endpoints que usará la app móvil, y así pasa por el límite de peticiones.
 * (Las llamadas de servidor con `auth.api.*` no lo pasan: no las uses para login.)
 */
export const authClient = createAuthClient({ basePath: "/api/v1/auth" });
