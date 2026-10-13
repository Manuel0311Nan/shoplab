import { z } from "zod";
import { validationError } from "@/shared/kernel/errors";
import { err, ok, type Result } from "@/shared/kernel/result";

export async function parseJson<S extends z.ZodType>(
  request: Request,
  schema: S,
): Promise<Result<z.output<S>>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return err(validationError("JSON_NO_VALIDO", "El cuerpo de la petición no es JSON válido"));
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return err(
      validationError("PETICION_NO_VALIDA", "Los datos enviados no son válidos", {
        campos: z.flattenError(parsed.error).fieldErrors,
      }),
    );
  }
  return ok(parsed.data);
}
export function parseId(value: string): Result<string> {
  const parsed = z.uuid().safeParse(value);
  return parsed.success
    ? ok(parsed.data)
    : err(validationError("ID_NO_VALIDO", "El identificador no es válido"));
}
