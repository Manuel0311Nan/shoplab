import { z } from "zod";

/**
 * Página de una colección con cursor opaco: el cliente reenvía `nextCursor` tal cual
 * (`?cursor=`) para la siguiente página; `null` significa que no hay más.
 */
export function paginaSchema<T extends z.ZodType>(item: T) {
  return z.object({ items: z.array(item), nextCursor: z.string().nullable() });
}
