import { unstable_rethrow } from "next/navigation";
import type { z } from "zod";
import { getAuthContext, type AuthContext } from "@/shared/kernel/auth-context";
import { parseId, parseJson } from "./parse";
import { errorResponse, internalErrorResponse } from "./responses";

type Ids<K extends string> = { readonly [P in K]: string };

type Body<S> = S extends z.ZodType ? z.output<S> : undefined;

export interface ApiRouteOptions<K extends string, S extends z.ZodType | undefined> {
  /**
   * Segmentos dinámicos de la ruta que son UUID. Deben llamarse igual que las
   * carpetas (`[listId]` → `"listId"`): `next typegen` + `tsc` lo comprueban.
   */
  readonly ids?: readonly K[];
  /** Esquema Zod del cuerpo JSON. Si se omite, el cuerpo no se lee. */
  readonly body?: S;
}

export interface ApiRouteContext<K extends string, S> {
  readonly request: Request;
  readonly auth: AuthContext;
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
>(options: ApiRouteOptions<K, S>, handler: (ctx: ApiRouteContext<K, S>) => Promise<Response>) {
  return async (request: Request, context: { params: Promise<Ids<K>> }): Promise<Response> => {
    try {
      const auth = await getAuthContext();
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

      return await handler({ request, auth: auth.value, ids, body: body as Body<S> });
    } catch (error) {
      // Deja pasar redirect(), notFound() y similares: Next los implementa con throw.
      unstable_rethrow(error);
      console.error(`[api] ${request.method} ${new URL(request.url).pathname}`, error);
      return internalErrorResponse();
    }
  };
}
