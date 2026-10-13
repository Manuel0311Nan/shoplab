import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { errorResponseSchema } from "@/contracts/error";
import { getAuthContext } from "@/shared/kernel/auth-context";
import { unauthorizedError } from "@/shared/kernel/errors";
import { err, ok } from "@/shared/kernel/result";
import { apiRoute } from "./api-route";

// auth-context importa "server-only" y env.ts, que no se pueden cargar en Vitest.
vi.mock("@/shared/kernel/auth-context", () => ({ getAuthContext: vi.fn() }));

const AUTH = {
  userId: "0199c000-0000-7000-8000-000000000003",
  hogarId: "0199c000-0000-7000-8000-000000000009",
};
const LIST_ID = "0199c000-0000-7000-8000-000000000001";

function peticion(body?: unknown): Request {
  return new Request("http://localhost/api/v1/test", {
    method: "POST",
    body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
  });
}

const params = <T>(value: T) => ({ params: Promise.resolve(value) });

describe("apiRoute", () => {
  beforeEach(() => {
    vi.mocked(getAuthContext).mockResolvedValue(ok(AUTH));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("apiRoute_ConTodoValido_PasaAuthIdsYCuerpoAlHandler", async () => {
    const handler = vi.fn(async () => new Response(null, { status: 204 }));
    const route = apiRoute({ ids: ["listId"], body: z.object({ nombre: z.string() }) }, handler);

    const response = await route(peticion({ nombre: "Pan" }), params({ listId: LIST_ID }));

    expect(response.status).toBe(204);
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({ auth: AUTH, ids: { listId: LIST_ID }, body: { nombre: "Pan" } }),
    );
  });

  it("apiRoute_SinAutenticar_Devuelve401YNoLlamaAlHandler", async () => {
    vi.mocked(getAuthContext).mockResolvedValue(err(unauthorizedError("NO_AUTENTICADO", "No")));
    const handler = vi.fn(async () => new Response());
    const route = apiRoute({}, handler);

    const response = await route(peticion(), params({}));

    expect(response.status).toBe(401);
    expect(handler).not.toHaveBeenCalled();
  });

  it("apiRoute_ConIdNoUuid_Devuelve400IdNoValido", async () => {
    const route = apiRoute({ ids: ["listId"] }, async () => new Response());

    const response = await route(peticion(), params({ listId: "no-es-un-uuid" }));

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: { code: "ID_NO_VALIDO" } });
  });

  it("apiRoute_ConCuerpoInvalido_Devuelve400ConLosCamposEnDetails", async () => {
    const route = apiRoute({ body: z.object({ nombre: z.string() }) }, async () => new Response());

    const response = await route(peticion({ nombre: 5 }), params({}));

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: { code: "PETICION_NO_VALIDA", details: { campos: { nombre: expect.any(Array) } } },
    });
  });

  it("apiRoute_ConJsonMalFormado_Devuelve400JsonNoValido", async () => {
    const route = apiRoute({ body: z.object({}) }, async () => new Response());

    const response = await route(peticion("{no es json"), params({}));

    expect(await response.json()).toMatchObject({ error: { code: "JSON_NO_VALIDO" } });
  });

  it("apiRoute_SiElHandlerLanza_Devuelve500ConElContratoDeError", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const route = apiRoute({}, async () => {
      throw new Error("La BD no responde");
    });

    const response = await route(peticion(), params({}));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(() => errorResponseSchema.parse(body)).not.toThrow();
    expect(body.error.code).toBe("ERROR_INTERNO");
    expect(JSON.stringify(body)).not.toContain("La BD no responde");
  });
});
