import "server-only";
import { headers } from "next/headers";
import { cache } from "react";
import { auth } from "./auth";
import { forbiddenError, unauthorizedError } from "./errors";
import { elegirHogarActivo } from "./hogar-activo";
import { prisma } from "./prisma";
import { err, ok, type Result } from "./result";

/** Quién hace la petición. Basta para lo que se hace antes de tener hogar (/bienvenida). */
export interface Identity {
  readonly userId: string;
  readonly nombre: string;
  readonly email: string;
}

/** Identidad + hogar activo: lo que reciben los use cases de un hogar. */
export interface AuthContext {
  readonly userId: string;
  readonly hogarId: string;
}

/**
 * Lee la sesión de la cookie (web) o de `Authorization: Bearer` (app móvil) y la valida
 * contra la BD. Memoizada con `cache()`: una consulta por petición aunque la llamen la
 * página, `generateMetadata` y el layout.
 */
export const getIdentity = cache(async (): Promise<Result<Identity>> => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session === null) {
    return err(unauthorizedError("NO_AUTENTICADO", "Inicia sesión para continuar"));
  }
  const { id, name, email } = session.user;
  return ok({ userId: id, nombre: name, email });
});

/**
 * Identidad + hogar activo. `NO_AUTENTICADO` (401) sin sesión válida;
 * `SIN_HOGAR` (403) si el usuario aún no ha creado su hogar: la web lo manda a /bienvenida.
 */
export const getAuthContext = cache(async (): Promise<Result<AuthContext>> => {
  const identity = await getIdentity();
  if (!identity.ok) return identity;

  const membresias = await prisma.miembroHogar.findMany({
    where: { usuarioId: identity.value.userId },
    select: { hogarId: true, createdAt: true },
  });
  const hogarId = elegirHogarActivo(membresias);
  if (hogarId === null) {
    return err(forbiddenError("SIN_HOGAR", "Crea tu hogar para continuar"));
  }

  return ok({ userId: identity.value.userId, hogarId });
});
