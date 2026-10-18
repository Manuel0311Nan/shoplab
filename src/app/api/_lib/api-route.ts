import { unstable_rethrow } from "next/navigation";
import type { z } from "zod";
import {
  getAuthContext,
  getIdentity,
  type AuthContext,
  type Identity,
} from "@/shared/kernel/auth-context";
import { parseId, parseJson } from "./parse";
import { errorResponse, internalErrorResponse } from "./responses";

type Ids<K extends string> = { readonly [P in K]: string };

type Body<S> = S extends z.ZodType ? z.output<S> : undefined;

/** "hogar" (por defecto): sesión + hogar activo. "identidad": basta la sesión (crear el hogar). */
export type NivelAuth = "hogar" | "identidad";

type AuthDe<N extends NivelAuth> = N extends "identidad" ? Identity : AuthContext;

export interface ApiRouteOptions<
  K extends string,
  S extends z.ZodType | undefined,
  N extends NivelAuth = "hogar",
> {
  /** Qué exige la ruta. Por defecto, un usuario con hogar. */
  readonly auth?: N;
  /**
   * Segmentos dinámicos de la ruta que son UUID. Deben llamarse igual que las
   * carpetas (`[listId]` → `"listId"`): `next typegen` + `tsc` lo comprueban.
   */
  readonly ids?: readonly K[];
  /** Esquema Zod del cuerpo JSON. Si se omite, el cuerpo no se lee. */
  readonly body?: S;
}

export interface ApiRouteContext<K extends string, S, N extends NivelAuth = "hogar"> {
  readonly request: Request;
  readonly auth: AuthDe<N>;
  readonly ids: Ids<K>;
  readonly body: Body<S>;
}

/**
 * Envuelve un Route Handler con los pasos comunes de toda la API:
 * autenticar → validar ids → validar cuerpo → handler. Cualquier excepción
 * no prevista se registra y se convierte en un 500 con el contrato de error.
 *
 * @example
 * export const POST = apiRoute(
 *   { ids: ["listId"], body: addItemRequestSchema },
 *   async ({ auth, ids, body }) => resultResponse(await useCase.execute(...)),
 * );
 */
export function apiRoute<
  const K extends string = never,
  S extends z.ZodType | undefined = undefined,
  const N extends NivelAuth = "hogar",
>(
  options: ApiRouteOptions<K, S, N>,
  handler: (ctx: ApiRouteContext<K, S, N>) => Promise<Response>,
) {
  return async (request: Request, context: { params: Promise<Ids<K>> }): Promise<Response> => {
    try {
      const auth = options.auth === "identidad" ? await getIdentity() : await getAuthContext();
      if (!auth.ok) return errorResponse(auth.error);

      const params = await context.params;
      const ids = {} as Record<K, string>;
      for (const name of options.ids ?? []) {
        const id = parseId(params[name]);
        if (!id.ok) return errorResponse(id.error);
        ids[name] = id.value;
      }

      let body: unknown;
      if (options.body !== undefined) {
        const parsed = await parseJson(request, options.body);
        if (!parsed.ok) return errorResponse(parsed.error);
        body = parsed.value;
      }

      return await handler({
        request,
        auth: auth.value as AuthDe<N>,
        ids,
        body: body as Body<S>,
      });
    } catch (error) {
      // Deja pasar redirect(), notFound() y similares: Next los implementa con throw.
      unstable_rethrow(error);
      console.error(`[api] ${request.method} ${new URL(request.url).pathname}`, error);
      return internalErrorResponse();
    }
  };
}
