import { describe, expect, it } from "vitest";
import { errorResponseSchema } from "@/contracts/error";
import type { ErrorType } from "@/shared/kernel/errors";
import { err, ok } from "@/shared/kernel/result";
import { errorResponse, resultResponse } from "./responses";

describe("resultResponse", () => {
  it("resultResponse_ConExito_Devuelve200ConElValor", async () => {
    const response = resultResponse(ok({ nombre: "Leche" }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ nombre: "Leche" });
  });

  it("resultResponse_ConExitoYEstadoPersonalizado_DevuelveEseEstado", () => {
    const response = resultResponse(ok({}), 201);

    expect(response.status).toBe(201);
  });

  it.each<[ErrorType, number]>([
    ["validation", 400],
    ["unauthorized", 401],
    ["forbidden", 403],
    ["not_found", 404],
    ["conflict", 409],
  ])("resultResponse_ConErrorDeTipo_%s_Devuelve%i", (type, status) => {
    const response = resultResponse(err({ type, code: "CODIGO", message: "Mensaje" }));

    expect(response.status).toBe(status);
  });
});

describe("errorResponse", () => {
  it("errorResponse_ConError_CumpleElContratoYNoExponeElTipo", async () => {
    const response = errorResponse({
      type: "not_found",
      code: "LISTA_NO_ENCONTRADA",
      message: "La lista no existe",
    });

    const body = await response.json();

    expect(() => errorResponseSchema.parse(body)).not.toThrow();
    expect(body.error).not.toHaveProperty("type");
  });
});
