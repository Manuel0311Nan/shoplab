import { z } from "zod";
import { validationError } from "./errors";
import { err, ok, type Result } from "./result";

/**
 * Posición de la última fila recibida en una paginación por cursor (keyset):
 * la fecha de la columna por la que se ordena y el id que desempata.
 */
export interface Cursor {
  readonly fecha: Date;
  readonly id: string;
}

const cursorSchema = z.object({ f: z.iso.datetime(), i: z.uuid() });

/** El cursor viaja opaco (JSON en base64url): el cliente solo lo devuelve, no lo interpreta. */
export function codificarCursor(cursor: Cursor): string {
  const json = JSON.stringify({ f: cursor.fecha.toISOString(), i: cursor.id });
  return Buffer.from(json, "utf8").toString("base64url");
}

export function decodificarCursor(texto: string): Result<Cursor> {
  const noValido = err(validationError("CURSOR_NO_VALIDO", "El cursor de paginación no es válido"));
  let datos: unknown;
  try {
    datos = JSON.parse(Buffer.from(texto, "base64url").toString("utf8"));
  } catch {
    return noValido;
  }
  const parsed = cursorSchema.safeParse(datos);
  if (!parsed.success) return noValido;
  return ok({ fecha: new Date(parsed.data.f), id: parsed.data.i });
}
