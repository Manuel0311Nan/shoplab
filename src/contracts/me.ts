import { z } from "zod";

export const meResponseSchema = z.object({
  userId: z.uuid(),
  hogarId: z.uuid(),
});

export type MeResponse = z.infer<typeof meResponseSchema>;