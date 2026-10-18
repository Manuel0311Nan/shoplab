import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/shared/kernel/auth";

/**
 * Endpoints de Better Auth: /api/v1/auth/sign-up/email, /sign-in/email, /sign-out, /get-session…
 *
 * Única excepción a "ningún Route Handler sin apiRoute": son rutas de la librería,
 * con su propio formato de error ({ code, message }). Ver CLAUDE.md, Identity.
 */
export const { GET, POST } = toNextJsHandler(auth);
