import { describe, expect, it } from "vitest";
import { validationError } from "./errors";
import { err, mapResult, ok } from "./result";

describe("Result", () => {
  it("ok_ConValor_DevuelveExitoConElValor", () => {
    const result = ok(42);

    expect(result).toEqual({ ok: true, value: 42 });
  });

  it("err_ConError_DevuelveFalloConElError", () => {
    const error = validationError("CODIGO", "Mensaje");

    const result = err(error);

    expect(result).toEqual({ ok: false, error });
  });
});

describe("mapResult", () => {
  it("mapResult_ConExito_AplicaLaFuncionAlValor", () => {
    const result = mapResult(ok(21), (n) => n * 2);

    expect(result).toEqual({ ok: true, value: 42 });
  });

  it("mapResult_ConFallo_DevuelveElMismoErrorSinLlamarALaFuncion", () => {
    const error = validationError("CODIGO", "Mensaje");
    let llamada = false;

    const result = mapResult(err(error), () => {
      llamada = true;
      return 0;
    });

    expect(result).toEqual({ ok: false, error });
    expect(llamada).toBe(false);
  });
});
