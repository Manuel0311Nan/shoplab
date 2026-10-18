import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { bearer } from "better-auth/plugins";
import { env } from "@/env";
import { newId } from "./ids";
import { prisma } from "./prisma";

const DIA = 60 * 60 * 24;

/** Orígenes desde los que se acepta un login: la URL de la app y, en Vercel, la del despliegue. */
const trustedOrigins = [env.BETTER_AUTH_URL];
if (env.VERCEL_URL !== undefined) trustedOrigins.push(`https://${env.VERCEL_URL}`);

/**
 * Instancia de Better Auth: registro, login, sesiones y límite de peticiones.
 *
 * - Vive en el kernel junto a `auth-context.ts`, que es quien la usa (como `prisma.ts`).
 * - Usa el `prisma` del kernel, sin extensión de tenant: estas tablas no tienen `hogarId`.
 * - Los endpoints HTTP se montan en `/api/v1/auth/*` (ver `app/api/v1/auth/[...all]`).
 * - El login de la web llama a esos endpoints desde el cliente, nunca a `auth.api.signInEmail`
 *   desde el servidor: las llamadas de servidor no pasan por el límite de peticiones.
 */
export const auth = betterAuth({
  appName: "ShopList",
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  basePath: "/api/v1/auth",
  trustedOrigins,
  database: prismaAdapter(prisma, { provider: "postgresql" }),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    // El registro deja la sesión abierta y la web pasa directamente a /bienvenida.
    autoSignIn: true,
  },

  // Nuestro modelo `Usuario` hace de tabla `user` de Better Auth.
  user: { modelName: "usuario", fields: { name: "nombre" } },
  session: {
    fields: { userId: "usuarioId" },
    expiresIn: 30 * DIA,
    // Una sesión usada se alarga, como mucho, una vez al día.
    updateAge: DIA,
  },
  account: { fields: { userId: "usuarioId" } },

  // Contadores en Postgres: en Vercel cada instancia tiene su propia memoria.
  rateLimit: { storage: "database" },

  advanced: {
    // Mismos ids que el resto del proyecto: UUIDv7 en columnas @db.Uuid.
    database: { generateId: () => newId() },
  },

  telemetry: { enabled: false },

  // `bearer`: la app móvil manda la sesión en `Authorization: Bearer`.
  // `nextCookies` tiene que ser el último plugin.
  plugins: [bearer(), nextCookies()],
});

export type AuthSession = typeof auth.$Infer.Session;
