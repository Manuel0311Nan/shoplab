import "server-only";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  /** Conexión con pooling: la usa la app. */
  DATABASE_URL: z.url(),
  /** Conexión directa: la usa la CLI de Prisma (prisma.config.ts). La integración Neon↔Vercel la define siempre. */
  DATABASE_URL_UNPOOLED: z.url(),
  /** Firma cookies y tokens de sesión. Uno distinto por entorno; nunca en el repo. */
  BETTER_AUTH_SECRET: z.string().min(32, "BETTER_AUTH_SECRET debe tener al menos 32 caracteres"),
  /** URL pública de la app (p. ej. http://localhost:3000). Better Auth rechaza otros orígenes. */
  BETTER_AUTH_URL: z.url(),
  /** La define Vercel en cada despliegue (sin protocolo). Se añade a los orígenes de confianza. */
  VERCEL_URL: z.string().optional(),
  /**
   * Vercel la envía como `Authorization: Bearer …` al llamar a los crons de vercel.json.
   * Opcional para no exigirla en local; sin ella, las rutas de cron responden 401.
   */
  CRON_SECRET: z.string().min(16, "CRON_SECRET debe tener al menos 16 caracteres").optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(`Variables de entorno inválidas:\n${z.prettifyError(parsed.error)}`);
}

export const env = parsed.data;
