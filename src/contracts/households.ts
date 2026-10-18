import { z } from "zod";

export const createHouseholdRequestSchema = z.object({
  /** UUIDv7 generado en el cliente: un segundo envío con el mismo id no crea otro hogar. */
  id: z.uuid().optional(),
  nombre: z.string().trim().min(1, "Ponle un nombre a tu hogar").max(60, "Máximo 60 caracteres"),
});

export const householdResponseSchema = z.object({
  id: z.uuid(),
  nombre: z.string(),
  /** Lista creada con el hogar; `null` si no se pudo crear (el hogar sí existe). */
  primeraListaId: z.uuid().nullable(),
  createdAt: z.iso.datetime(),
});

export type CreateHouseholdRequest = z.input<typeof createHouseholdRequestSchema>;
export type HouseholdResponse = z.infer<typeof householdResponseSchema>;
