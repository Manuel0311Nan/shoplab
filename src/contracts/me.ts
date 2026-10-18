import { z } from "zod";

export const meResponseSchema = z.object({
  userId: z.uuid(),
  nombre: z.string(),
  email: z.email(),
  /** `null` mientras el usuario no ha creado su hogar: la app debe llevarle al alta. */
  hogarId: z.uuid().nullable(),
});

export type MeResponse = z.infer<typeof meResponseSchema>;
