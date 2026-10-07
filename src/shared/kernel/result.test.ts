import { describe, expect, it } from "vitest";
import { validationError } from "./errors";
import { err, ok } from "./result";

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
