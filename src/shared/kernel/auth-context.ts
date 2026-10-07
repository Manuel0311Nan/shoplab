import "server-only";
import { env } from "@/env";
import { DEV_HOGAR_ID, DEV_USER_ID } from "./dev-identity";
import { unauthorizedError } from "./errors";
import { err, ok, type Result } from "./result";

export interface AuthContext {
  readonly userId: string;
  readonly hogarId: string;
}

export async function getAuthContext(): Promise<Result<AuthContext>> {
  // TODO(fase 5): sustituir por la sesión de Auth.js (cookie) o el token Bearer.
  if (env.NODE_ENV === "production") {
    return err(
      unauthorizedError("NO_AUTENTICADO", "La autenticación aún no está implementada"),
    );
  }

  return ok({ userId: DEV_USER_ID, hogarId: DEV_HOGAR_ID });
}