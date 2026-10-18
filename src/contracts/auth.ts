import { z } from "zod";

/**
 * Formularios de registro y login. Los endpoints son de Better Auth
 * (`/api/v1/auth/sign-up/email`, `/sign-in/email`), que vuelven a validar en el servidor;
 * estos esquemas validan antes de enviar y documentan el contrato para la app.
 */
const email = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Escribe tu email")
  .pipe(z.email("Ese email no parece válido"));

export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 128;

export const registerRequestSchema = z.object({
  name: z.string().trim().min(1, "Escribe tu nombre").max(80, "Máximo 80 caracteres"),
  email,
  password: z
    .string()
    .min(PASSWORD_MIN, `Mínimo ${PASSWORD_MIN} caracteres`)
    .max(PASSWORD_MAX, `Máximo ${PASSWORD_MAX} caracteres`),
});

export const loginRequestSchema = z.object({
  email,
  password: z.string().min(1, "Escribe tu contraseña").max(PASSWORD_MAX),
});

export type RegisterRequest = z.infer<typeof registerRequestSchema>;
export type LoginRequest = z.infer<typeof loginRequestSchema>;
